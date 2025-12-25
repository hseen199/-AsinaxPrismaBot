import type { Candle } from "./smc";

export type Action = "buy" | "sell" | "hold";

interface State {
  priceChange: number;
  rsi: number;
  macdSignal: number;
  volumeChange: number;
  trendStrength: number;
  volatility: number;
}

interface Experience {
  state: State;
  action: Action;
  reward: number;
  nextState: State;
  done: boolean;
}

interface QTable {
  [stateKey: string]: {
    buy: number;
    sell: number;
    hold: number;
  };
}

interface AgentConfig {
  learningRate: number;
  discountFactor: number;
  explorationRate: number;
  explorationDecay: number;
  minExploration: number;
  batchSize: number;
  memorySize: number;
}

interface TrainingResult {
  episodeNumber: number;
  totalReward: number;
  totalActions: number;
  buyActions: number;
  sellActions: number;
  holdActions: number;
  startingCapital: number;
  endingCapital: number;
  profitLoss: number;
  profitLossPercent: number;
  maxDrawdown: number;
  winRate: number;
  explorationRate: number;
}

interface Prediction {
  action: Action;
  confidence: number;
  qValues: { buy: number; sell: number; hold: number };
  stateFeatures: State;
}

function calculateRSI(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
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

function calculateMACD(candles: Candle[]): { macd: number; signal: number; histogram: number } {
  if (candles.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const closes = candles.map((c) => c.close);

  function ema(data: number[], period: number): number {
    const k = 2 / (period + 1);
    let emaValue = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) {
      emaValue = data[i] * k + emaValue * (1 - k);
    }
    return emaValue;
  }

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macd = ema12 - ema26;

  const macdLine: number[] = [];
  let ema12Val = closes.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
  let ema26Val = closes.slice(0, 26).reduce((a, b) => a + b, 0) / 26;
  const k12 = 2 / 13;
  const k26 = 2 / 27;

  for (let i = 0; i < closes.length; i++) {
    if (i >= 12) {
      ema12Val = closes[i] * k12 + ema12Val * (1 - k12);
    }
    if (i >= 26) {
      ema26Val = closes[i] * k26 + ema26Val * (1 - k26);
      macdLine.push(ema12Val - ema26Val);
    }
  }

  const signal = macdLine.length >= 9 ? ema(macdLine, 9) : 0;

  return { macd, signal, histogram: macd - signal };
}

function calculateVolatility(candles: Candle[], period: number = 14): number {
  if (candles.length < period) return 0;

  const returns: number[] = [];
  for (let i = candles.length - period; i < candles.length; i++) {
    const ret = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
    returns.push(ret);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * 100;
}

function calculateTrendStrength(candles: Candle[], period: number = 20): number {
  if (candles.length < period) return 0;

  const recentCandles = candles.slice(-period);
  const sma = recentCandles.reduce((sum, c) => sum + c.close, 0) / period;
  const currentPrice = candles[candles.length - 1].close;

  return ((currentPrice - sma) / sma) * 100;
}

export class RLTradingAgent {
  private qTable: QTable;
  private config: AgentConfig;
  private replayMemory: Experience[];
  private totalEpisodes: number;
  private totalReward: number;

  constructor(config?: Partial<AgentConfig>, existingQTable?: QTable) {
    this.config = {
      learningRate: config?.learningRate ?? 0.001,
      discountFactor: config?.discountFactor ?? 0.95,
      explorationRate: config?.explorationRate ?? 0.1,
      explorationDecay: config?.explorationDecay ?? 0.995,
      minExploration: config?.minExploration ?? 0.01,
      batchSize: config?.batchSize ?? 32,
      memorySize: config?.memorySize ?? 10000,
    };
    this.qTable = existingQTable ?? {};
    this.replayMemory = [];
    this.totalEpisodes = 0;
    this.totalReward = 0;
  }

  extractState(candles: Candle[]): State {
    if (candles.length < 27) {
      return {
        priceChange: 0,
        rsi: 50,
        macdSignal: 0,
        volumeChange: 0,
        trendStrength: 0,
        volatility: 0,
      };
    }

    const currentPrice = candles[candles.length - 1].close;
    const prevPrice = candles[candles.length - 2].close;
    const priceChange = ((currentPrice - prevPrice) / prevPrice) * 100;

    const rsi = calculateRSI(candles);
    const macd = calculateMACD(candles);
    const macdSignal = macd.histogram > 0 ? 1 : macd.histogram < 0 ? -1 : 0;

    const currentVolume = candles[candles.length - 1].volume;
    const prevVolume = candles[candles.length - 2].volume;
    const volumeChange = prevVolume > 0 ? ((currentVolume - prevVolume) / prevVolume) * 100 : 0;

    const trendStrength = calculateTrendStrength(candles);
    const volatility = calculateVolatility(candles);

    return {
      priceChange: Math.max(-10, Math.min(10, priceChange)),
      rsi,
      macdSignal,
      volumeChange: Math.max(-100, Math.min(100, volumeChange)),
      trendStrength: Math.max(-10, Math.min(10, trendStrength)),
      volatility: Math.min(10, volatility),
    };
  }

  private discretizeState(state: State): string {
    const priceLevel = Math.floor(state.priceChange / 2);
    const rsiLevel = Math.floor(state.rsi / 20);
    const macdLevel = state.macdSignal;
    const volumeLevel = state.volumeChange > 50 ? 2 : state.volumeChange > -50 ? 1 : 0;
    const trendLevel = state.trendStrength > 2 ? 2 : state.trendStrength > -2 ? 1 : 0;
    const volLevel = state.volatility > 5 ? 2 : state.volatility > 2 ? 1 : 0;

    return `${priceLevel}_${rsiLevel}_${macdLevel}_${volumeLevel}_${trendLevel}_${volLevel}`;
  }

  private getQValues(stateKey: string): { buy: number; sell: number; hold: number } {
    if (!this.qTable[stateKey]) {
      this.qTable[stateKey] = { buy: 0, sell: 0, hold: 0 };
    }
    return this.qTable[stateKey];
  }

  selectAction(state: State, explore: boolean = true): Action {
    const stateKey = this.discretizeState(state);
    const qValues = this.getQValues(stateKey);

    if (explore && Math.random() < this.config.explorationRate) {
      const actions: Action[] = ["buy", "sell", "hold"];
      return actions[Math.floor(Math.random() * actions.length)];
    }

    if (qValues.buy >= qValues.sell && qValues.buy >= qValues.hold) {
      return "buy";
    } else if (qValues.sell >= qValues.buy && qValues.sell >= qValues.hold) {
      return "sell";
    }
    return "hold";
  }

  predict(candles: Candle[]): Prediction {
    const state = this.extractState(candles);
    const stateKey = this.discretizeState(state);
    const qValues = this.getQValues(stateKey);
    const action = this.selectAction(state, false);

    const maxQ = Math.max(qValues.buy, qValues.sell, qValues.hold);
    const sumQ = Math.abs(qValues.buy) + Math.abs(qValues.sell) + Math.abs(qValues.hold);
    const confidence = sumQ > 0 ? Math.abs(qValues[action]) / sumQ : 0.33;

    return {
      action,
      confidence,
      qValues,
      stateFeatures: state,
    };
  }

  private updateQValue(
    state: State,
    action: Action,
    reward: number,
    nextState: State
  ): void {
    const stateKey = this.discretizeState(state);
    const nextStateKey = this.discretizeState(nextState);

    const currentQ = this.getQValues(stateKey)[action];
    const nextQValues = this.getQValues(nextStateKey);
    const maxNextQ = Math.max(nextQValues.buy, nextQValues.sell, nextQValues.hold);

    const newQ =
      currentQ +
      this.config.learningRate *
        (reward + this.config.discountFactor * maxNextQ - currentQ);

    this.qTable[stateKey][action] = newQ;
  }

  private addExperience(experience: Experience): void {
    this.replayMemory.push(experience);
    if (this.replayMemory.length > this.config.memorySize) {
      this.replayMemory.shift();
    }
  }

  private replayBatch(): void {
    if (this.replayMemory.length < this.config.batchSize) return;

    const batch: Experience[] = [];
    for (let i = 0; i < this.config.batchSize; i++) {
      const idx = Math.floor(Math.random() * this.replayMemory.length);
      batch.push(this.replayMemory[idx]);
    }

    for (const experience of batch) {
      this.updateQValue(
        experience.state,
        experience.action,
        experience.reward,
        experience.nextState
      );
    }
  }

  train(candles: Candle[], initialCapital: number = 10000): TrainingResult {
    if (candles.length < 50) {
      throw new Error("Need at least 50 candles for training");
    }

    let capital = initialCapital;
    let position = 0;
    let entryPrice = 0;
    let totalReward = 0;
    let maxCapital = initialCapital;
    let maxDrawdown = 0;
    let buyActions = 0;
    let sellActions = 0;
    let holdActions = 0;
    let wins = 0;
    let trades = 0;

    const windowSize = 30;
    const actions: { action: Action; profit: number }[] = [];

    for (let i = windowSize; i < candles.length - 1; i++) {
      const windowCandles = candles.slice(i - windowSize, i + 1);
      const state = this.extractState(windowCandles);
      const action = this.selectAction(state, true);
      const currentPrice = candles[i].close;
      const nextPrice = candles[i + 1].close;

      let reward = 0;
      let tradeProfit = 0;

      switch (action) {
        case "buy":
          buyActions++;
          if (position === 0) {
            position = capital / currentPrice;
            entryPrice = currentPrice;
            capital = 0;
          }
          if (position > 0) {
            reward = ((nextPrice - currentPrice) / currentPrice) * 100;
          }
          break;

        case "sell":
          sellActions++;
          if (position > 0) {
            const exitValue = position * currentPrice;
            tradeProfit = exitValue - position * entryPrice;
            capital = exitValue;
            
            if (tradeProfit > 0) wins++;
            trades++;
            
            position = 0;
            entryPrice = 0;
            reward = (tradeProfit / (position > 0 ? position * entryPrice : capital)) * 100;
          } else {
            reward = -0.1;
          }
          break;

        case "hold":
          holdActions++;
          if (position > 0) {
            reward = ((nextPrice - currentPrice) / currentPrice) * 50;
          } else {
            reward = -0.05;
          }
          break;
      }

      const currentValue = capital + position * currentPrice;
      maxCapital = Math.max(maxCapital, currentValue);
      const drawdown = ((maxCapital - currentValue) / maxCapital) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);

      totalReward += reward;
      actions.push({ action, profit: reward });

      const nextWindowCandles = candles.slice(i - windowSize + 1, i + 2);
      const nextState = this.extractState(nextWindowCandles);

      this.addExperience({
        state,
        action,
        reward,
        nextState,
        done: i === candles.length - 2,
      });

      if (this.replayMemory.length >= this.config.batchSize) {
        this.replayBatch();
      }
    }

    if (position > 0) {
      capital = position * candles[candles.length - 1].close;
      position = 0;
    }

    this.config.explorationRate = Math.max(
      this.config.minExploration,
      this.config.explorationRate * this.config.explorationDecay
    );

    this.totalEpisodes++;
    this.totalReward += totalReward;

    const profitLoss = capital - initialCapital;
    const profitLossPercent = (profitLoss / initialCapital) * 100;
    const winRate = trades > 0 ? (wins / trades) * 100 : 0;

    return {
      episodeNumber: this.totalEpisodes,
      totalReward,
      totalActions: buyActions + sellActions + holdActions,
      buyActions,
      sellActions,
      holdActions,
      startingCapital: initialCapital,
      endingCapital: capital,
      profitLoss,
      profitLossPercent,
      maxDrawdown,
      winRate,
      explorationRate: this.config.explorationRate,
    };
  }

  getQTable(): QTable {
    return { ...this.qTable };
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  getStats(): {
    totalEpisodes: number;
    totalReward: number;
    avgReward: number;
    explorationRate: number;
    statesLearned: number;
  } {
    return {
      totalEpisodes: this.totalEpisodes,
      totalReward: this.totalReward,
      avgReward: this.totalEpisodes > 0 ? this.totalReward / this.totalEpisodes : 0,
      explorationRate: this.config.explorationRate,
      statesLearned: Object.keys(this.qTable).length,
    };
  }

  setConfig(config: Partial<AgentConfig>): void {
    Object.assign(this.config, config);
  }

  loadQTable(qTable: QTable): void {
    this.qTable = { ...qTable };
  }

  reset(): void {
    this.qTable = {};
    this.replayMemory = [];
    this.totalEpisodes = 0;
    this.totalReward = 0;
    this.config.explorationRate = 0.1;
  }
}

export const rlAgentInstances = new Map<string, RLTradingAgent>();

export function getOrCreateAgent(
  symbol: string,
  config?: Partial<AgentConfig>,
  existingQTable?: QTable
): RLTradingAgent {
  const key = symbol.toUpperCase();
  if (!rlAgentInstances.has(key)) {
    rlAgentInstances.set(key, new RLTradingAgent(config, existingQTable));
  }
  return rlAgentInstances.get(key)!;
}

export function resetAgent(symbol: string): void {
  const key = symbol.toUpperCase();
  const agent = rlAgentInstances.get(key);
  if (agent) {
    agent.reset();
  }
}
