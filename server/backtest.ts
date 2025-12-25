import type { Candle } from "./smc";

export type StrategyType = "rsi" | "macd" | "sma" | "combined" | "smc";

interface BacktestConfig {
  strategy: StrategyType;
  symbol: string;
  initialCapital: number;
  rsiPeriod?: number;
  rsiBuyThreshold?: number;
  rsiSellThreshold?: number;
  macdFastPeriod?: number;
  macdSlowPeriod?: number;
  macdSignalPeriod?: number;
  smaPeriod?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
}

interface BacktestTrade {
  timestamp: number;
  type: "buy" | "sell";
  price: number;
  quantity: number;
  value: number;
  pnl: number;
  reason: string;
}

interface EquityPoint {
  timestamp: number;
  equity: number;
  drawdown: number;
}

export interface BacktestResult {
  strategyName: string;
  symbol: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  finalCapital: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalReturn: number;
  totalReturnPercent: number;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  parameters: Record<string, unknown>;
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): { macd: number; signal: number; histogram: number } {
  if (prices.length < slowPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  const macd = emaFast - emaSlow;
  
  const macdLine: number[] = [];
  let emaFastVal = prices.slice(0, fastPeriod).reduce((a, b) => a + b, 0) / fastPeriod;
  let emaSlowVal = prices.slice(0, slowPeriod).reduce((a, b) => a + b, 0) / slowPeriod;
  const kFast = 2 / (fastPeriod + 1);
  const kSlow = 2 / (slowPeriod + 1);
  
  for (let i = 0; i < prices.length; i++) {
    if (i >= fastPeriod) {
      emaFastVal = prices[i] * kFast + emaFastVal * (1 - kFast);
    }
    if (i >= slowPeriod) {
      emaSlowVal = prices[i] * kSlow + emaSlowVal * (1 - kSlow);
      macdLine.push(emaFastVal - emaSlowVal);
    }
  }
  
  const signal = macdLine.length >= signalPeriod 
    ? calculateEMA(macdLine, signalPeriod) 
    : 0;
  
  return { macd, signal, histogram: macd - signal };
}

export class BacktestEngine {
  private config: BacktestConfig;
  
  constructor(config: BacktestConfig) {
    this.config = {
      rsiPeriod: 14,
      rsiBuyThreshold: 30,
      rsiSellThreshold: 70,
      macdFastPeriod: 12,
      macdSlowPeriod: 26,
      macdSignalPeriod: 9,
      smaPeriod: 20,
      stopLossPercent: 2,
      takeProfitPercent: 5,
      ...config,
    };
  }
  
  run(candles: Candle[]): BacktestResult {
    if (candles.length < 50) {
      throw new Error("Need at least 50 candles for backtesting");
    }
    
    const trades: BacktestTrade[] = [];
    const equityCurve: EquityPoint[] = [];
    
    let capital = this.config.initialCapital;
    let position = 0;
    let entryPrice = 0;
    let maxEquity = capital;
    let maxDrawdown = 0;
    
    const prices = candles.map(c => c.close);
    const startDate = new Date(candles[0].time);
    const endDate = new Date(candles[candles.length - 1].time);
    
    for (let i = 30; i < candles.length; i++) {
      const priceSlice = prices.slice(0, i + 1);
      const currentPrice = candles[i].close;
      const currentTime = candles[i].time;
      
      const signal = this.getSignal(priceSlice, candles.slice(0, i + 1));
      
      if (position > 0) {
        const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
        
        if (pnlPercent <= -this.config.stopLossPercent!) {
          const value = position * currentPrice;
          const pnl = value - (position * entryPrice);
          trades.push({
            timestamp: currentTime,
            type: "sell",
            price: currentPrice,
            quantity: position,
            value,
            pnl,
            reason: "Stop Loss",
          });
          capital = value;
          position = 0;
          entryPrice = 0;
        } else if (pnlPercent >= this.config.takeProfitPercent!) {
          const value = position * currentPrice;
          const pnl = value - (position * entryPrice);
          trades.push({
            timestamp: currentTime,
            type: "sell",
            price: currentPrice,
            quantity: position,
            value,
            pnl,
            reason: "Take Profit",
          });
          capital = value;
          position = 0;
          entryPrice = 0;
        } else if (signal === "sell") {
          const value = position * currentPrice;
          const pnl = value - (position * entryPrice);
          trades.push({
            timestamp: currentTime,
            type: "sell",
            price: currentPrice,
            quantity: position,
            value,
            pnl,
            reason: this.getSignalReason("sell"),
          });
          capital = value;
          position = 0;
          entryPrice = 0;
        }
      } else if (signal === "buy" && capital > 0) {
        position = capital / currentPrice;
        entryPrice = currentPrice;
        trades.push({
          timestamp: currentTime,
          type: "buy",
          price: currentPrice,
          quantity: position,
          value: capital,
          pnl: 0,
          reason: this.getSignalReason("buy"),
        });
        capital = 0;
      }
      
      const currentEquity = capital + (position * currentPrice);
      maxEquity = Math.max(maxEquity, currentEquity);
      const drawdown = ((maxEquity - currentEquity) / maxEquity) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
      
      if (i % 5 === 0 || i === candles.length - 1) {
        equityCurve.push({
          timestamp: currentTime,
          equity: currentEquity,
          drawdown,
        });
      }
    }
    
    if (position > 0) {
      const finalPrice = candles[candles.length - 1].close;
      const value = position * finalPrice;
      const pnl = value - (position * entryPrice);
      trades.push({
        timestamp: candles[candles.length - 1].time,
        type: "sell",
        price: finalPrice,
        quantity: position,
        value,
        pnl,
        reason: "End of Backtest",
      });
      capital = value;
      position = 0;
    }
    
    const sellTrades = trades.filter(t => t.type === "sell");
    const winningTrades = sellTrades.filter(t => t.pnl > 0);
    const losingTrades = sellTrades.filter(t => t.pnl <= 0);
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    const returns = equityCurve.map((p, i) => {
      if (i === 0) return 0;
      return (p.equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity;
    }).slice(1);
    
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 0 
      ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
      : 0;
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
    
    const totalReturn = capital - this.config.initialCapital;
    const totalReturnPercent = (totalReturn / this.config.initialCapital) * 100;
    
    return {
      strategyName: this.getStrategyDisplayName(),
      symbol: this.config.symbol,
      startDate,
      endDate,
      initialCapital: this.config.initialCapital,
      finalCapital: capital,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: sellTrades.length > 0 ? (winningTrades.length / sellTrades.length) * 100 : 0,
      profitFactor: isFinite(profitFactor) ? profitFactor : 0,
      maxDrawdown,
      sharpeRatio,
      totalReturn,
      totalReturnPercent,
      trades,
      equityCurve,
      parameters: {
        strategy: this.config.strategy,
        rsiPeriod: this.config.rsiPeriod,
        rsiBuyThreshold: this.config.rsiBuyThreshold,
        rsiSellThreshold: this.config.rsiSellThreshold,
        macdFastPeriod: this.config.macdFastPeriod,
        macdSlowPeriod: this.config.macdSlowPeriod,
        macdSignalPeriod: this.config.macdSignalPeriod,
        smaPeriod: this.config.smaPeriod,
        stopLossPercent: this.config.stopLossPercent,
        takeProfitPercent: this.config.takeProfitPercent,
      },
    };
  }
  
  private getSignal(prices: number[], candles: Candle[]): "buy" | "sell" | "hold" {
    switch (this.config.strategy) {
      case "rsi":
        return this.getRSISignal(prices);
      case "macd":
        return this.getMACDSignal(prices);
      case "sma":
        return this.getSMASignal(prices);
      case "combined":
        return this.getCombinedSignal(prices);
      case "smc":
        return this.getSMCSignal(candles);
      default:
        return "hold";
    }
  }
  
  private getRSISignal(prices: number[]): "buy" | "sell" | "hold" {
    const rsi = calculateRSI(prices, this.config.rsiPeriod!);
    
    if (rsi < this.config.rsiBuyThreshold!) {
      return "buy";
    } else if (rsi > this.config.rsiSellThreshold!) {
      return "sell";
    }
    return "hold";
  }
  
  private getMACDSignal(prices: number[]): "buy" | "sell" | "hold" {
    if (prices.length < this.config.macdSlowPeriod! + 2) return "hold";
    
    const current = calculateMACD(prices, this.config.macdFastPeriod!, this.config.macdSlowPeriod!, this.config.macdSignalPeriod!);
    const previous = calculateMACD(prices.slice(0, -1), this.config.macdFastPeriod!, this.config.macdSlowPeriod!, this.config.macdSignalPeriod!);
    
    if (previous.histogram < 0 && current.histogram > 0) {
      return "buy";
    } else if (previous.histogram > 0 && current.histogram < 0) {
      return "sell";
    }
    return "hold";
  }
  
  private getSMASignal(prices: number[]): "buy" | "sell" | "hold" {
    const currentPrice = prices[prices.length - 1];
    const sma = calculateSMA(prices, this.config.smaPeriod!);
    const prevPrice = prices[prices.length - 2];
    const prevSMA = calculateSMA(prices.slice(0, -1), this.config.smaPeriod!);
    
    if (prevPrice < prevSMA && currentPrice > sma) {
      return "buy";
    } else if (prevPrice > prevSMA && currentPrice < sma) {
      return "sell";
    }
    return "hold";
  }
  
  private getCombinedSignal(prices: number[]): "buy" | "sell" | "hold" {
    const rsiSignal = this.getRSISignal(prices);
    const macdSignal = this.getMACDSignal(prices);
    const smaSignal = this.getSMASignal(prices);
    
    const signals = [rsiSignal, macdSignal, smaSignal];
    const buyCount = signals.filter(s => s === "buy").length;
    const sellCount = signals.filter(s => s === "sell").length;
    
    if (buyCount >= 2) return "buy";
    if (sellCount >= 2) return "sell";
    return "hold";
  }
  
  private getSMCSignal(candles: Candle[]): "buy" | "sell" | "hold" {
    if (candles.length < 20) return "hold";
    
    const recentCandles = candles.slice(-20);
    const highs = recentCandles.map(c => c.high);
    const lows = recentCandles.map(c => c.low);
    
    const currentHigh = highs[highs.length - 1];
    const currentLow = lows[lows.length - 1];
    const prevHigh = Math.max(...highs.slice(0, -1));
    const prevLow = Math.min(...lows.slice(0, -1));
    
    const currentClose = recentCandles[recentCandles.length - 1].close;
    const prevClose = recentCandles[recentCandles.length - 2].close;
    
    if (currentLow < prevLow && currentClose > prevClose) {
      return "buy";
    }
    
    if (currentHigh > prevHigh && currentClose < prevClose) {
      return "sell";
    }
    
    return "hold";
  }
  
  private getSignalReason(signal: "buy" | "sell"): string {
    const strategyNames: Record<StrategyType, string> = {
      rsi: "RSI",
      macd: "MACD",
      sma: "SMA Crossover",
      combined: "Combined Strategy",
      smc: "Smart Money Concepts",
    };
    
    return `${strategyNames[this.config.strategy]} ${signal === "buy" ? "Buy" : "Sell"} Signal`;
  }
  
  private getStrategyDisplayName(): string {
    const names: Record<StrategyType, string> = {
      rsi: "RSI Strategy",
      macd: "MACD Strategy",
      sma: "SMA Crossover",
      combined: "Combined Strategy",
      smc: "Smart Money Concepts",
    };
    return names[this.config.strategy];
  }
}

export function runBacktest(
  candles: Candle[],
  strategy: StrategyType,
  symbol: string,
  initialCapital: number,
  options?: Partial<BacktestConfig>
): BacktestResult {
  const engine = new BacktestEngine({
    strategy,
    symbol,
    initialCapital,
    ...options,
  });
  return engine.run(candles);
}
