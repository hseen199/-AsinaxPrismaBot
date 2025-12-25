import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated } from "./localAuth";
import { analyzeSentiment, analyzeTradeSignal } from "./openai";
import { mexcService } from "./mexc";
import { smcService, analyzeSMC, generateSMCSignal, type Candle } from "./smc";
import { getOrCreateAgent, resetAgent } from "./rl-agent";
import { telegramService } from "./telegram";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { notificationService } from "./websocket";
import { generateDailyReport, generateWeeklySummary, sendWeeklyReportEmail, sendDailyReportEmail } from "./reports";
import rateLimit from "express-rate-limit";
import {
  insertTransactionSchema,
  insertUserSharesSchema,
  insertBotSettingsSchema,
  insertNotificationSettingsSchema,
} from "@shared/schema";
import { z } from "zod";
import pRetry, { AbortError } from "p-retry";
import bcrypt from "bcryptjs";

// Rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { message: "طلبات كثيرة جداً، حاول مرة أخرى بعد 15 دقيقة" },
  standardHeaders: true,
  legacyHeaders: false,
});

const withdrawLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 withdrawal attempts per hour
  message: { message: "تجاوزت الحد الأقصى لطلبات السحب، حاول بعد ساعة" },
  standardHeaders: true,
  legacyHeaders: false,
});

const klinesCache: Map<string, { candles: Candle[]; timestamp: number }> = new Map();
const KLINES_CACHE_TTL = 10000; // تحديث كل 10 ثواني فقط للبيانات الحية

interface KlinesResult {
  candles: Candle[];
  source: "live" | "cache" | "stale_cache";
  cacheAge?: number;
}

async function fetchKlinesWithRetry(symbol: string): Promise<KlinesResult> {
  const cacheKey = symbol.toUpperCase();
  const cached = klinesCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < KLINES_CACHE_TTL) {
    return { 
      candles: cached.candles, 
      source: "cache",
      cacheAge: Math.round((Date.now() - cached.timestamp) / 1000)
    };
  }
  
  try {
    const candles = await pRetry(
      async () => {
        const klines = await mexcService.getKlines(symbol, "15m", 100);
        return klines.map(kline => ({
          time: kline.openTime,
          open: kline.open,
          high: kline.high,
          low: kline.low,
          close: kline.close,
          volume: kline.volume,
        }));
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
        shouldRetry: (error: any) => {
          const errorMsg = String(error?.message || "");
          if (errorMsg.includes("401") || errorMsg.includes("403")) {
            return false;
          }
          return true;
        },
        onFailedAttempt: (error) => {
          console.log(`Klines fetch attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
        },
      }
    );
    
    klinesCache.set(cacheKey, { candles, timestamp: Date.now() });
    return { candles, source: "live" };
  } catch (error) {
    if (cached) {
      console.log(`Using stale cache for ${cacheKey} after API failure`);
      return { 
        candles: cached.candles, 
        source: "stale_cache",
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000)
      };
    }
    throw error;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupLocalAuth(app);
  
  notificationService.initialize(httpServer);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Session-based logout
  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Error destroying session:", err);
        res.status(500).json({ message: "Failed to logout" });
        return;
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Email/Password Registration
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const { firstName, lastName, email, birthDate, password } = req.body;
      
      if (!firstName || !lastName || !email || !birthDate || !password) {
        res.status(400).json({ message: "جميع الحقول مطلوبة" });
        return;
      }

      // Server-side age validation (must be 18+)
      const birthDateObj = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
      }
      if (age < 18) {
        res.status(400).json({ message: "يجب أن يكون عمرك 18 سنة على الأقل" });
        return;
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: "البريد الإلكتروني مسجل مسبقاً" });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const user = await storage.upsertUser({
        email,
        firstName,
        lastName,
        role: "user",
      });

      // Create credentials
      await storage.createUserCredentials({
        userId: user.id,
        passwordHash,
        verified: false,
        verificationCode,
        verificationExpires,
      });

      // Create profile
      await storage.createUserProfile({
        userId: user.id,
        birthDate: new Date(birthDate),
      });

      // Record terms acceptance
      await storage.createTermsAcceptance({
        userId: user.id,
        version: "1.0",
        ipAddress: req.ip || null,
      });

      // Send verification email
      const emailSent = await sendVerificationEmail(email, verificationCode, firstName);
      
      res.json({ 
        message: emailSent 
          ? "تم التسجيل بنجاح! تم إرسال رمز التحقق إلى بريدك الإلكتروني" 
          : "تم التسجيل بنجاح",
        emailSent,
        verificationCode, // Keep for frontend OTP flow
        userId: user.id
      });
    } catch (error) {
      console.error("Error in registration:", error);
      res.status(500).json({ message: "حدث خطأ أثناء التسجيل" });
    }
  });

  // Email/Password Login
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
        return;
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        return;
      }

      const credentials = await storage.getUserCredentialsByUserId(user.id);
      if (!credentials) {
        res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        return;
      }

      const isValid = await bcrypt.compare(password, credentials.passwordHash);
      if (!isValid) {
        res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        return;
      }

      // TEMPORARILY DISABLED: Verification check
      // if (!credentials.verified) {
      //   res.json({ 
      //     needsVerification: true,
      //     message: "يرجى تأكيد حسابك أولاً"
      //   });
      //   return;
      // }

      // Set session
      (req as any).session.userId = user.id;
      
      res.json({ 
        message: "تم تسجيل الدخول بنجاح",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      });
    } catch (error) {
      console.error("Error in login:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
    }
  });

  // Verify account
  app.post("/api/auth/verify", authLimiter, async (req, res) => {
    try {
      const { email, verificationCode } = req.body;
      
      if (!email || !verificationCode) {
        res.status(400).json({ message: "البريد الإلكتروني ورمز التحقق مطلوبان" });
        return;
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(404).json({ message: "المستخدم غير موجود" });
        return;
      }

      const credentials = await storage.getUserCredentialsByUserId(user.id);
      if (!credentials) {
        res.status(404).json({ message: "بيانات الاعتماد غير موجودة" });
        return;
      }

      if (credentials.verified) {
        res.status(400).json({ message: "الحساب مُفعّل بالفعل" });
        return;
      }

      if (credentials.verificationCode !== verificationCode) {
        res.status(400).json({ message: "رمز التحقق غير صحيح" });
        return;
      }

      if (credentials.verificationExpires && new Date() > credentials.verificationExpires) {
        res.status(400).json({ message: "انتهت صلاحية رمز التحقق" });
        return;
      }

      await storage.verifyUser(user.id);
      
      // Set session
      (req as any).session.userId = user.id;

      res.json({ 
        message: "تم تأكيد الحساب بنجاح",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      });
    } catch (error) {
      console.error("Error in verification:", error);
      res.status(500).json({ message: "حدث خطأ أثناء التحقق" });
    }
  });

  // Resend verification code
  app.post("/api/auth/resend-code", authLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
        return;
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(404).json({ message: "المستخدم غير موجود" });
        return;
      }

      const credentials = await storage.getUserCredentialsByUserId(user.id);
      if (!credentials) {
        res.status(404).json({ message: "بيانات الاعتماد غير موجودة" });
        return;
      }

      if (credentials.verified) {
        res.status(400).json({ message: "الحساب مُفعّل بالفعل" });
        return;
      }

      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Update credentials with new code
      await storage.updateUserCredentials(user.id, {
        verificationCode,
        verificationExpires,
      });

      // Send verification email
      let emailSent = false;
      try {
        emailSent = await sendVerificationEmail(email, verificationCode, user.firstName || "");
      } catch (emailError) {
        console.error("Email service error:", emailError);
      }

      if (emailSent) {
        res.json({ message: "تم إرسال رمز التحقق الجديد إلى بريدك الإلكتروني" });
      } else {
        res.status(503).json({ message: "خدمة البريد الإلكتروني غير متاحة حالياً، حاول مرة أخرى لاحقاً" });
      }
    } catch (error) {
      console.error("Error resending verification code:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إعادة إرسال الرمز" });
    }
  });

  // Password reset - request code
  app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
        return;
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(404).json({ message: "البريد الإلكتروني غير مسجل" });
        return;
      }

      const credentials = await storage.getUserCredentialsByUserId(user.id);
      if (!credentials) {
        res.status(404).json({ message: "بيانات الاعتماد غير موجودة" });
        return;
      }

      // Generate 6-digit reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset code in verification fields
      await storage.updateUserCredentials(user.id, {
        verificationCode: resetCode,
        verificationExpires: resetExpires,
      });

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(email, resetCode, user.firstName || "");

      if (emailSent) {
        res.json({ message: "تم إرسال رمز استعادة كلمة المرور إلى بريدك الإلكتروني" });
      } else {
        res.status(503).json({ message: "خدمة البريد الإلكتروني غير متاحة حالياً" });
      }
    } catch (error) {
      console.error("Error in forgot-password:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إرسال رمز الاستعادة" });
    }
  });

  // Password reset - reset with code
  app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
    try {
      const { email, resetCode, newPassword } = req.body;
      
      if (!email || !resetCode || !newPassword) {
        res.status(400).json({ message: "جميع الحقول مطلوبة" });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
        return;
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(404).json({ message: "المستخدم غير موجود" });
        return;
      }

      const credentials = await storage.getUserCredentialsByUserId(user.id);
      if (!credentials) {
        res.status(404).json({ message: "بيانات الاعتماد غير موجودة" });
        return;
      }

      if (credentials.verificationCode !== resetCode) {
        res.status(400).json({ message: "رمز الاستعادة غير صحيح" });
        return;
      }

      if (credentials.verificationExpires && new Date() > credentials.verificationExpires) {
        res.status(400).json({ message: "انتهت صلاحية رمز الاستعادة" });
        return;
      }

      // Hash new password and update
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await storage.updateUserCredentials(user.id, {
        passwordHash,
        verificationCode: null,
        verificationExpires: null,
      });

      res.json({ message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      console.error("Error in reset-password:", error);
      res.status(500).json({ message: "حدث خطأ أثناء تغيير كلمة المرور" });
    }
  });

  // User shares endpoints - calculates real-time value based on pool
  app.get("/api/user/shares", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      let shares = await storage.getUserShares(userId);
      
      if (!shares) {
        shares = await storage.createUserShares({
          userId,
          totalShares: "0",
          totalDeposited: "0",
          currentValue: "0",
          profitLoss: "0",
          profitLossPercent: "0",
        });
      }
      
      // Calculate real-time value based on pool stats
      const userShareCount = parseFloat(shares.totalShares || "0");
      const totalDeposited = parseFloat(shares.totalDeposited || "0");
      
      if (userShareCount > 0) {
        try {
          // Get pool value from MEXC
          let totalPoolValue = 0;
          let isLiveData = false;
          
          try {
            const balances = await mexcService.getAccountBalance();
            const tickers = await mexcService.getTicker24h();
            const priceMap: Record<string, number> = { "USDT": 1 };
            
            tickers.forEach(ticker => {
              if (ticker.symbol.endsWith("USDT")) {
                const asset = ticker.symbol.replace("USDT", "");
                priceMap[asset] = parseFloat(ticker.lastPrice);
              }
            });
            
            // Calculate total value from available balances only (free, not locked in orders)
            for (const balance of balances) {
              const freeBalance = parseFloat(balance.free);
              const lockedBalance = parseFloat(balance.locked);
              const totalBalance = freeBalance + lockedBalance;
              const price = priceMap[balance.asset] || 0;
              totalPoolValue += totalBalance * price;
            }
            isLiveData = true;
          } catch (e) {
            // Fallback to portfolio history if MEXC fails - don't update database
            const history = await storage.getPortfolioHistory(1);
            if (history[0]) {
              totalPoolValue = parseFloat(history[0].totalValue);
            }
          }
          
          // Get total shares from all users
          const allUsers = await storage.getAllUserShares();
          const totalSharesInPool = allUsers.reduce((sum, u) => sum + parseFloat(u.totalShares || "0"), 0);
          
          // Calculate user's portion of the pool
          if (totalSharesInPool > 0 && totalPoolValue > 0) {
            const userShareRatio = userShareCount / totalSharesInPool;
            const currentValue = totalPoolValue * userShareRatio;
            const profitLoss = currentValue - totalDeposited;
            const profitLossPercent = totalDeposited > 0 ? (profitLoss / totalDeposited) * 100 : 0;
            
            // Only update database with live data, not fallback data
            if (isLiveData) {
              await storage.updateUserShares(userId, {
                currentValue: currentValue.toFixed(2),
                profitLoss: profitLoss.toFixed(2),
                profitLossPercent: profitLossPercent.toFixed(2),
              });
            }
            
            // Return calculated shares (live or fallback)
            shares = {
              ...shares,
              currentValue: currentValue.toFixed(2),
              profitLoss: profitLoss.toFixed(2),
              profitLossPercent: profitLossPercent.toFixed(2),
            };
          }
        } catch (calcError) {
          console.log("Could not calculate real-time value:", calcError);
        }
      }
      
      res.json(shares);
    } catch (error) {
      console.error("Error fetching user shares:", error);
      res.status(500).json({ message: "Failed to fetch user shares" });
    }
  });

  app.post("/api/user/shares", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const data = insertUserSharesSchema.parse({ ...req.body, userId });
      
      const existing = await storage.getUserShares(userId);
      if (existing) {
        const updated = await storage.updateUserShares(userId, data);
        res.json(updated);
      } else {
        const created = await storage.createUserShares(data);
        res.json(created);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
        return;
      }
      console.error("Error updating user shares:", error);
      res.status(500).json({ message: "Failed to update user shares" });
    }
  });

  // Transactions endpoints - support both /api/transactions and /api/user/transactions
  const transactionsHandler = async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const txns = await storage.getTransactions(userId);
      res.json(txns);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  };
  
  app.get("/api/transactions", isAuthenticated, transactionsHandler);
  app.get("/api/user/transactions", isAuthenticated, transactionsHandler);

  app.post("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const data = insertTransactionSchema.parse({ ...req.body, userId });
      const amount = parseFloat(data.amount);
      
      // Get user shares first to validate
      const shares = await storage.getUserShares(userId);
      
      // For withdrawals, check sufficient balance
      if (data.type === "withdrawal") {
        if (!shares) {
          res.status(400).json({ message: "No balance found for this user" });
          return;
        }
        const currentBalance = parseFloat(shares.currentValue || "0");
        if (currentBalance < amount) {
          res.status(400).json({ 
            message: "Insufficient balance",
            currentBalance: currentBalance.toFixed(2),
            requestedAmount: amount.toFixed(2)
          });
          return;
        }
      }
      
      const transaction = await storage.createTransaction(data);
      
      // Update user shares based on transaction type
      if (shares) {
        if (data.type === "deposit") {
          const newDeposited = (parseFloat(shares.totalDeposited) + amount).toString();
          const newShares = (parseFloat(shares.totalShares) + amount).toString();
          await storage.updateUserShares(userId, {
            totalDeposited: newDeposited,
            totalShares: newShares,
            currentValue: newShares,
          });
        } else if (data.type === "withdrawal") {
          const newDeposited = Math.max(0, parseFloat(shares.totalDeposited) - amount).toString();
          const newShares = Math.max(0, parseFloat(shares.totalShares) - amount).toString();
          const newValue = Math.max(0, parseFloat(shares.currentValue || "0") - amount).toString();
          await storage.updateUserShares(userId, {
            totalDeposited: newDeposited,
            totalShares: newShares,
            currentValue: newValue,
          });
        }
      }
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
        return;
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Trades endpoints
  app.get("/api/trades", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const tradesList = await storage.getTrades(limit);
      res.json(tradesList);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Portfolio history endpoints
  app.get("/api/portfolio/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const history = await storage.getPortfolioHistory(limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching portfolio history:", error);
      res.status(500).json({ message: "Failed to fetch portfolio history" });
    }
  });

  // Record current portfolio snapshot
  app.post("/api/portfolio/snapshot", async (req, res) => {
    try {
      let totalValueUSD = 0;
      
      try {
        const balances = await mexcService.getAccountBalance();
        const tickers = await mexcService.getTicker24h();
        const priceMap: Record<string, number> = { "USDT": 1 };
        
        tickers.forEach(ticker => {
          if (ticker.symbol.endsWith("USDT")) {
            const asset = ticker.symbol.replace("USDT", "");
            priceMap[asset] = parseFloat(ticker.lastPrice);
          }
        });
        
        for (const balance of balances) {
          const totalBalance = parseFloat(balance.free) + parseFloat(balance.locked);
          const price = priceMap[balance.asset] || 0;
          totalValueUSD += totalBalance * price;
        }
      } catch (error) {
        console.log("Could not fetch MEXC balance for snapshot");
        res.status(503).json({ message: "Could not connect to MEXC" });
        return;
      }
      
      const allUsers = await storage.getAllUserShares();
      const totalShares = allUsers.reduce((sum, user) => sum + parseFloat(user.totalShares || "0"), 0);
      const pricePerShare = totalShares > 0 ? totalValueUSD / totalShares : 1;
      
      // Get previous snapshot to calculate daily change
      const previousHistory = await storage.getPortfolioHistory(1);
      let dailyChange = "0";
      let dailyChangePercent = "0";
      
      if (previousHistory.length > 0) {
        const prevValue = parseFloat(previousHistory[0].totalValue);
        dailyChange = (totalValueUSD - prevValue).toFixed(2);
        dailyChangePercent = prevValue > 0 ? (((totalValueUSD - prevValue) / prevValue) * 100).toFixed(2) : "0";
      }
      
      const snapshot = await storage.createPortfolioHistory({
        totalValue: totalValueUSD.toFixed(2),
        totalShares: totalShares.toFixed(8),
        pricePerShare: pricePerShare.toFixed(8),
        dailyChange,
        dailyChangePercent,
      });
      
      res.json(snapshot);
    } catch (error) {
      console.error("Error creating portfolio snapshot:", error);
      res.status(500).json({ message: "Failed to create portfolio snapshot" });
    }
  });

  // ==========================================
  // NEW ENDPOINTS FOR TRADING CORE INTEGRATION
  // ==========================================

  // Get latest NAV snapshot
  app.get("/api/portfolio/nav", async (req, res) => {
    try {
      const navSnapshots = await storage.getPortfolioNavHistory(1);
      if (navSnapshots.length === 0) {
        res.json({
          totalEquityUsdt: "0",
          cashUsdt: "0",
          holdingsValueUsdt: "0",
          unrealizedPnlUsdt: "0",
          realizedPnlUsdt: "0",
          feesUsdt: "0",
          totalSharesOutstanding: "0",
          navPerShare: "1",
          recordedAt: new Date().toISOString(),
        });
        return;
      }
      res.json(navSnapshots[0]);
    } catch (error) {
      console.error("Error fetching NAV:", error);
      res.status(500).json({ message: "Failed to fetch NAV" });
    }
  });

  // Get NAV history
  app.get("/api/portfolio/nav/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const navHistory = await storage.getPortfolioNavHistory(limit);
      res.json(navHistory);
    } catch (error) {
      console.error("Error fetching NAV history:", error);
      res.status(500).json({ message: "Failed to fetch NAV history" });
    }
  });

  // Get user's ledger entries
  app.get("/api/user/ledger", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const ledger = await storage.getUserLedgerEntries(userId, limit);
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching user ledger:", error);
      res.status(500).json({ message: "Failed to fetch user ledger" });
    }
  });

  // Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const ordersList = await storage.getOrders(limit);
      res.json(ordersList);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get order with fills
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      const fills = await storage.getOrderFills(id);
      res.json({ ...order, fills });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Get current holdings
  app.get("/api/holdings", async (req, res) => {
    try {
      const holdingsList = await storage.getHoldings();
      res.json(holdingsList);
    } catch (error) {
      console.error("Error fetching holdings:", error);
      res.status(500).json({ message: "Failed to fetch holdings" });
    }
  });

  // Get user notifications from DB
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark notification read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications read:", error);
      res.status(500).json({ message: "Failed to mark all notifications read" });
    }
  });

  // Sentiment analysis endpoints
  app.get("/api/sentiment", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const sentiments = await storage.getAllSentiments(limit);
      res.json(sentiments);
    } catch (error) {
      console.error("Error fetching sentiments:", error);
      res.status(500).json({ message: "Failed to fetch sentiments" });
    }
  });

  app.get("/api/sentiment/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const sentiment = await storage.getSentiment(symbol.toUpperCase());
      res.json(sentiment || { sentiment: "neutral", score: 0, summary: "No analysis available" });
    } catch (error) {
      console.error("Error fetching sentiment:", error);
      res.status(500).json({ message: "Failed to fetch sentiment" });
    }
  });

  app.post("/api/sentiment/analyze", isAuthenticated, async (req, res) => {
    try {
      const { symbol, newsContext } = req.body;
      
      if (!symbol) {
        res.status(400).json({ message: "Symbol is required" });
        return;
      }

      const result = await analyzeSentiment(symbol.toUpperCase(), newsContext);
      
      const saved = await storage.createSentiment({
        symbol: symbol.toUpperCase(),
        sentiment: result.sentiment,
        score: result.score.toString(),
        summary: result.summary,
        confidence: result.confidence.toString(),
        newsSource: newsContext || null,
      });
      
      res.json(saved);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      res.status(500).json({ message: "Failed to analyze sentiment" });
    }
  });

  // Bot settings endpoints
  app.get("/api/bot/settings", async (req, res) => {
    try {
      let settings = await storage.getBotSettings();
      
      if (!settings) {
        settings = await storage.updateBotSettings({
          isActive: false,
          maxRiskPercent: "5",
          stopLossPercent: "3",
          takeProfitPercent: "10",
          maxPositionSize: "1000",
          tradingPairs: ["BTC/USDT", "ETH/USDT"],
          useAiSentiment: true,
          useRsi: true,
          useMacd: true,
          useMovingAverages: true,
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching bot settings:", error);
      res.status(500).json({ message: "Failed to fetch bot settings" });
    }
  });

  app.patch("/api/bot/settings", isAuthenticated, async (req, res) => {
    try {
      const data = insertBotSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateBotSettings(data);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
        return;
      }
      console.error("Error updating bot settings:", error);
      res.status(500).json({ message: "Failed to update bot settings" });
    }
  });

  // Market data endpoints - support both /api/market and /api/market/data
  const marketDataHandler = async (req: any, res: any) => {
    try {
      const data = await storage.getMarketData();
      
      if (data.length === 0) {
        const defaultData = [
          { symbol: "BTC/USDT", price: "43250.50", change24h: "1250.00", changePercent24h: "2.98", volume24h: "1250000000", high24h: "43800.00", low24h: "41900.00" },
          { symbol: "ETH/USDT", price: "2280.75", change24h: "85.25", changePercent24h: "3.88", volume24h: "520000000", high24h: "2320.00", low24h: "2180.00" },
          { symbol: "SOL/USDT", price: "98.45", change24h: "-2.15", changePercent24h: "-2.14", volume24h: "180000000", high24h: "102.50", low24h: "96.20" },
          { symbol: "XRP/USDT", price: "0.6245", change24h: "0.0125", changePercent24h: "2.04", volume24h: "95000000", high24h: "0.6350", low24h: "0.6080" },
        ];
        
        for (const item of defaultData) {
          await storage.upsertMarketData(item);
        }
        
        res.json(defaultData);
        return;
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  };
  
  app.get("/api/market/data", marketDataHandler);
  app.get("/api/market", marketDataHandler);

  // AI Trading signal endpoint
  app.post("/api/ai/signal", isAuthenticated, async (req, res) => {
    try {
      const { symbol, price, change24h, rsi, macd, sma } = req.body;
      
      if (!symbol || !price) {
        res.status(400).json({ message: "Symbol and price are required" });
        return;
      }

      const signal = await analyzeTradeSignal(
        symbol,
        { price: parseFloat(price), change24h: parseFloat(change24h || "0") },
        { rsi, macd, sma }
      );
      
      res.json(signal);
    } catch (error) {
      console.error("Error generating AI signal:", error);
      res.status(500).json({ message: "Failed to generate trading signal" });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const portfolioHistory = await storage.getPortfolioHistory(1);
      const trades = await storage.getTrades(100);
      const settings = await storage.getBotSettings();
      
      const latestPortfolio = portfolioHistory[0];
      const winningTrades = trades.filter(t => t.profitLoss && parseFloat(t.profitLoss) > 0).length;
      const totalTrades = trades.length;
      
      res.json({
        totalValue: latestPortfolio?.totalValue || "0",
        totalShares: latestPortfolio?.totalShares || "0",
        pricePerShare: latestPortfolio?.pricePerShare || "1",
        dailyChange: latestPortfolio?.dailyChange || "0",
        dailyChangePercent: latestPortfolio?.dailyChangePercent || "0",
        totalTrades,
        winRate: totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : "0",
        botActive: settings?.isActive || false,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Pool stats endpoint - calculates real value from MEXC
  app.get("/api/pool/stats", async (req, res) => {
    try {
      // Get real balances from MEXC
      let totalValueUSD = 0;
      
      try {
        const balances = await mexcService.getAccountBalance();
        
        // Get current prices for all assets
        const tickers = await mexcService.getTicker24h();
        const priceMap: Record<string, number> = {};
        
        tickers.forEach(ticker => {
          if (ticker.symbol.endsWith("USDT")) {
            const asset = ticker.symbol.replace("USDT", "");
            priceMap[asset] = parseFloat(ticker.lastPrice);
          }
        });
        
        // USDT is 1:1
        priceMap["USDT"] = 1;
        
        // Calculate total value in USD
        for (const balance of balances) {
          const totalBalance = parseFloat(balance.free) + parseFloat(balance.locked);
          const price = priceMap[balance.asset] || 0;
          totalValueUSD += totalBalance * price;
        }
      } catch (error) {
        console.log("Could not fetch MEXC balance, using fallback");
        // Fall back to portfolio history
        const portfolioHistory = await storage.getPortfolioHistory(1);
        const latestPortfolio = portfolioHistory[0];
        if (latestPortfolio) {
          totalValueUSD = parseFloat(latestPortfolio.totalValue);
        }
      }
      
      // Get total shares from all users
      const allUsers = await storage.getAllUserShares();
      const totalShares = allUsers.reduce((sum, user) => sum + parseFloat(user.totalShares || "0"), 0);
      
      // Calculate price per share
      const pricePerShare = totalShares > 0 ? totalValueUSD / totalShares : 1;
      
      res.json({
        totalValue: totalValueUSD,
        totalShares: totalShares,
        pricePerShare: pricePerShare,
      });
    } catch (error) {
      console.error("Error fetching pool stats:", error);
      res.status(500).json({ message: "Failed to fetch pool stats" });
    }
  });

  // MEXC API endpoints
  app.get("/api/mexc/test", isAuthenticated, async (req, res) => {
    try {
      const connected = await mexcService.testConnection();
      res.json({ connected, message: connected ? "MEXC API connected successfully" : "MEXC API connection failed" });
    } catch (error) {
      console.error("Error testing MEXC connection:", error);
      res.status(500).json({ message: "Failed to test MEXC connection" });
    }
  });

  app.get("/api/mexc/balance", isAuthenticated, async (req, res) => {
    try {
      const balances = await mexcService.getAccountBalance();
      res.json(balances);
    } catch (error) {
      console.error("Error fetching MEXC balance:", error);
      res.status(500).json({ message: "Failed to fetch MEXC balance" });
    }
  });

  app.get("/api/mexc/coins", isAuthenticated, async (req, res) => {
    try {
      const coins = await mexcService.getCoinInfo();
      const supportedCoins = coins.filter(c => 
        c.networkList.some(n => n.depositEnable || n.withdrawEnable)
      );
      res.json(supportedCoins);
    } catch (error) {
      console.error("Error fetching coin info:", error);
      res.status(500).json({ message: "Failed to fetch coin information" });
    }
  });

  app.get("/api/mexc/coin/:coin/networks", isAuthenticated, async (req, res) => {
    try {
      const { coin } = req.params;
      const coinInfo = await mexcService.getNetworksForCoin(coin);
      if (!coinInfo) {
        res.status(404).json({ message: "Coin not found" });
        return;
      }
      res.json(coinInfo.networkList);
    } catch (error) {
      console.error("Error fetching networks:", error);
      res.status(500).json({ message: "Failed to fetch networks" });
    }
  });

  // Deposit address endpoint
  app.post("/api/mexc/deposit/address", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { coin, network } = req.body;

      if (!coin || !network) {
        res.status(400).json({ message: "Coin and network are required" });
        return;
      }

      const existingAddress = await storage.getWalletAddress(userId, coin, network);
      if (existingAddress) {
        res.json(existingAddress);
        return;
      }

      const addresses = await mexcService.getDepositAddress(coin, network);
      if (!addresses || addresses.length === 0) {
        res.status(404).json({ message: "No deposit address available for this coin/network" });
        return;
      }

      const mexcAddress = addresses[0];
      const savedAddress = await storage.createWalletAddress({
        userId,
        coin: mexcAddress.coin,
        network: mexcAddress.network,
        address: mexcAddress.address,
        memo: mexcAddress.memo,
      });

      res.json(savedAddress);
    } catch (error) {
      console.error("Error getting deposit address:", error);
      res.status(500).json({ message: "Failed to get deposit address" });
    }
  });

  // Get user's saved wallet addresses
  app.get("/api/wallet/addresses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const addresses = await storage.getWalletAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching wallet addresses:", error);
      res.status(500).json({ message: "Failed to fetch wallet addresses" });
    }
  });

  // Deposit history from MEXC
  app.get("/api/mexc/deposit/history", isAuthenticated, async (req, res) => {
    try {
      const coin = req.query.coin as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await mexcService.getDepositHistory(coin, undefined, undefined, undefined, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching deposit history:", error);
      res.status(500).json({ message: "Failed to fetch deposit history" });
    }
  });

  // Withdrawal endpoint
  app.post("/api/mexc/withdraw", withdrawLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { coin, address, amount, network, memo } = req.body;

      if (!coin || !address || !amount || !network) {
        res.status(400).json({ message: "Coin, address, amount, and network are required" });
        return;
      }

      const withdrawAmount = parseFloat(amount);
      if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        res.status(400).json({ message: "Invalid withdrawal amount" });
        return;
      }

      // Check if user has sufficient balance before processing
      const shares = await storage.getUserShares(userId);
      if (!shares) {
        res.status(400).json({ message: "No balance found for this user" });
        return;
      }

      const currentBalance = parseFloat(shares.currentValue || "0");
      if (currentBalance < withdrawAmount) {
        res.status(400).json({ 
          message: "Insufficient balance", 
          currentBalance: currentBalance.toFixed(2),
          requestedAmount: withdrawAmount.toFixed(2)
        });
        return;
      }

      const transaction = await storage.createTransaction({
        userId,
        type: "withdrawal",
        amount: amount.toString(),
        status: "pending",
      });

      try {
        const result = await mexcService.withdraw(coin, address, amount.toString(), network, memo);
        
        await storage.updateTransactionStatus(transaction.id, "confirmed", result.id);

        // Deduct from user balance
        const newDeposited = Math.max(0, parseFloat(shares.totalDeposited) - withdrawAmount).toString();
        const newShares = Math.max(0, parseFloat(shares.totalShares) - withdrawAmount).toString();
        const newValue = Math.max(0, currentBalance - withdrawAmount).toString();
        await storage.updateUserShares(userId, {
          totalDeposited: newDeposited,
          totalShares: newShares,
          currentValue: newValue,
        });

        res.json({ 
          success: true, 
          withdrawId: result.id, 
          transactionId: transaction.id,
          newBalance: newValue
        });
      } catch (withdrawError) {
        await storage.updateTransactionStatus(transaction.id, "failed");
        throw withdrawError;
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // Withdrawal history from MEXC
  app.get("/api/mexc/withdraw/history", isAuthenticated, async (req, res) => {
    try {
      const coin = req.query.coin as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await mexcService.getWithdrawHistory(coin, undefined, undefined, undefined, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
      res.status(500).json({ message: "Failed to fetch withdrawal history" });
    }
  });

  // MEXC trades endpoints
  app.get("/api/mexc/trades", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const trades = await mexcService.getAllTrades(limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching MEXC trades:", error);
      res.status(500).json({ message: "Failed to fetch trades from MEXC" });
    }
  });

  app.get("/api/mexc/trades/:symbol", isAuthenticated, async (req, res) => {
    try {
      const { symbol } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const trades = await mexcService.getMyTrades(symbol, undefined, undefined, limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching MEXC trades for symbol:", error);
      res.status(500).json({ message: "Failed to fetch trades from MEXC" });
    }
  });

  // MEXC open orders endpoint
  app.get("/api/mexc/orders/open", isAuthenticated, async (req, res) => {
    try {
      const symbol = req.query.symbol as string | undefined;
      const orders = await mexcService.getOpenOrders(symbol);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching open orders:", error);
      res.status(500).json({ message: "Failed to fetch open orders from MEXC" });
    }
  });

  // Sync market data from MEXC
  app.post("/api/mexc/sync-market", async (req, res) => {
    try {
      const marketDataFromMexc = await mexcService.syncMarketData();
      
      for (const item of marketDataFromMexc) {
        await storage.upsertMarketData({
          symbol: item.symbol,
          price: item.price,
          change24h: item.data.priceChange,
          changePercent24h: item.data.priceChangePercent,
          volume24h: item.data.quoteVolume,
          high24h: item.data.highPrice,
          low24h: item.data.lowPrice,
        });
      }
      
      res.json({ success: true, updated: marketDataFromMexc.length });
    } catch (error) {
      console.error("Error syncing market data:", error);
      res.status(500).json({ message: "Failed to sync market data" });
    }
  });

  // Reconcile deposits from MEXC - syncs external deposit history with local transactions
  app.post("/api/mexc/reconcile/deposits", isAuthenticated, async (req, res) => {
    try {
      const depositHistory = await mexcService.getDepositHistory(undefined, undefined, undefined, undefined, 100);
      
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const deposit of depositHistory) {
        const existingTx = await storage.getTransactionByTxHash(deposit.txId);
        
        if (existingTx) {
          const mexcStatus = deposit.status === 1 ? "confirmed" : deposit.status === 0 ? "pending" : "failed";
          
          if (existingTx.status !== mexcStatus) {
            await storage.updateTransactionStatus(existingTx.id, mexcStatus, deposit.txId);
            
            if (mexcStatus === "confirmed" && existingTx.status === "pending") {
              const shares = await storage.getUserShares(existingTx.userId);
              if (shares) {
                const newDeposited = (parseFloat(shares.totalDeposited) + parseFloat(existingTx.amount)).toString();
                const newShares = (parseFloat(shares.totalShares) + parseFloat(existingTx.amount)).toString();
                await storage.updateUserShares(existingTx.userId, {
                  totalDeposited: newDeposited,
                  totalShares: newShares,
                  currentValue: newShares,
                });
              }
            }
            updated++;
          } else {
            skipped++;
          }
        } else {
          const walletAddress = await storage.getWalletAddressByAddress(deposit.address);
          
          if (walletAddress) {
            const status = deposit.status === 1 ? "confirmed" : deposit.status === 0 ? "pending" : "failed";
            
            await storage.createTransaction({
              userId: walletAddress.userId,
              type: "deposit",
              amount: deposit.amount,
              status: status,
              txHash: deposit.txId,
            });
            
            if (status === "confirmed") {
              const shares = await storage.getUserShares(walletAddress.userId);
              if (shares) {
                const newDeposited = (parseFloat(shares.totalDeposited) + parseFloat(deposit.amount)).toString();
                const newShares = (parseFloat(shares.totalShares) + parseFloat(deposit.amount)).toString();
                await storage.updateUserShares(walletAddress.userId, {
                  totalDeposited: newDeposited,
                  totalShares: newShares,
                  currentValue: newShares,
                });
              }
            }
            
            created++;
          } else {
            skipped++;
          }
        }
      }

      res.json({ success: true, created, updated, skipped, total: depositHistory.length });
    } catch (error) {
      console.error("Error reconciling deposits:", error);
      res.status(500).json({ message: "Failed to reconcile deposits" });
    }
  });

  // Reconcile withdrawals from MEXC - syncs external withdrawal history with local transactions
  app.post("/api/mexc/reconcile/withdrawals", isAuthenticated, async (req, res) => {
    try {
      const withdrawHistory = await mexcService.getWithdrawHistory(undefined, undefined, undefined, undefined, 100);
      
      let updated = 0;
      let skipped = 0;

      for (const withdrawal of withdrawHistory) {
        const existingTx = await storage.getTransactionByTxHash(withdrawal.id);
        
        if (existingTx) {
          let mexcStatus = "pending";
          switch (withdrawal.status) {
            case "CONFIRMED":
            case "SUCCESS":
              mexcStatus = "confirmed";
              break;
            case "CANCELLED":
            case "FAILED":
              mexcStatus = "failed";
              break;
            default:
              mexcStatus = "pending";
          }
          
          if (existingTx.status !== mexcStatus) {
            await storage.updateTransactionStatus(existingTx.id, mexcStatus, withdrawal.txId || withdrawal.id);
            updated++;
          } else {
            skipped++;
          }
        } else {
          skipped++;
        }
      }

      res.json({ success: true, updated, skipped, total: withdrawHistory.length });
    } catch (error) {
      console.error("Error reconciling withdrawals:", error);
      res.status(500).json({ message: "Failed to reconcile withdrawals" });
    }
  });

  // Update transaction status
  app.patch("/api/transactions/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, txHash } = req.body;
      
      if (!status) {
        res.status(400).json({ message: "Status is required" });
        return;
      }

      const updated = await storage.updateTransactionStatus(id, status, txHash);
      if (!updated) {
        res.status(404).json({ message: "Transaction not found" });
        return;
      }

      if (status === "confirmed" && updated.type === "deposit") {
        const shares = await storage.getUserShares(updated.userId);
        if (shares) {
          const newDeposited = (parseFloat(shares.totalDeposited) + parseFloat(updated.amount)).toString();
          const newShares = (parseFloat(shares.totalShares) + parseFloat(updated.amount)).toString();
          await storage.updateUserShares(updated.userId, {
            totalDeposited: newDeposited,
            totalShares: newShares,
            currentValue: newShares,
          });
        }
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating transaction status:", error);
      res.status(500).json({ message: "Failed to update transaction status" });
    }
  });

  // SMC (Smart Money Concepts) endpoints
  app.get("/api/smc/killzones", async (req, res) => {
    try {
      const killZones = smcService.getActiveKillZones();
      const activeKillZone = killZones.find((kz) => kz.isActive) || null;
      res.json({ killZones, activeKillZone });
    } catch (error) {
      console.error("Error fetching kill zones:", error);
      res.status(500).json({ message: "Failed to fetch kill zones" });
    }
  });

  app.post("/api/smc/analyze", isAuthenticated, async (req, res) => {
    try {
      const { symbol, candles } = req.body;
      
      if (!symbol) {
        res.status(400).json({ message: "Symbol is required" });
        return;
      }

      let candleData: Candle[] = candles || [];
      let dataSource: "live" | "cache" | "stale_cache" | "provided" = "provided";
      let cacheAge: number | undefined;
      
      if (!candleData || candleData.length === 0) {
        try {
          const klinesResult = await fetchKlinesWithRetry(symbol);
          candleData = klinesResult.candles;
          dataSource = klinesResult.source;
          cacheAge = klinesResult.cacheAge;
        } catch (klineError) {
          console.error("Failed to fetch klines from MEXC:", klineError);
          res.status(503).json({ 
            message: "Failed to fetch market data from MEXC",
            degraded: true,
            suggestion: "Please try again in a moment or select a different symbol"
          });
          return;
        }
      }

      if (candleData.length < 10) {
        res.status(400).json({ message: "Insufficient candle data for analysis" });
        return;
      }

      const analysis = await analyzeSMC(symbol.toUpperCase(), candleData);
      const signal = generateSMCSignal(analysis);
      
      res.json({ 
        analysis, 
        signal,
        dataSource,
        degraded: dataSource === "stale_cache",
        ...(cacheAge !== undefined && { cacheAge })
      });
    } catch (error) {
      console.error("Error analyzing SMC:", error);
      res.status(500).json({ message: "Failed to analyze SMC" });
    }
  });

  app.post("/api/smc/signal", isAuthenticated, async (req, res) => {
    try {
      const { symbol, candles } = req.body;
      
      if (!symbol) {
        res.status(400).json({ message: "Symbol is required" });
        return;
      }

      let candleData: Candle[] = candles || [];
      let dataSource: "live" | "cache" | "stale_cache" | "provided" = "provided";
      let cacheAge: number | undefined;
      
      if (!candleData || candleData.length === 0) {
        try {
          const klinesResult = await fetchKlinesWithRetry(symbol);
          candleData = klinesResult.candles;
          dataSource = klinesResult.source;
          cacheAge = klinesResult.cacheAge;
        } catch (klineError) {
          console.error("Failed to fetch klines from MEXC:", klineError);
          res.status(503).json({ 
            message: "Failed to fetch market data from MEXC",
            degraded: true,
            suggestion: "Please try again in a moment or select a different symbol"
          });
          return;
        }
      }

      if (candleData.length < 10) {
        res.status(400).json({ message: "Insufficient candle data for analysis" });
        return;
      }

      const analysis = await analyzeSMC(symbol.toUpperCase(), candleData);
      const signal = generateSMCSignal(analysis);
      
      res.json({
        ...signal,
        dataSource,
        degraded: dataSource === "stale_cache",
        ...(cacheAge !== undefined && { cacheAge })
      });
    } catch (error) {
      console.error("Error generating SMC signal:", error);
      res.status(500).json({ message: "Failed to generate SMC signal" });
    }
  });

  // RL (Reinforcement Learning) Agent endpoints
  app.get("/api/rl/agents", async (req, res) => {
    try {
      const agents = await storage.getAllRlAgentConfigs();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching RL agents:", error);
      res.status(500).json({ message: "Failed to fetch RL agents" });
    }
  });

  app.get("/api/rl/agent/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const config = await storage.getRlAgentConfig(symbol);
      
      if (!config) {
        res.status(404).json({ message: "RL agent not found for this symbol" });
        return;
      }

      const qTable = config.qTable as Record<string, { buy: number; sell: number; hold: number }> | undefined;
      const statesLearned = qTable ? Object.keys(qTable).length : 0;
      
      const stats = {
        totalEpisodes: config.totalEpisodes ?? 0,
        totalReward: config.totalReward ? parseFloat(config.totalReward) : 0,
        avgReward: config.avgReward ? parseFloat(config.avgReward) : 0,
        explorationRate: config.explorationRate ? parseFloat(config.explorationRate) : 0.1,
        statesLearned,
      };
      
      res.json({ config, stats });
    } catch (error) {
      console.error("Error fetching RL agent:", error);
      res.status(500).json({ message: "Failed to fetch RL agent" });
    }
  });

  app.post("/api/rl/agent", isAuthenticated, async (req, res) => {
    try {
      const { symbol, learningRate, discountFactor, explorationRate, explorationDecay, minExploration, batchSize, memorySize } = req.body;
      
      if (!symbol) {
        res.status(400).json({ message: "Symbol is required" });
        return;
      }

      const existing = await storage.getRlAgentConfig(symbol);
      if (existing) {
        res.status(400).json({ message: "RL agent already exists for this symbol" });
        return;
      }

      const config = await storage.createRlAgentConfig({
        symbol: symbol.toUpperCase(),
        isActive: false,
        learningRate: learningRate?.toString() || "0.001",
        discountFactor: discountFactor?.toString() || "0.95",
        explorationRate: explorationRate?.toString() || "0.1",
        explorationDecay: explorationDecay?.toString() || "0.995",
        minExploration: minExploration?.toString() || "0.01",
        batchSize: batchSize || 32,
        memorySize: memorySize || 10000,
      });

      getOrCreateAgent(symbol, {
        learningRate: learningRate || 0.001,
        discountFactor: discountFactor || 0.95,
        explorationRate: explorationRate || 0.1,
        explorationDecay: explorationDecay || 0.995,
        minExploration: minExploration || 0.01,
        batchSize: batchSize || 32,
        memorySize: memorySize || 10000,
      });

      res.json(config);
    } catch (error) {
      console.error("Error creating RL agent:", error);
      res.status(500).json({ message: "Failed to create RL agent" });
    }
  });

  app.patch("/api/rl/agent/:symbol", isAuthenticated, async (req, res) => {
    try {
      const { symbol } = req.params;
      const { isActive, learningRate, discountFactor, explorationRate } = req.body;

      const updateData: Record<string, unknown> = {};
      if (isActive !== undefined) updateData.isActive = isActive;
      if (learningRate !== undefined) updateData.learningRate = learningRate.toString();
      if (discountFactor !== undefined) updateData.discountFactor = discountFactor.toString();
      if (explorationRate !== undefined) updateData.explorationRate = explorationRate.toString();

      const updated = await storage.updateRlAgentConfig(symbol, updateData);
      if (!updated) {
        res.status(404).json({ message: "RL agent not found" });
        return;
      }

      const agent = getOrCreateAgent(symbol);
      agent.setConfig({
        learningRate: learningRate,
        discountFactor: discountFactor,
        explorationRate: explorationRate,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating RL agent:", error);
      res.status(500).json({ message: "Failed to update RL agent" });
    }
  });

  app.post("/api/rl/train/:symbol", isAuthenticated, async (req, res) => {
    try {
      const { symbol } = req.params;
      const { episodes = 1, initialCapital = 10000 } = req.body;

      let config = await storage.getRlAgentConfig(symbol);
      if (!config) {
        config = await storage.createRlAgentConfig({
          symbol: symbol.toUpperCase(),
          isActive: false,
        });
      }

      const agent = getOrCreateAgent(
        symbol,
        {
          learningRate: config.learningRate ? parseFloat(config.learningRate) : undefined,
          discountFactor: config.discountFactor ? parseFloat(config.discountFactor) : undefined,
          explorationRate: config.explorationRate ? parseFloat(config.explorationRate) : undefined,
        },
        config.qTable as Record<string, { buy: number; sell: number; hold: number }> | undefined
      );

      let klinesResult;
      try {
        klinesResult = await fetchKlinesWithRetry(symbol);
      } catch (klineError) {
        console.error("Failed to fetch klines from MEXC:", klineError);
        res.status(503).json({ 
          message: "Failed to fetch market data for training",
          suggestion: "Please try again in a moment"
        });
        return;
      }

      const candles = klinesResult.candles;
      if (candles.length < 50) {
        res.status(400).json({ message: "Insufficient market data for training (need at least 50 candles)" });
        return;
      }

      const results = [];
      for (let i = 0; i < episodes; i++) {
        const result = agent.train(candles, initialCapital);
        
        await storage.createRlTrainingEpisode({
          agentId: config.id,
          episodeNumber: result.episodeNumber,
          startingCapital: result.startingCapital.toString(),
          endingCapital: result.endingCapital.toString(),
          totalReward: result.totalReward.toString(),
          totalActions: result.totalActions,
          buyActions: result.buyActions,
          sellActions: result.sellActions,
          holdActions: result.holdActions,
          profitLoss: result.profitLoss.toString(),
          profitLossPercent: result.profitLossPercent.toString(),
          maxDrawdown: result.maxDrawdown.toString(),
          winRate: result.winRate.toString(),
          explorationRate: result.explorationRate.toString(),
        });

        results.push(result);
      }

      const stats = agent.getStats();
      const qTable = agent.getQTable();
      
      await storage.updateRlAgentConfig(symbol, {
        qTable: qTable as unknown as Record<string, unknown>,
        totalEpisodes: stats.totalEpisodes,
        totalReward: stats.totalReward.toString(),
        avgReward: stats.avgReward.toString(),
        explorationRate: stats.explorationRate.toString(),
      });

      res.json({ 
        results, 
        stats,
        dataSource: klinesResult.source,
      });
    } catch (error) {
      console.error("Error training RL agent:", error);
      res.status(500).json({ message: "Failed to train RL agent" });
    }
  });

  app.post("/api/rl/predict/:symbol", isAuthenticated, async (req, res) => {
    try {
      const { symbol } = req.params;

      const config = await storage.getRlAgentConfig(symbol);
      if (!config) {
        res.status(404).json({ message: "RL agent not found. Create and train an agent first." });
        return;
      }

      const agent = getOrCreateAgent(
        symbol,
        undefined,
        config.qTable as Record<string, { buy: number; sell: number; hold: number }> | undefined
      );

      let klinesResult;
      try {
        klinesResult = await fetchKlinesWithRetry(symbol);
      } catch (klineError) {
        console.error("Failed to fetch klines from MEXC:", klineError);
        res.status(503).json({ 
          message: "Failed to fetch market data for prediction",
          suggestion: "Please try again in a moment"
        });
        return;
      }

      const candles = klinesResult.candles;
      if (candles.length < 30) {
        res.status(400).json({ message: "Insufficient market data for prediction" });
        return;
      }

      const prediction = agent.predict(candles);
      const currentPrice = candles[candles.length - 1].close;

      const decision = await storage.createRlDecision({
        agentId: config.id,
        symbol: symbol.toUpperCase(),
        action: prediction.action,
        confidence: prediction.confidence.toString(),
        stateFeatures: prediction.stateFeatures as unknown as Record<string, unknown>,
        qValues: prediction.qValues as unknown as Record<string, unknown>,
        price: currentPrice.toString(),
        wasExecuted: false,
      });

      res.json({
        prediction,
        decision,
        currentPrice,
        dataSource: klinesResult.source,
      });
    } catch (error) {
      console.error("Error getting RL prediction:", error);
      res.status(500).json({ message: "Failed to get RL prediction" });
    }
  });

  app.get("/api/rl/episodes/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const config = await storage.getRlAgentConfig(symbol);
      if (!config) {
        res.status(404).json({ message: "RL agent not found" });
        return;
      }

      const episodes = await storage.getRlTrainingEpisodes(config.id, limit);
      res.json(episodes);
    } catch (error) {
      console.error("Error fetching training episodes:", error);
      res.status(500).json({ message: "Failed to fetch training episodes" });
    }
  });

  app.get("/api/rl/decisions/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const config = await storage.getRlAgentConfig(symbol);
      if (!config) {
        res.status(404).json({ message: "RL agent not found" });
        return;
      }

      const decisions = await storage.getRlDecisions(config.id, limit);
      res.json(decisions);
    } catch (error) {
      console.error("Error fetching RL decisions:", error);
      res.status(500).json({ message: "Failed to fetch RL decisions" });
    }
  });

  app.post("/api/rl/reset/:symbol", isAuthenticated, async (req, res) => {
    try {
      const { symbol } = req.params;

      const config = await storage.getRlAgentConfig(symbol);
      if (!config) {
        res.status(404).json({ message: "RL agent not found" });
        return;
      }

      resetAgent(symbol);

      const updated = await storage.updateRlAgentConfig(symbol, {
        qTable: null as unknown as Record<string, unknown>,
        totalEpisodes: 0,
        totalReward: "0",
        avgReward: "0",
        explorationRate: "0.1",
      });

      res.json({ message: "RL agent reset successfully", config: updated });
    } catch (error) {
      console.error("Error resetting RL agent:", error);
      res.status(500).json({ message: "Failed to reset RL agent" });
    }
  });

  // Telegram notification endpoints
  app.get("/api/telegram/status", async (req, res) => {
    try {
      res.json({
        enabled: telegramService.isEnabled(),
        botUsername: telegramService.getBotUsername(),
      });
    } catch (error) {
      console.error("Error getting Telegram status:", error);
      res.status(500).json({ message: "Failed to get Telegram status" });
    }
  });

  app.get("/api/telegram/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      let settings = await storage.getNotificationSettings(userId);
      
      if (!settings) {
        settings = await storage.createNotificationSettings({
          userId,
          telegramChatId: null,
          telegramEnabled: false,
          emailEnabled: false,
          tradeNotifications: true,
          depositNotifications: true,
          withdrawalNotifications: true,
          aiSignalNotifications: true,
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.patch("/api/telegram/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const data = insertNotificationSettingsSchema.partial().parse(req.body);
      
      const settings = await storage.updateNotificationSettings(userId, data);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
        return;
      }
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  app.post("/api/telegram/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { chatId } = req.body;

      if (!chatId) {
        res.status(400).json({ message: "Chat ID is required" });
        return;
      }

      const settings = await storage.updateNotificationSettings(userId, {
        telegramChatId: chatId,
        telegramEnabled: true,
      });

      res.json(settings);
    } catch (error) {
      console.error("Error subscribing to Telegram:", error);
      res.status(500).json({ message: "Failed to subscribe to Telegram" });
    }
  });

  app.post("/api/telegram/unsubscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;

      const settings = await storage.updateNotificationSettings(userId, {
        telegramChatId: null,
        telegramEnabled: false,
      });

      res.json(settings);
    } catch (error) {
      console.error("Error unsubscribing from Telegram:", error);
      res.status(500).json({ message: "Failed to unsubscribe from Telegram" });
    }
  });

  app.post("/api/telegram/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const settings = await storage.getNotificationSettings(userId);

      if (!settings?.telegramChatId) {
        res.status(400).json({ message: "Telegram not connected. Please connect your Telegram first." });
        return;
      }

      if (!telegramService.isEnabled()) {
        res.status(503).json({ message: "Telegram bot is not configured. Please contact administrator." });
        return;
      }

      const success = await telegramService.sendTestNotification(settings.telegramChatId);
      
      if (success) {
        res.json({ success: true, message: "Test notification sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test notification" });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  // Backtesting endpoints
  app.get("/api/backtest/results", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const results = await storage.getBacktestResults(limit);
      res.json(results);
    } catch (error) {
      console.error("Error fetching backtest results:", error);
      res.status(500).json({ message: "Failed to fetch backtest results" });
    }
  });

  app.get("/api/backtest/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.getBacktestResultById(id);
      
      if (!result) {
        res.status(404).json({ message: "Backtest result not found" });
        return;
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching backtest result:", error);
      res.status(500).json({ message: "Failed to fetch backtest result" });
    }
  });

  app.post("/api/backtest/run", isAuthenticated, async (req, res) => {
    try {
      const { 
        symbol, 
        strategy, 
        initialCapital,
        rsiPeriod,
        rsiBuyThreshold,
        rsiSellThreshold,
        macdFastPeriod,
        macdSlowPeriod,
        macdSignalPeriod,
        smaPeriod,
        stopLossPercent,
        takeProfitPercent,
      } = req.body;
      
      if (!symbol || !strategy) {
        res.status(400).json({ message: "Symbol and strategy are required" });
        return;
      }

      // Helper function to parse and validate a numeric field
      const parseNumeric = (value: unknown, defaultVal: number, min: number, max: number): number | null => {
        // Handle missing/empty values first - return default
        if (value === undefined || value === null || value === "") {
          return defaultVal;
        }
        // Reject non-primitive types (arrays, objects)
        if (typeof value !== "string" && typeof value !== "number") {
          return null;
        }
        // Now safely convert to number
        const num = Number(value);
        // Check for NaN, Infinity, -Infinity
        if (!Number.isFinite(num)) {
          return null;
        }
        // Validate range
        if (num < min || num > max) {
          return null;
        }
        return num;
      };

      // Parse all numeric fields with validation
      const capital = parseNumeric(initialCapital, 10000, 100, 100000000);
      if (capital === null) {
        res.status(400).json({ message: "Invalid initial capital. Must be a number between 100 and 100,000,000" });
        return;
      }

      const parsedStopLossPercent = parseNumeric(stopLossPercent, 2, 0.1, 50);
      if (parsedStopLossPercent === null) {
        res.status(400).json({ message: "Invalid stop loss. Must be a number between 0.1% and 50%" });
        return;
      }

      const parsedTakeProfitPercent = parseNumeric(takeProfitPercent, 5, 0.1, 100);
      if (parsedTakeProfitPercent === null) {
        res.status(400).json({ message: "Invalid take profit. Must be a number between 0.1% and 100%" });
        return;
      }

      const parsedRsiPeriod = parseNumeric(rsiPeriod, 14, 2, 100);
      if (parsedRsiPeriod === null) {
        res.status(400).json({ message: "Invalid RSI period. Must be a number between 2 and 100" });
        return;
      }

      const parsedRsiBuyThreshold = parseNumeric(rsiBuyThreshold, 30, 1, 50);
      if (parsedRsiBuyThreshold === null) {
        res.status(400).json({ message: "Invalid RSI buy threshold. Must be a number between 1 and 50" });
        return;
      }

      const parsedRsiSellThreshold = parseNumeric(rsiSellThreshold, 70, 50, 99);
      if (parsedRsiSellThreshold === null) {
        res.status(400).json({ message: "Invalid RSI sell threshold. Must be a number between 50 and 99" });
        return;
      }

      const parsedMacdFastPeriod = parseNumeric(macdFastPeriod, 12, 2, 50);
      if (parsedMacdFastPeriod === null) {
        res.status(400).json({ message: "Invalid MACD fast period. Must be a number between 2 and 50" });
        return;
      }

      const parsedMacdSlowPeriod = parseNumeric(macdSlowPeriod, 26, 10, 100);
      if (parsedMacdSlowPeriod === null) {
        res.status(400).json({ message: "Invalid MACD slow period. Must be a number between 10 and 100" });
        return;
      }

      const parsedMacdSignalPeriod = parseNumeric(macdSignalPeriod, 9, 2, 50);
      if (parsedMacdSignalPeriod === null) {
        res.status(400).json({ message: "Invalid MACD signal period. Must be a number between 2 and 50" });
        return;
      }

      const parsedSmaPeriod = parseNumeric(smaPeriod, 20, 5, 200);
      if (parsedSmaPeriod === null) {
        res.status(400).json({ message: "Invalid SMA period. Must be a number between 5 and 200" });
        return;
      }

      const { runBacktest } = await import("./backtest");
      
      const klinesResult = await fetchKlinesWithRetry(symbol);
      
      if (klinesResult.candles.length < 50) {
        res.status(400).json({ message: "Not enough historical data for backtesting. Need at least 50 candles." });
        return;
      }

      const backtestResult = runBacktest(
        klinesResult.candles,
        strategy,
        symbol.toUpperCase(),
        capital,
        {
          rsiPeriod: parsedRsiPeriod,
          rsiBuyThreshold: parsedRsiBuyThreshold,
          rsiSellThreshold: parsedRsiSellThreshold,
          macdFastPeriod: parsedMacdFastPeriod,
          macdSlowPeriod: parsedMacdSlowPeriod,
          macdSignalPeriod: parsedMacdSignalPeriod,
          smaPeriod: parsedSmaPeriod,
          stopLossPercent: parsedStopLossPercent,
          takeProfitPercent: parsedTakeProfitPercent,
        }
      );

      const savedResult = await storage.createBacktestResult({
        strategyName: backtestResult.strategyName,
        symbol: symbol.toUpperCase(),
        startDate: backtestResult.startDate,
        endDate: backtestResult.endDate,
        initialCapital: capital.toString(),
        finalCapital: backtestResult.finalCapital.toString(),
        totalTrades: backtestResult.totalTrades,
        winningTrades: backtestResult.winningTrades,
        losingTrades: backtestResult.losingTrades,
        winRate: backtestResult.winRate.toFixed(2),
        profitFactor: backtestResult.profitFactor.toFixed(4),
        maxDrawdown: backtestResult.maxDrawdown.toFixed(4),
        sharpeRatio: backtestResult.sharpeRatio.toFixed(4),
        parameters: backtestResult.parameters,
      });

      res.json({
        ...savedResult,
        trades: backtestResult.trades,
        equityCurve: backtestResult.equityCurve,
        totalReturn: backtestResult.totalReturn,
        totalReturnPercent: backtestResult.totalReturnPercent,
      });
    } catch (error) {
      console.error("Error running backtest:", error);
      res.status(500).json({ message: "Failed to run backtest" });
    }
  });

  // Daily Report API
  app.get("/api/reports/daily", isAuthenticated, async (req: any, res) => {
    try {
      const dateParam = req.query.date;
      const date = dateParam ? new Date(dateParam as string) : new Date();
      const report = await generateDailyReport(date);
      res.json(report);
    } catch (error) {
      console.error("Error generating daily report:", error);
      res.status(500).json({ message: "Failed to generate daily report" });
    }
  });

  // Weekly Summary API
  app.get("/api/reports/weekly", isAuthenticated, async (req: any, res) => {
    try {
      const summary = await generateWeeklySummary();
      res.json(summary);
    } catch (error) {
      console.error("Error generating weekly summary:", error);
      res.status(500).json({ message: "Failed to generate weekly summary" });
    }
  });

  // Send Weekly Report Email
  app.post("/api/reports/send-weekly-email", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        res.status(400).json({ message: "User email not found" });
        return;
      }

      const summary = await generateWeeklySummary();
      const userName = user.firstName || user.email.split('@')[0];
      const success = await sendWeeklyReportEmail(user.email, userName, summary);

      if (success) {
        res.json({ message: "Weekly report email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send weekly report email" });
      }
    } catch (error) {
      console.error("Error sending weekly report email:", error);
      res.status(500).json({ message: "Failed to send weekly report email" });
    }
  });

  // Send Daily Report Email
  app.post("/api/reports/send-daily-email", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        res.status(400).json({ message: "User email not found" });
        return;
      }

      const report = await generateDailyReport();
      const userName = user.firstName || user.email.split('@')[0];
      const success = await sendDailyReportEmail(user.email, userName, report);

      if (success) {
        res.json({ message: "Daily report email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send daily report email" });
      }
    } catch (error) {
      console.error("Error sending daily report email:", error);
      res.status(500).json({ message: "Failed to send daily report email" });
    }
  });

  return httpServer;
}
