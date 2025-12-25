# Overview

ASINAX CRYPTO AI is an Arabic-RTL cryptocurrency trading platform that combines collective investment pooling with AI-powered automated trading on MEXC exchange. The platform enables users to invest in a shared portfolio managed by an intelligent trading bot that uses technical indicators (RSI, MACD, Moving Averages) and OpenAI sentiment analysis to execute trades. Users track their share-based ownership, view real-time portfolio performance, and manage bot trading strategies through a modern dashboard interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: React 18 with TypeScript, Vite build system, Wouter for client-side routing

**UI Framework**: Shadcn UI components built on Radix UI primitives with Tailwind CSS for styling

**Design System**: 
- RTL (right-to-left) layout optimized for Arabic language
- Cairo/Tajawal Google Fonts for Arabic typography
- Dark/light theme support with system preference detection
- Responsive design with mobile-first breakpoints
- Color system using HSL CSS variables for dynamic theming

**State Management**: TanStack Query (React Query) for server state caching and synchronization

**Component Organization**:
- Feature-based page components (Dashboard, Portfolio, Trades, Market, AI Analysis, Stats, Settings)
- Reusable UI components (StatsCard, PortfolioChart, TradesTable, BotStatus, SentimentCard, MarketTicker)
- Shadcn UI component library in `client/src/components/ui/`

**Data Visualization**: Recharts library for charts (AreaChart, BarChart, PieChart) showing portfolio performance, trade history, and market data

## Backend Architecture

**Runtime**: Node.js with Express.js framework

**Language**: TypeScript with ES modules

**API Design**: RESTful JSON API with the following endpoint categories:
- Authentication endpoints (Replit Auth integration)
- User data endpoints (shares, transactions)
- Trading endpoints (trades history, bot settings)
- Market data endpoints (prices, sentiment analysis)
- Portfolio endpoints (history, statistics)

**Authentication Strategy**: 
- Replit OpenID Connect (OIDC) integration using passport.js
- Session-based authentication with express-session
- PostgreSQL session store (connect-pg-simple)
- Middleware-protected routes requiring authentication

**AI Integration**: 
- OpenAI API for market sentiment analysis and trade signal generation
- Rate limiting with p-limit and retry logic with p-retry
- Sentiment scoring system (-100 to +100 range)
- Confidence-based trading recommendations

**Data Layer**: 
- Drizzle ORM for type-safe database operations
- Repository pattern via storage abstraction layer
- Transaction support for financial operations

## Data Storage

**Database**: PostgreSQL

**ORM**: Drizzle ORM with schema-first approach

**Schema Design**:
- `users` - User profiles from Replit Auth (id, email, name, profile image)
- `user_shares` - Individual user ownership in collective pool (shares, deposits, current value, P/L)
- `transactions` - Deposit/withdrawal history (type, amount, status, timestamps)
- `trades` - Bot trading activity (symbol, type, quantity, price, strategy, P/L)
- `portfolio_history` - Time-series portfolio snapshots (total value, share price, daily changes)
- `sentiment_analysis` - AI sentiment data per symbol (bullish/bearish/neutral, score, confidence)
- `bot_settings` - Trading bot configuration (strategies enabled, risk parameters, thresholds)
- `market_data` - Real-time market prices and metrics (symbol, price, 24h change, volume)
- `sessions` - Express session storage for authentication
- `portfolio_nav` - NAV snapshots (total equity, cash, holdings value, unrealized P/L, NAV per share)
- `orders` - Exchange orders (client_order_id, symbol, side, type, status, filled quantity)
- `fills` - Order execution fills (price, quantity, fee, executed timestamp)
- `ledger_entries` - Complete accounting trail (deposits, withdrawals, fees, P/L allocations)
- `holdings` - Current asset positions (symbol, quantity, avg entry price, unrealized P/L)
- `notifications` - User notifications (type, title, message, read status)

**Decimal Precision**: Financial values use `decimal(20, 8)` for cryptocurrency precision

**Migrations**: Drizzle Kit for schema migrations in `migrations/` directory

## External Dependencies

**Authentication Service**: Replit Identity (OpenID Connect provider)

**AI Service**: OpenAI API via Replit AI Integrations
- Base URL: `process.env.AI_INTEGRATIONS_OPENAI_BASE_URL`
- API Key: `process.env.AI_INTEGRATIONS_OPENAI_API_KEY`
- Model: GPT-5 for sentiment analysis and trade signals

**Cryptocurrency Exchange**: MEXC (implied by design docs, API integration not yet implemented in codebase)

**External Libraries**:
- Form handling: react-hook-form with zod validation
- Date manipulation: date-fns
- Icons: Lucide React
- Charts: Recharts
- Toast notifications: Radix UI Toast
- Session storage: PostgreSQL via connect-pg-simple

**Build Tools**:
- Vite for frontend bundling with HMR
- esbuild for server-side bundling in production
- TypeScript compiler for type checking
- Tailwind CSS with PostCSS for styling

**Development Tools**:
- Replit-specific plugins (cartographer, dev-banner, runtime-error-modal)
- Source map support for debugging