import {
  users,
  userShares,
  transactions,
  trades,
  portfolioHistory,
  sentimentAnalysis,
  botSettings,
  marketData,
  walletAddresses,
  notificationSettings,
  rlAgentConfig,
  rlTrainingEpisodes,
  rlDecisions,
  backtestResults,
  userCredentials,
  userProfiles,
  termsAcceptance,
  portfolioNav,
  orders,
  fills,
  ledgerEntries,
  holdings,
  notifications,
  type User,
  type UpsertUser,
  type UserShares,
  type InsertUserShares,
  type Transaction,
  type InsertTransaction,
  type Trade,
  type InsertTrade,
  type PortfolioHistory,
  type InsertPortfolioHistory,
  type Sentiment,
  type InsertSentiment,
  type BotSettings,
  type InsertBotSettings,
  type MarketData,
  type InsertMarketData,
  type WalletAddress,
  type InsertWalletAddress,
  type NotificationSettings,
  type InsertNotificationSettings,
  type RlAgentConfig,
  type InsertRlAgentConfig,
  type RlTrainingEpisode,
  type InsertRlTrainingEpisode,
  type RlDecision,
  type InsertRlDecision,
  type BacktestResult,
  type InsertBacktestResult,
  type UserCredentials,
  type InsertUserCredentials,
  type UserProfile,
  type InsertUserProfile,
  type TermsAcceptance,
  type InsertTermsAcceptance,
  type PortfolioNav,
  type InsertPortfolioNav,
  type Order,
  type InsertOrder,
  type Fill,
  type InsertFill,
  type LedgerEntry,
  type InsertLedgerEntry,
  type Holding,
  type InsertHolding,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  getUserShares(userId: string): Promise<UserShares | undefined>;
  getAllUserShares(): Promise<UserShares[]>;
  createUserShares(shares: InsertUserShares): Promise<UserShares>;
  updateUserShares(userId: string, shares: Partial<InsertUserShares>): Promise<UserShares | undefined>;
  
  getTransactions(userId: string): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  getTransactionByTxHash(txHash: string): Promise<Transaction | undefined>;
  getPendingTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string, txHash?: string): Promise<Transaction | undefined>;
  
  getTrades(limit?: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  
  getPortfolioHistory(limit?: number): Promise<PortfolioHistory[]>;
  createPortfolioHistory(history: InsertPortfolioHistory): Promise<PortfolioHistory>;
  
  getSentiment(symbol: string): Promise<Sentiment | undefined>;
  getAllSentiments(limit?: number): Promise<Sentiment[]>;
  createSentiment(sentiment: InsertSentiment): Promise<Sentiment>;
  
  getBotSettings(): Promise<BotSettings | undefined>;
  updateBotSettings(settings: Partial<InsertBotSettings>): Promise<BotSettings>;
  
  getMarketData(): Promise<MarketData[]>;
  upsertMarketData(data: InsertMarketData): Promise<MarketData>;
  
  getWalletAddress(userId: string, coin: string, network: string): Promise<WalletAddress | undefined>;
  getWalletAddresses(userId: string): Promise<WalletAddress[]>;
  getWalletAddressByAddress(address: string): Promise<WalletAddress | undefined>;
  createWalletAddress(address: InsertWalletAddress): Promise<WalletAddress>;
  
  getRlAgentConfig(symbol: string): Promise<RlAgentConfig | undefined>;
  getAllRlAgentConfigs(): Promise<RlAgentConfig[]>;
  createRlAgentConfig(config: InsertRlAgentConfig): Promise<RlAgentConfig>;
  updateRlAgentConfig(symbol: string, config: Partial<InsertRlAgentConfig>): Promise<RlAgentConfig | undefined>;
  
  getRlTrainingEpisodes(agentId: string, limit?: number): Promise<RlTrainingEpisode[]>;
  createRlTrainingEpisode(episode: InsertRlTrainingEpisode): Promise<RlTrainingEpisode>;
  
  getRlDecisions(agentId: string, limit?: number): Promise<RlDecision[]>;
  createRlDecision(decision: InsertRlDecision): Promise<RlDecision>;
  updateRlDecisionReward(id: string, reward: string, wasExecuted: boolean): Promise<RlDecision | undefined>;
  
  getNotificationSettings(userId: string): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(userId: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined>;
  getUsersWithTelegramEnabled(): Promise<NotificationSettings[]>;
  
  getBacktestResults(limit?: number): Promise<BacktestResult[]>;
  getBacktestResultById(id: string): Promise<BacktestResult | undefined>;
  createBacktestResult(result: InsertBacktestResult): Promise<BacktestResult>;
  
  // NEW: NAV, Orders, Ledger, Holdings, Notifications
  getPortfolioNavHistory(limit?: number): Promise<PortfolioNav[]>;
  createPortfolioNav(nav: InsertPortfolioNav): Promise<PortfolioNav>;
  
  getOrders(limit?: number): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined>;
  
  getOrderFills(orderId: string): Promise<Fill[]>;
  createFill(fill: InsertFill): Promise<Fill>;
  
  getUserLedgerEntries(userId: string, limit?: number): Promise<LedgerEntry[]>;
  createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry>;
  
  getHoldings(): Promise<Holding[]>;
  upsertHolding(holding: InsertHolding): Promise<Holding>;
  
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  
  // Auth methods
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUserFromGoogle(userData: { email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; googleId: string; role: string }): Promise<User>;
  linkGoogleToUser(userId: string, googleId: string, profileImageUrl?: string | null): Promise<User | undefined>;
  createUserCredentials(credentials: InsertUserCredentials): Promise<UserCredentials>;
  getUserCredentialsByUserId(userId: string): Promise<UserCredentials | undefined>;
  updateUserCredentials(userId: string, data: Partial<InsertUserCredentials>): Promise<UserCredentials | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  createTermsAcceptance(acceptance: InsertTermsAcceptance): Promise<TermsAcceptance>;
  verifyUser(userId: string): Promise<UserCredentials | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserShares(userId: string): Promise<UserShares | undefined> {
    const [shares] = await db.select().from(userShares).where(eq(userShares.userId, userId));
    return shares;
  }

  async getAllUserShares(): Promise<UserShares[]> {
    return await db.select().from(userShares);
  }

  async createUserShares(shares: InsertUserShares): Promise<UserShares> {
    const [created] = await db.insert(userShares).values(shares).returning();
    return created;
  }

  async updateUserShares(userId: string, shares: Partial<InsertUserShares>): Promise<UserShares | undefined> {
    const [updated] = await db
      .update(userShares)
      .set({ ...shares, updatedAt: new Date() })
      .where(eq(userShares.userId, userId))
      .returning();
    return updated;
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionByTxHash(txHash: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.txHash, txHash));
    return transaction;
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.status, "pending"))
      .orderBy(desc(transactions.createdAt));
  }

  async updateTransactionStatus(id: string, status: string, txHash?: string): Promise<Transaction | undefined> {
    const updateData: { status: string; txHash?: string } = { status };
    if (txHash) updateData.txHash = txHash;
    
    const [updated] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async getTrades(limit?: number): Promise<Trade[]> {
    const query = db.select().from(trades).orderBy(desc(trades.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [created] = await db.insert(trades).values(trade).returning();
    return created;
  }

  async getPortfolioHistory(limit?: number): Promise<PortfolioHistory[]> {
    const query = db.select().from(portfolioHistory).orderBy(desc(portfolioHistory.recordedAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createPortfolioHistory(history: InsertPortfolioHistory): Promise<PortfolioHistory> {
    const [created] = await db.insert(portfolioHistory).values(history).returning();
    return created;
  }

  async getSentiment(symbol: string): Promise<Sentiment | undefined> {
    const [sentiment] = await db.select().from(sentimentAnalysis)
      .where(eq(sentimentAnalysis.symbol, symbol))
      .orderBy(desc(sentimentAnalysis.createdAt))
      .limit(1);
    return sentiment;
  }

  async getAllSentiments(limit?: number): Promise<Sentiment[]> {
    const query = db.select().from(sentimentAnalysis).orderBy(desc(sentimentAnalysis.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createSentiment(sentiment: InsertSentiment): Promise<Sentiment> {
    const [created] = await db.insert(sentimentAnalysis).values(sentiment).returning();
    return created;
  }

  async getBotSettings(): Promise<BotSettings | undefined> {
    const [settings] = await db.select().from(botSettings).limit(1);
    return settings;
  }

  async updateBotSettings(settings: Partial<InsertBotSettings>): Promise<BotSettings> {
    const existing = await this.getBotSettings();
    
    if (existing) {
      const [updated] = await db
        .update(botSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(botSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(botSettings).values(settings as InsertBotSettings).returning();
      return created;
    }
  }

  async getMarketData(): Promise<MarketData[]> {
    return await db.select().from(marketData).orderBy(desc(marketData.updatedAt));
  }

  async upsertMarketData(data: InsertMarketData): Promise<MarketData> {
    const existing = await db.select().from(marketData).where(eq(marketData.symbol, data.symbol)).limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(marketData)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(marketData.symbol, data.symbol))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(marketData).values(data).returning();
      return created;
    }
  }

  async getWalletAddress(userId: string, coin: string, network: string): Promise<WalletAddress | undefined> {
    const [address] = await db.select().from(walletAddresses)
      .where(and(
        eq(walletAddresses.userId, userId),
        eq(walletAddresses.coin, coin.toUpperCase()),
        eq(walletAddresses.network, network.toUpperCase())
      ));
    return address;
  }

  async getWalletAddresses(userId: string): Promise<WalletAddress[]> {
    return await db.select().from(walletAddresses)
      .where(eq(walletAddresses.userId, userId))
      .orderBy(desc(walletAddresses.createdAt));
  }

  async getWalletAddressByAddress(address: string): Promise<WalletAddress | undefined> {
    const [walletAddress] = await db.select().from(walletAddresses)
      .where(eq(walletAddresses.address, address));
    return walletAddress;
  }

  async createWalletAddress(address: InsertWalletAddress): Promise<WalletAddress> {
    const [created] = await db.insert(walletAddresses).values({
      ...address,
      coin: address.coin.toUpperCase(),
      network: address.network.toUpperCase(),
    }).returning();
    return created;
  }

  async getRlAgentConfig(symbol: string): Promise<RlAgentConfig | undefined> {
    const [config] = await db.select().from(rlAgentConfig)
      .where(eq(rlAgentConfig.symbol, symbol.toUpperCase()));
    return config;
  }

  async getAllRlAgentConfigs(): Promise<RlAgentConfig[]> {
    return await db.select().from(rlAgentConfig)
      .orderBy(desc(rlAgentConfig.updatedAt));
  }

  async createRlAgentConfig(config: InsertRlAgentConfig): Promise<RlAgentConfig> {
    const [created] = await db.insert(rlAgentConfig).values({
      ...config,
      symbol: config.symbol.toUpperCase(),
    }).returning();
    return created;
  }

  async updateRlAgentConfig(symbol: string, config: Partial<InsertRlAgentConfig>): Promise<RlAgentConfig | undefined> {
    const [updated] = await db.update(rlAgentConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(rlAgentConfig.symbol, symbol.toUpperCase()))
      .returning();
    return updated;
  }

  async getRlTrainingEpisodes(agentId: string, limit?: number): Promise<RlTrainingEpisode[]> {
    const query = db.select().from(rlTrainingEpisodes)
      .where(eq(rlTrainingEpisodes.agentId, agentId))
      .orderBy(desc(rlTrainingEpisodes.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createRlTrainingEpisode(episode: InsertRlTrainingEpisode): Promise<RlTrainingEpisode> {
    const [created] = await db.insert(rlTrainingEpisodes).values(episode).returning();
    return created;
  }

  async getRlDecisions(agentId: string, limit?: number): Promise<RlDecision[]> {
    const query = db.select().from(rlDecisions)
      .where(eq(rlDecisions.agentId, agentId))
      .orderBy(desc(rlDecisions.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createRlDecision(decision: InsertRlDecision): Promise<RlDecision> {
    const [created] = await db.insert(rlDecisions).values({
      ...decision,
      symbol: decision.symbol.toUpperCase(),
    }).returning();
    return created;
  }

  async updateRlDecisionReward(id: string, reward: string, wasExecuted: boolean): Promise<RlDecision | undefined> {
    const [updated] = await db.update(rlDecisions)
      .set({ reward, wasExecuted })
      .where(eq(rlDecisions.id, id))
      .returning();
    return updated;
  }

  async getNotificationSettings(userId: string): Promise<NotificationSettings | undefined> {
    const [settings] = await db.select().from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
    return settings;
  }

  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const [created] = await db.insert(notificationSettings).values(settings).returning();
    return created;
  }

  async updateNotificationSettings(userId: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> {
    const existing = await this.getNotificationSettings(userId);
    
    if (existing) {
      const [updated] = await db.update(notificationSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(notificationSettings.userId, userId))
        .returning();
      return updated;
    } else {
      return await this.createNotificationSettings({ userId, ...settings });
    }
  }

  async getUsersWithTelegramEnabled(): Promise<NotificationSettings[]> {
    return await db.select().from(notificationSettings)
      .where(and(
        eq(notificationSettings.telegramEnabled, true)
      ));
  }

  async getBacktestResults(limit?: number): Promise<BacktestResult[]> {
    const query = db.select().from(backtestResults)
      .orderBy(desc(backtestResults.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async getBacktestResultById(id: string): Promise<BacktestResult | undefined> {
    const [result] = await db.select().from(backtestResults)
      .where(eq(backtestResults.id, id));
    return result;
  }

  async createBacktestResult(result: InsertBacktestResult): Promise<BacktestResult> {
    const [created] = await db.insert(backtestResults).values({
      ...result,
      symbol: result.symbol.toUpperCase(),
    }).returning();
    return created;
  }

  // Auth methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUserFromGoogle(userData: { email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; googleId: string; role: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: userData.profileImageUrl,
      googleId: userData.googleId,
      role: userData.role,
    }).returning();
    return user;
  }

  async linkGoogleToUser(userId: string, googleId: string, profileImageUrl?: string | null): Promise<User | undefined> {
    const updateData: { googleId: string; profileImageUrl?: string | null; updatedAt: Date } = {
      googleId,
      updatedAt: new Date(),
    };
    if (profileImageUrl !== undefined) {
      updateData.profileImageUrl = profileImageUrl;
    }
    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async createUserCredentials(credentials: InsertUserCredentials): Promise<UserCredentials> {
    const [created] = await db.insert(userCredentials).values(credentials).returning();
    return created;
  }

  async getUserCredentialsByUserId(userId: string): Promise<UserCredentials | undefined> {
    const [creds] = await db.select().from(userCredentials).where(eq(userCredentials.userId, userId));
    return creds;
  }

  async updateUserCredentials(userId: string, data: Partial<InsertUserCredentials>): Promise<UserCredentials | undefined> {
    const [updated] = await db.update(userCredentials)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userCredentials.userId, userId))
      .returning();
    return updated;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [created] = await db.insert(userProfiles).values(profile).returning();
    return created;
  }

  async createTermsAcceptance(acceptance: InsertTermsAcceptance): Promise<TermsAcceptance> {
    const [created] = await db.insert(termsAcceptance).values(acceptance).returning();
    return created;
  }

  async verifyUser(userId: string): Promise<UserCredentials | undefined> {
    const [updated] = await db.update(userCredentials)
      .set({ verified: true, updatedAt: new Date() })
      .where(eq(userCredentials.userId, userId))
      .returning();
    return updated;
  }

  // NEW: NAV, Orders, Ledger, Holdings, Notifications implementations
  async getPortfolioNavHistory(limit?: number): Promise<PortfolioNav[]> {
    const query = db.select().from(portfolioNav).orderBy(desc(portfolioNav.recordedAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createPortfolioNav(nav: InsertPortfolioNav): Promise<PortfolioNav> {
    const [created] = await db.insert(portfolioNav).values(nav).returning();
    return created;
  }

  async getOrders(limit?: number): Promise<Order[]> {
    const query = db.select().from(orders).orderBy(desc(orders.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async getOrderFills(orderId: string): Promise<Fill[]> {
    return await db.select().from(fills)
      .where(eq(fills.orderId, orderId))
      .orderBy(desc(fills.executedAt));
  }

  async createFill(fill: InsertFill): Promise<Fill> {
    const [created] = await db.insert(fills).values(fill).returning();
    return created;
  }

  async getUserLedgerEntries(userId: string, limit?: number): Promise<LedgerEntry[]> {
    const query = db.select().from(ledgerEntries)
      .where(eq(ledgerEntries.userId, userId))
      .orderBy(desc(ledgerEntries.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry> {
    const [created] = await db.insert(ledgerEntries).values(entry).returning();
    return created;
  }

  async getHoldings(): Promise<Holding[]> {
    return await db.select().from(holdings);
  }

  async upsertHolding(holding: InsertHolding): Promise<Holding> {
    const [created] = await db.insert(holdings).values(holding)
      .onConflictDoUpdate({
        target: holdings.symbol,
        set: {
          quantity: holding.quantity,
          avgEntryPrice: holding.avgEntryPrice,
          currentPrice: holding.currentPrice,
          unrealizedPnl: holding.unrealizedPnl,
          unrealizedPnlPercent: holding.unrealizedPnlPercent,
          updatedAt: new Date(),
        },
      })
      .returning();
    return created;
  }

  async getUserNotifications(userId: string, limit?: number): Promise<Notification[]> {
    const query = db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
