import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id").unique(),
  role: varchar("role", { length: 20 }).default("user").notNull(), // user or admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User credentials for email/password authentication
export const userCredentials = pgTable("user_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  passwordHash: varchar("password_hash", { length: 256 }).notNull(),
  verified: boolean("verified").default(false).notNull(),
  verificationCode: varchar("verification_code", { length: 10 }),
  verificationExpires: timestamp("verification_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profile information
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  birthDate: timestamp("birth_date"),
  phone: varchar("phone", { length: 20 }),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Terms and privacy policy acceptance
export const termsAcceptance = pgTable("terms_acceptance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  version: varchar("version", { length: 20 }).notNull(),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 50 }),
});

// User shares in the collective pool
export const userShares = pgTable("user_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  totalShares: decimal("total_shares", { precision: 20, scale: 8 }).default("0").notNull(),
  totalDeposited: decimal("total_deposited", { precision: 20, scale: 8 }).default("0").notNull(),
  currentValue: decimal("current_value", { precision: 20, scale: 8 }).default("0").notNull(),
  profitLoss: decimal("profit_loss", { precision: 20, scale: 8 }).default("0").notNull(),
  profitLossPercent: decimal("profit_loss_percent", { precision: 10, scale: 4 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deposits and withdrawals
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 20 }).notNull(), // 'deposit' or 'withdrawal'
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  sharesAtTime: decimal("shares_at_time", { precision: 20, scale: 8 }),
  pricePerShare: decimal("price_per_share", { precision: 20, scale: 8 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, confirmed, cancelled
  txHash: varchar("tx_hash"),
  walletAddress: varchar("wallet_address", { length: 256 }), // User's wallet address for withdrawals
  createdAt: timestamp("created_at").defaultNow(),
});

// Bot trades history
export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pair: varchar("pair", { length: 20 }).notNull(), // BTC/USDT
  type: varchar("type", { length: 10 }).notNull(), // buy or sell
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  total: decimal("total", { precision: 20, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 20, scale: 8 }).default("0"),
  profitLoss: decimal("profit_loss", { precision: 20, scale: 8 }),
  status: varchar("status", { length: 20 }).default("completed").notNull(),
  strategy: varchar("strategy", { length: 50 }), // RSI, MACD, AI_SENTIMENT
  aiReason: text("ai_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolio metrics over time
export const portfolioHistory = pgTable("portfolio_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalValue: decimal("total_value", { precision: 20, scale: 8 }).notNull(),
  totalShares: decimal("total_shares", { precision: 20, scale: 8 }).notNull(),
  pricePerShare: decimal("price_per_share", { precision: 20, scale: 8 }).notNull(),
  dailyChange: decimal("daily_change", { precision: 10, scale: 4 }).default("0"),
  dailyChangePercent: decimal("daily_change_percent", { precision: 10, scale: 4 }).default("0"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// AI Sentiment analysis results
export const sentimentAnalysis = pgTable("sentiment_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  sentiment: varchar("sentiment", { length: 20 }).notNull(), // bullish, bearish, neutral
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // -100 to 100
  summary: text("summary"),
  newsSource: text("news_source"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bot settings and risk management
export const botSettings = pgTable("bot_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isActive: boolean("is_active").default(false),
  maxRiskPercent: decimal("max_risk_percent", { precision: 5, scale: 2 }).default("5"),
  stopLossPercent: decimal("stop_loss_percent", { precision: 5, scale: 2 }).default("3"),
  takeProfitPercent: decimal("take_profit_percent", { precision: 5, scale: 2 }).default("10"),
  maxPositionSize: decimal("max_position_size", { precision: 20, scale: 8 }).default("1000"),
  tradingPairs: text("trading_pairs").array().default(sql`ARRAY['BTC/USDT', 'ETH/USDT']`),
  useAiSentiment: boolean("use_ai_sentiment").default(true),
  useRsi: boolean("use_rsi").default(true),
  useMacd: boolean("use_macd").default(true),
  useMovingAverages: boolean("use_moving_averages").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Market data cache
export const marketData = pgTable("market_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  change24h: decimal("change_24h", { precision: 10, scale: 4 }),
  changePercent24h: decimal("change_percent_24h", { precision: 10, scale: 4 }),
  volume24h: decimal("volume_24h", { precision: 30, scale: 8 }),
  high24h: decimal("high_24h", { precision: 20, scale: 8 }),
  low24h: decimal("low_24h", { precision: 20, scale: 8 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// MEXC wallet addresses for deposits
export const walletAddresses = pgTable("wallet_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  coin: varchar("coin", { length: 20 }).notNull(),
  network: varchar("network", { length: 20 }).notNull(),
  address: varchar("address", { length: 256 }).notNull(),
  memo: varchar("memo", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// User notification preferences
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  telegramChatId: varchar("telegram_chat_id", { length: 100 }),
  telegramEnabled: boolean("telegram_enabled").default(false),
  emailEnabled: boolean("email_enabled").default(true),
  tradeNotifications: boolean("trade_notifications").default(true),
  depositNotifications: boolean("deposit_notifications").default(true),
  withdrawalNotifications: boolean("withdrawal_notifications").default(true),
  aiSignalNotifications: boolean("ai_signal_notifications").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Backtesting results
export const backtestResults = pgTable("backtest_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  strategyName: varchar("strategy_name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  initialCapital: decimal("initial_capital", { precision: 20, scale: 8 }).notNull(),
  finalCapital: decimal("final_capital", { precision: 20, scale: 8 }).notNull(),
  totalTrades: integer("total_trades").notNull(),
  winningTrades: integer("winning_trades").notNull(),
  losingTrades: integer("losing_trades").notNull(),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).notNull(),
  profitFactor: decimal("profit_factor", { precision: 10, scale: 4 }),
  maxDrawdown: decimal("max_drawdown", { precision: 10, scale: 4 }),
  sharpeRatio: decimal("sharpe_ratio", { precision: 10, scale: 4 }),
  parameters: jsonb("parameters"),
  createdAt: timestamp("created_at").defaultNow(),
});

// RL Agent configuration and state
export const rlAgentConfig = pgTable("rl_agent_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  isActive: boolean("is_active").default(false),
  learningRate: decimal("learning_rate", { precision: 10, scale: 8 }).default("0.001"),
  discountFactor: decimal("discount_factor", { precision: 5, scale: 4 }).default("0.95"),
  explorationRate: decimal("exploration_rate", { precision: 5, scale: 4 }).default("0.1"),
  explorationDecay: decimal("exploration_decay", { precision: 10, scale: 8 }).default("0.995"),
  minExploration: decimal("min_exploration", { precision: 5, scale: 4 }).default("0.01"),
  batchSize: integer("batch_size").default(32),
  memorySize: integer("memory_size").default(10000),
  qTable: jsonb("q_table"),
  totalEpisodes: integer("total_episodes").default(0),
  totalReward: decimal("total_reward", { precision: 20, scale: 8 }).default("0"),
  avgReward: decimal("avg_reward", { precision: 20, scale: 8 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// RL Training episodes
export const rlTrainingEpisodes = pgTable("rl_training_episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => rlAgentConfig.id),
  episodeNumber: integer("episode_number").notNull(),
  startingCapital: decimal("starting_capital", { precision: 20, scale: 8 }).notNull(),
  endingCapital: decimal("ending_capital", { precision: 20, scale: 8 }).notNull(),
  totalReward: decimal("total_reward", { precision: 20, scale: 8 }).notNull(),
  totalActions: integer("total_actions").notNull(),
  buyActions: integer("buy_actions").default(0),
  sellActions: integer("sell_actions").default(0),
  holdActions: integer("hold_actions").default(0),
  profitLoss: decimal("profit_loss", { precision: 20, scale: 8 }),
  profitLossPercent: decimal("profit_loss_percent", { precision: 10, scale: 4 }),
  maxDrawdown: decimal("max_drawdown", { precision: 10, scale: 4 }),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }),
  explorationRate: decimal("exploration_rate", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// RL Agent decisions/predictions
export const rlDecisions = pgTable("rl_decisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => rlAgentConfig.id),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  action: varchar("action", { length: 10 }).notNull(), // buy, sell, hold
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  stateFeatures: jsonb("state_features"),
  qValues: jsonb("q_values"),
  price: decimal("price", { precision: 20, scale: 8 }),
  wasExecuted: boolean("was_executed").default(false),
  reward: decimal("reward", { precision: 20, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==========================================
// NEW TABLES FOR TRADING CORE INTEGRATION
// ==========================================

// Portfolio NAV snapshots - tracks pool value over time
export const portfolioNav = pgTable("portfolio_nav", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalEquityUsdt: decimal("total_equity_usdt", { precision: 20, scale: 8 }).notNull(),
  cashUsdt: decimal("cash_usdt", { precision: 20, scale: 8 }).notNull(),
  holdingsValueUsdt: decimal("holdings_value_usdt", { precision: 20, scale: 8 }).default("0"),
  unrealizedPnlUsdt: decimal("unrealized_pnl_usdt", { precision: 20, scale: 8 }).default("0"),
  realizedPnlUsdt: decimal("realized_pnl_usdt", { precision: 20, scale: 8 }).default("0"),
  feesUsdt: decimal("fees_usdt", { precision: 20, scale: 8 }).default("0"),
  totalSharesOutstanding: decimal("total_shares_outstanding", { precision: 20, scale: 8 }).notNull(),
  navPerShare: decimal("nav_per_share", { precision: 20, scale: 8 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Trading orders - sent to exchange
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exchangeOrderId: varchar("exchange_order_id", { length: 100 }),
  clientOrderId: varchar("client_order_id", { length: 100 }).unique(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  side: varchar("side", { length: 10 }).notNull(), // BUY or SELL
  orderType: varchar("order_type", { length: 20 }).notNull(), // MARKET, LIMIT
  requestedQty: decimal("requested_qty", { precision: 20, scale: 8 }).notNull(),
  executedQty: decimal("executed_qty", { precision: 20, scale: 8 }).default("0"),
  avgPrice: decimal("avg_price", { precision: 20, scale: 8 }),
  limitPrice: decimal("limit_price", { precision: 20, scale: 8 }),
  totalFees: decimal("total_fees", { precision: 20, scale: 8 }).default("0"),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, submitted, partial, filled, cancelled, rejected
  strategy: varchar("strategy", { length: 50 }),
  aiReason: text("ai_reason"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order fills - partial executions from exchange
export const fills = pgTable("fills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  exchangeFillId: varchar("exchange_fill_id", { length: 100 }),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  qty: decimal("qty", { precision: 20, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 20, scale: 8 }).default("0"),
  feeCurrency: varchar("fee_currency", { length: 20 }),
  executedAt: timestamp("executed_at").defaultNow(),
});

// Ledger entries - complete accounting trail
export const ledgerEntries = pgTable("ledger_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // nullable for pool-level entries
  entryType: varchar("entry_type", { length: 30 }).notNull(), // DEPOSIT, WITHDRAWAL, FEE, PNL_ALLOCATION, ADJUSTMENT, SHARE_ISSUE, SHARE_BURN
  amountUsdt: decimal("amount_usdt", { precision: 20, scale: 8 }).notNull(),
  sharesAffected: decimal("shares_affected", { precision: 20, scale: 8 }),
  navAtTime: decimal("nav_at_time", { precision: 20, scale: 8 }),
  referenceType: varchar("reference_type", { length: 30 }), // transaction, trade, order, adjustment
  referenceId: varchar("reference_id", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Holdings - current assets in the pool
export const holdings = pgTable("holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(),
  quantity: decimal("quantity", { precision: 20, scale: 8 }).notNull(),
  avgEntryPrice: decimal("avg_entry_price", { precision: 20, scale: 8 }).notNull(),
  currentPrice: decimal("current_price", { precision: 20, scale: 8 }),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 20, scale: 8 }).default("0"),
  unrealizedPnlPercent: decimal("unrealized_pnl_percent", { precision: 10, scale: 4 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications stored in DB (for persistence)
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 200 }),
  message: text("message"),
  notificationType: varchar("notification_type", { length: 30 }), // trade, alert, portfolio, system, risk, accounting
  severity: varchar("severity", { length: 20 }).default("info"), // info, warning, error, success
  read: boolean("read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  shares: one(userShares, {
    fields: [users.id],
    references: [userShares.userId],
  }),
  transactions: many(transactions),
}));

export const userSharesRelations = relations(userShares, ({ one }) => ({
  user: one(users, {
    fields: [userShares.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserCredentialsSchema = createInsertSchema(userCredentials).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTermsAcceptanceSchema = createInsertSchema(termsAcceptance).omit({ id: true, acceptedAt: true });
export const insertUserSharesSchema = createInsertSchema(userShares).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true, createdAt: true });
export const insertPortfolioHistorySchema = createInsertSchema(portfolioHistory).omit({ id: true, recordedAt: true });
export const insertSentimentSchema = createInsertSchema(sentimentAnalysis).omit({ id: true, createdAt: true });
export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({ id: true, updatedAt: true });
export const insertMarketDataSchema = createInsertSchema(marketData).omit({ id: true, updatedAt: true });
export const insertWalletAddressSchema = createInsertSchema(walletAddresses).omit({ id: true, createdAt: true });
export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({ id: true, updatedAt: true });
export const insertBacktestResultSchema = createInsertSchema(backtestResults).omit({ id: true, createdAt: true });
export const insertRlAgentConfigSchema = createInsertSchema(rlAgentConfig).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRlTrainingEpisodeSchema = createInsertSchema(rlTrainingEpisodes).omit({ id: true, createdAt: true });
export const insertRlDecisionSchema = createInsertSchema(rlDecisions).omit({ id: true, createdAt: true });

// New table schemas
export const insertPortfolioNavSchema = createInsertSchema(portfolioNav).omit({ id: true, recordedAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFillSchema = createInsertSchema(fills).omit({ id: true, executedAt: true });
export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({ id: true, createdAt: true });
export const insertHoldingSchema = createInsertSchema(holdings).omit({ id: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUserCredentials = z.infer<typeof insertUserCredentialsSchema>;
export type UserCredentials = typeof userCredentials.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertTermsAcceptance = z.infer<typeof insertTermsAcceptanceSchema>;
export type TermsAcceptance = typeof termsAcceptance.$inferSelect;
export type InsertUserShares = z.infer<typeof insertUserSharesSchema>;
export type UserShares = typeof userShares.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertPortfolioHistory = z.infer<typeof insertPortfolioHistorySchema>;
export type PortfolioHistory = typeof portfolioHistory.$inferSelect;
export type InsertSentiment = z.infer<typeof insertSentimentSchema>;
export type Sentiment = typeof sentimentAnalysis.$inferSelect;
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettings.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;
export type MarketData = typeof marketData.$inferSelect;
export type InsertWalletAddress = z.infer<typeof insertWalletAddressSchema>;
export type WalletAddress = typeof walletAddresses.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertBacktestResult = z.infer<typeof insertBacktestResultSchema>;
export type BacktestResult = typeof backtestResults.$inferSelect;
export type InsertRlAgentConfig = z.infer<typeof insertRlAgentConfigSchema>;
export type RlAgentConfig = typeof rlAgentConfig.$inferSelect;
export type InsertRlTrainingEpisode = z.infer<typeof insertRlTrainingEpisodeSchema>;
export type RlTrainingEpisode = typeof rlTrainingEpisodes.$inferSelect;
export type InsertRlDecision = z.infer<typeof insertRlDecisionSchema>;
export type RlDecision = typeof rlDecisions.$inferSelect;

// New table types
export type InsertPortfolioNav = z.infer<typeof insertPortfolioNavSchema>;
export type PortfolioNav = typeof portfolioNav.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertFill = z.infer<typeof insertFillSchema>;
export type Fill = typeof fills.$inferSelect;
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Holding = typeof holdings.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
