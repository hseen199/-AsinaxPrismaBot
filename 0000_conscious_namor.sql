CREATE TABLE "backtest_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_name" varchar(100) NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"initial_capital" numeric(20, 8) NOT NULL,
	"final_capital" numeric(20, 8) NOT NULL,
	"total_trades" integer NOT NULL,
	"winning_trades" integer NOT NULL,
	"losing_trades" integer NOT NULL,
	"win_rate" numeric(5, 2) NOT NULL,
	"profit_factor" numeric(10, 4),
	"max_drawdown" numeric(10, 4),
	"sharpe_ratio" numeric(10, 4),
	"parameters" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bot_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_active" boolean DEFAULT false,
	"max_risk_percent" numeric(5, 2) DEFAULT '5',
	"stop_loss_percent" numeric(5, 2) DEFAULT '3',
	"take_profit_percent" numeric(5, 2) DEFAULT '10',
	"max_position_size" numeric(20, 8) DEFAULT '1000',
	"trading_pairs" text[] DEFAULT ARRAY['BTC/USDT', 'ETH/USDT'],
	"use_ai_sentiment" boolean DEFAULT true,
	"use_rsi" boolean DEFAULT true,
	"use_macd" boolean DEFAULT true,
	"use_moving_averages" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"exchange_fill_id" varchar(100),
	"price" numeric(20, 8) NOT NULL,
	"qty" numeric(20, 8) NOT NULL,
	"fee" numeric(20, 8) DEFAULT '0',
	"fee_currency" varchar(20),
	"executed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"avg_entry_price" numeric(20, 8) NOT NULL,
	"current_price" numeric(20, 8),
	"unrealized_pnl" numeric(20, 8) DEFAULT '0',
	"unrealized_pnl_percent" numeric(10, 4) DEFAULT '0',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "holdings_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"entry_type" varchar(30) NOT NULL,
	"amount_usdt" numeric(20, 8) NOT NULL,
	"shares_affected" numeric(20, 8),
	"nav_at_time" numeric(20, 8),
	"reference_type" varchar(30),
	"reference_id" varchar(100),
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "market_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"price" numeric(20, 8) NOT NULL,
	"change_24h" numeric(10, 4),
	"change_percent_24h" numeric(10, 4),
	"volume_24h" numeric(30, 8),
	"high_24h" numeric(20, 8),
	"low_24h" numeric(20, 8),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"telegram_chat_id" varchar(100),
	"telegram_enabled" boolean DEFAULT false,
	"email_enabled" boolean DEFAULT true,
	"trade_notifications" boolean DEFAULT true,
	"deposit_notifications" boolean DEFAULT true,
	"withdrawal_notifications" boolean DEFAULT true,
	"ai_signal_notifications" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar(200),
	"message" text,
	"notification_type" varchar(30),
	"severity" varchar(20) DEFAULT 'info',
	"read" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange_order_id" varchar(100),
	"client_order_id" varchar(100),
	"symbol" varchar(20) NOT NULL,
	"side" varchar(10) NOT NULL,
	"order_type" varchar(20) NOT NULL,
	"requested_qty" numeric(20, 8) NOT NULL,
	"executed_qty" numeric(20, 8) DEFAULT '0',
	"avg_price" numeric(20, 8),
	"limit_price" numeric(20, 8),
	"total_fees" numeric(20, 8) DEFAULT '0',
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"strategy" varchar(50),
	"ai_reason" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_client_order_id_unique" UNIQUE("client_order_id")
);
--> statement-breakpoint
CREATE TABLE "portfolio_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"total_value" numeric(20, 8) NOT NULL,
	"total_shares" numeric(20, 8) NOT NULL,
	"price_per_share" numeric(20, 8) NOT NULL,
	"daily_change" numeric(10, 4) DEFAULT '0',
	"daily_change_percent" numeric(10, 4) DEFAULT '0',
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio_nav" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"total_equity_usdt" numeric(20, 8) NOT NULL,
	"cash_usdt" numeric(20, 8) NOT NULL,
	"holdings_value_usdt" numeric(20, 8) DEFAULT '0',
	"unrealized_pnl_usdt" numeric(20, 8) DEFAULT '0',
	"realized_pnl_usdt" numeric(20, 8) DEFAULT '0',
	"fees_usdt" numeric(20, 8) DEFAULT '0',
	"total_shares_outstanding" numeric(20, 8) NOT NULL,
	"nav_per_share" numeric(20, 8) NOT NULL,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rl_agent_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT false,
	"learning_rate" numeric(10, 8) DEFAULT '0.001',
	"discount_factor" numeric(5, 4) DEFAULT '0.95',
	"exploration_rate" numeric(5, 4) DEFAULT '0.1',
	"exploration_decay" numeric(10, 8) DEFAULT '0.995',
	"min_exploration" numeric(5, 4) DEFAULT '0.01',
	"batch_size" integer DEFAULT 32,
	"memory_size" integer DEFAULT 10000,
	"q_table" jsonb,
	"total_episodes" integer DEFAULT 0,
	"total_reward" numeric(20, 8) DEFAULT '0',
	"avg_reward" numeric(20, 8) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rl_decisions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"action" varchar(10) NOT NULL,
	"confidence" numeric(5, 4),
	"state_features" jsonb,
	"q_values" jsonb,
	"price" numeric(20, 8),
	"was_executed" boolean DEFAULT false,
	"reward" numeric(20, 8),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rl_training_episodes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"episode_number" integer NOT NULL,
	"starting_capital" numeric(20, 8) NOT NULL,
	"ending_capital" numeric(20, 8) NOT NULL,
	"total_reward" numeric(20, 8) NOT NULL,
	"total_actions" integer NOT NULL,
	"buy_actions" integer DEFAULT 0,
	"sell_actions" integer DEFAULT 0,
	"hold_actions" integer DEFAULT 0,
	"profit_loss" numeric(20, 8),
	"profit_loss_percent" numeric(10, 4),
	"max_drawdown" numeric(10, 4),
	"win_rate" numeric(5, 2),
	"exploration_rate" numeric(5, 4),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sentiment_analysis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"sentiment" varchar(20) NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"summary" text,
	"news_source" text,
	"confidence" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terms_acceptance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"version" varchar(20) NOT NULL,
	"accepted_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pair" varchar(20) NOT NULL,
	"type" varchar(10) NOT NULL,
	"amount" numeric(20, 8) NOT NULL,
	"price" numeric(20, 8) NOT NULL,
	"total" numeric(20, 8) NOT NULL,
	"fee" numeric(20, 8) DEFAULT '0',
	"profit_loss" numeric(20, 8),
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"strategy" varchar(50),
	"ai_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" numeric(20, 8) NOT NULL,
	"shares_at_time" numeric(20, 8),
	"price_per_share" numeric(20, 8),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"tx_hash" varchar,
	"wallet_address" varchar(256),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_credentials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"password_hash" varchar(256) NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verification_code" varchar(10),
	"verification_expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"birth_date" timestamp,
	"phone" varchar(20),
	"country" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_shares" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"total_shares" numeric(20, 8) DEFAULT '0' NOT NULL,
	"total_deposited" numeric(20, 8) DEFAULT '0' NOT NULL,
	"current_value" numeric(20, 8) DEFAULT '0' NOT NULL,
	"profit_loss" numeric(20, 8) DEFAULT '0' NOT NULL,
	"profit_loss_percent" numeric(10, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"google_id" varchar,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_addresses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"coin" varchar(20) NOT NULL,
	"network" varchar(20) NOT NULL,
	"address" varchar(256) NOT NULL,
	"memo" varchar(256),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "fills" ADD CONSTRAINT "fills_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rl_decisions" ADD CONSTRAINT "rl_decisions_agent_id_rl_agent_config_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."rl_agent_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rl_training_episodes" ADD CONSTRAINT "rl_training_episodes_agent_id_rl_agent_config_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."rl_agent_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_acceptance" ADD CONSTRAINT "terms_acceptance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_shares" ADD CONSTRAINT "user_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_addresses" ADD CONSTRAINT "wallet_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");