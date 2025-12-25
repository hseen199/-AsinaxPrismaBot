import { mexcService } from "./mexc";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface KillZone {
  name: string;
  nameAr: string;
  startHour: number;
  endHour: number;
  isActive: boolean;
  description: string;
}

export interface FairValueGap {
  type: "bullish" | "bearish";
  startPrice: number;
  endPrice: number;
  gapSize: number;
  gapPercent: number;
  timestamp: number;
  filled: boolean;
}

export interface OrderBlock {
  type: "bullish" | "bearish";
  priceHigh: number;
  priceLow: number;
  strength: number;
  timestamp: number;
  tested: boolean;
}

export interface LiquiditySweep {
  type: "buy_side" | "sell_side";
  level: number;
  sweptAt: number;
  priceAfterSweep: number;
  reversal: boolean;
}

export interface SMCAnalysis {
  symbol: string;
  timestamp: number;
  killZones: KillZone[];
  activeKillZone: KillZone | null;
  fairValueGaps: FairValueGap[];
  orderBlocks: OrderBlock[];
  liquiditySweeps: LiquiditySweep[];
  marketStructure: "bullish" | "bearish" | "ranging";
  bias: "long" | "short" | "neutral";
  confidenceScore: number;
}

const KILL_ZONES: Omit<KillZone, "isActive">[] = [
  {
    name: "Asian Session",
    nameAr: "الجلسة الآسيوية",
    startHour: 0,
    endHour: 8,
    description: "Low volatility consolidation phase",
  },
  {
    name: "London Session",
    nameAr: "جلسة لندن",
    startHour: 8,
    endHour: 12,
    description: "High volatility, major moves initiate here",
  },
  {
    name: "NY AM Session",
    nameAr: "جلسة نيويورك الصباحية",
    startHour: 13,
    endHour: 16,
    description: "Continuation or reversal of London moves",
  },
  {
    name: "NY PM Session",
    nameAr: "جلسة نيويورك المسائية",
    startHour: 19,
    endHour: 21,
    description: "Late day reversals and position squaring",
  },
];

function getActiveKillZones(): KillZone[] {
  const now = new Date();
  const utcHour = now.getUTCHours();

  return KILL_ZONES.map((kz) => ({
    ...kz,
    isActive: utcHour >= kz.startHour && utcHour < kz.endHour,
  }));
}

function detectFairValueGaps(candles: Candle[]): FairValueGap[] {
  const gaps: FairValueGap[] = [];

  for (let i = 2; i < candles.length; i++) {
    const candle1 = candles[i - 2];
    const candle2 = candles[i - 1];
    const candle3 = candles[i];

    if (candle1.low > candle3.high) {
      const gapSize = candle1.low - candle3.high;
      const gapPercent = (gapSize / candle2.close) * 100;

      if (gapPercent > 0.1) {
        gaps.push({
          type: "bearish",
          startPrice: candle3.high,
          endPrice: candle1.low,
          gapSize,
          gapPercent,
          timestamp: candle2.time,
          filled: false,
        });
      }
    }

    if (candle3.low > candle1.high) {
      const gapSize = candle3.low - candle1.high;
      const gapPercent = (gapSize / candle2.close) * 100;

      if (gapPercent > 0.1) {
        gaps.push({
          type: "bullish",
          startPrice: candle1.high,
          endPrice: candle3.low,
          gapSize,
          gapPercent,
          timestamp: candle2.time,
          filled: false,
        });
      }
    }
  }

  return gaps.slice(-10);
}

function detectOrderBlocks(candles: Candle[]): OrderBlock[] {
  const blocks: OrderBlock[] = [];

  for (let i = 3; i < candles.length; i++) {
    const candle = candles[i - 1];
    const prevCandles = candles.slice(i - 3, i - 1);
    const nextCandle = candles[i];

    const isBullishCandle = candle.close > candle.open;
    const isBearishCandle = candle.close < candle.open;

    const prevTrend = prevCandles.reduce((acc, c) => acc + (c.close - c.open), 0);

    if (isBullishCandle && prevTrend < 0) {
      const bodySize = Math.abs(candle.close - candle.open);
      const range = candle.high - candle.low;
      const strength = (bodySize / range) * 100;

      if (strength > 50) {
        blocks.push({
          type: "bullish",
          priceHigh: Math.max(candle.open, candle.close),
          priceLow: Math.min(candle.open, candle.close),
          strength: Math.min(strength, 100),
          timestamp: candle.time,
          tested: nextCandle.low <= candle.high,
        });
      }
    }

    if (isBearishCandle && prevTrend > 0) {
      const bodySize = Math.abs(candle.close - candle.open);
      const range = candle.high - candle.low;
      const strength = (bodySize / range) * 100;

      if (strength > 50) {
        blocks.push({
          type: "bearish",
          priceHigh: Math.max(candle.open, candle.close),
          priceLow: Math.min(candle.open, candle.close),
          strength: Math.min(strength, 100),
          timestamp: candle.time,
          tested: nextCandle.high >= candle.low,
        });
      }
    }
  }

  return blocks.slice(-10);
}

function detectLiquiditySweeps(candles: Candle[]): LiquiditySweep[] {
  const sweeps: LiquiditySweep[] = [];

  const recentHighs: { price: number; index: number }[] = [];
  const recentLows: { price: number; index: number }[] = [];

  for (let i = 2; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    if (prev.high < curr.high && next.high < curr.high) {
      recentHighs.push({ price: curr.high, index: i });
    }

    if (prev.low > curr.low && next.low > curr.low) {
      recentLows.push({ price: curr.low, index: i });
    }
  }

  for (let i = 5; i < candles.length; i++) {
    const candle = candles[i];

    for (const high of recentHighs) {
      if (high.index < i - 3 && candle.high > high.price * 1.001) {
        const nextCandle = candles[i + 1] || candle;
        const reversal = nextCandle.close < high.price;

        sweeps.push({
          type: "buy_side",
          level: high.price,
          sweptAt: candle.time,
          priceAfterSweep: nextCandle.close,
          reversal,
        });
      }
    }

    for (const low of recentLows) {
      if (low.index < i - 3 && candle.low < low.price * 0.999) {
        const nextCandle = candles[i + 1] || candle;
        const reversal = nextCandle.close > low.price;

        sweeps.push({
          type: "sell_side",
          level: low.price,
          sweptAt: candle.time,
          priceAfterSweep: nextCandle.close,
          reversal,
        });
      }
    }
  }

  return sweeps.slice(-10);
}

function determineMarketStructure(
  candles: Candle[]
): "bullish" | "bearish" | "ranging" {
  if (candles.length < 10) return "ranging";

  const recentCandles = candles.slice(-20);

  let higherHighs = 0;
  let lowerLows = 0;
  let higherLows = 0;
  let lowerHighs = 0;

  for (let i = 4; i < recentCandles.length; i++) {
    const curr = recentCandles[i];
    const prev = recentCandles[i - 4];

    if (curr.high > prev.high) higherHighs++;
    if (curr.low < prev.low) lowerLows++;
    if (curr.low > prev.low) higherLows++;
    if (curr.high < prev.high) lowerHighs++;
  }

  const bullishScore = higherHighs + higherLows;
  const bearishScore = lowerLows + lowerHighs;

  if (bullishScore > bearishScore * 1.3) return "bullish";
  if (bearishScore > bullishScore * 1.3) return "bearish";
  return "ranging";
}

function determineBias(
  structure: "bullish" | "bearish" | "ranging",
  orderBlocks: OrderBlock[],
  fvgs: FairValueGap[],
  sweeps: LiquiditySweep[]
): { bias: "long" | "short" | "neutral"; confidence: number } {
  let bullishScore = 0;
  let bearishScore = 0;

  if (structure === "bullish") bullishScore += 30;
  else if (structure === "bearish") bearishScore += 30;

  const recentOBs = orderBlocks.slice(-5);
  for (const ob of recentOBs) {
    if (ob.type === "bullish" && !ob.tested) bullishScore += 10;
    if (ob.type === "bearish" && !ob.tested) bearishScore += 10;
  }

  const recentFVGs = fvgs.slice(-5);
  for (const fvg of recentFVGs) {
    if (fvg.type === "bullish" && !fvg.filled) bullishScore += 8;
    if (fvg.type === "bearish" && !fvg.filled) bearishScore += 8;
  }

  const recentSweeps = sweeps.slice(-3);
  for (const sweep of recentSweeps) {
    if (sweep.type === "sell_side" && sweep.reversal) bullishScore += 15;
    if (sweep.type === "buy_side" && sweep.reversal) bearishScore += 15;
  }

  const totalScore = bullishScore + bearishScore;
  const maxScore = 100;

  if (bullishScore > bearishScore * 1.2) {
    return {
      bias: "long",
      confidence: Math.min((bullishScore / maxScore) * 100, 95),
    };
  }
  if (bearishScore > bullishScore * 1.2) {
    return {
      bias: "short",
      confidence: Math.min((bearishScore / maxScore) * 100, 95),
    };
  }

  return {
    bias: "neutral",
    confidence: Math.min((Math.max(bullishScore, bearishScore) / maxScore) * 100, 50),
  };
}

export async function analyzeSMC(
  symbol: string,
  candles: Candle[]
): Promise<SMCAnalysis> {
  const killZones = getActiveKillZones();
  const activeKillZone = killZones.find((kz) => kz.isActive) || null;

  const fairValueGaps = detectFairValueGaps(candles);
  const orderBlocks = detectOrderBlocks(candles);
  const liquiditySweeps = detectLiquiditySweeps(candles);
  const marketStructure = determineMarketStructure(candles);

  const { bias, confidence } = determineBias(
    marketStructure,
    orderBlocks,
    fairValueGaps,
    liquiditySweeps
  );

  return {
    symbol,
    timestamp: Date.now(),
    killZones,
    activeKillZone,
    fairValueGaps,
    orderBlocks,
    liquiditySweeps,
    marketStructure,
    bias,
    confidenceScore: confidence,
  };
}

export function generateSMCSignal(analysis: SMCAnalysis): {
  action: "buy" | "sell" | "hold";
  reason: string;
  confidence: number;
  killZoneBonus: boolean;
} {
  const isInKillZone = analysis.activeKillZone !== null;
  let action: "buy" | "sell" | "hold" = "hold";
  let reason = "";
  let confidence = analysis.confidenceScore;

  if (isInKillZone) {
    confidence = Math.min(confidence * 1.2, 95);
  }

  if (analysis.bias === "long" && confidence >= 60) {
    const recentBullishOB = analysis.orderBlocks
      .filter((ob) => ob.type === "bullish" && !ob.tested)
      .slice(-1)[0];
    const recentBullishFVG = analysis.fairValueGaps
      .filter((fvg) => fvg.type === "bullish" && !fvg.filled)
      .slice(-1)[0];
    const sellSideSweep = analysis.liquiditySweeps
      .filter((s) => s.type === "sell_side" && s.reversal)
      .slice(-1)[0];

    if (sellSideSweep) {
      action = "buy";
      reason = `Sell-side liquidity swept with reversal confirmation. Market structure is ${analysis.marketStructure}.`;
    } else if (recentBullishOB && recentBullishFVG) {
      action = "buy";
      reason = `Bullish order block and FVG confluence. Price expected to fill the gap.`;
    } else if (recentBullishOB) {
      action = "buy";
      reason = `Untested bullish order block in ${analysis.marketStructure} market structure.`;
    }
  } else if (analysis.bias === "short" && confidence >= 60) {
    const recentBearishOB = analysis.orderBlocks
      .filter((ob) => ob.type === "bearish" && !ob.tested)
      .slice(-1)[0];
    const recentBearishFVG = analysis.fairValueGaps
      .filter((fvg) => fvg.type === "bearish" && !fvg.filled)
      .slice(-1)[0];
    const buySideSweep = analysis.liquiditySweeps
      .filter((s) => s.type === "buy_side" && s.reversal)
      .slice(-1)[0];

    if (buySideSweep) {
      action = "sell";
      reason = `Buy-side liquidity swept with reversal confirmation. Market structure is ${analysis.marketStructure}.`;
    } else if (recentBearishOB && recentBearishFVG) {
      action = "sell";
      reason = `Bearish order block and FVG confluence. Price expected to fill the gap.`;
    } else if (recentBearishOB) {
      action = "sell";
      reason = `Untested bearish order block in ${analysis.marketStructure} market structure.`;
    }
  }

  if (action === "hold") {
    reason = `No clear SMC setup. Market structure is ${analysis.marketStructure}. Waiting for confluence.`;
    confidence = Math.min(confidence, 40);
  }

  if (isInKillZone && action !== "hold") {
    reason += ` Active during ${analysis.activeKillZone?.name} - higher probability setup.`;
  }

  return {
    action,
    reason,
    confidence: Math.round(confidence),
    killZoneBonus: isInKillZone,
  };
}

export const smcService = {
  analyzeSMC,
  generateSMCSignal,
  getActiveKillZones,
  detectFairValueGaps,
  detectOrderBlocks,
  detectLiquiditySweeps,
  determineMarketStructure,
};
