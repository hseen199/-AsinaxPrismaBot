import crypto from "crypto";

const MEXC_BASE_URL = "https://api.mexc.com";
const API_KEY = process.env.MEXC_API_KEY || "";
const API_SECRET = process.env.MEXC_API_SECRET || "";

interface MexcDepositAddress {
  coin: string;
  network: string;
  address: string;
  memo: string | null;
}

interface MexcWithdrawResult {
  id: string;
}

interface MexcDepositRecord {
  id: string;
  amount: string;
  coin: string;
  network: string;
  status: number;
  address: string;
  txId: string;
  insertTime: number;
  confirmTimes: string;
}

interface MexcWithdrawRecord {
  id: string;
  amount: string;
  coin: string;
  network: string;
  status: string;
  address: string;
  txId: string;
  applyTime: number;
  confirmNo: number;
  transactionFee: string;
}

interface MexcAccountBalance {
  asset: string;
  free: string;
  locked: string;
}

interface MexcTrade {
  symbol: string;
  id: number;
  orderId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
}

interface MexcOrder {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

interface MexcCoinInfo {
  coin: string;
  name: string;
  networkList: {
    network: string;
    isDefault: boolean;
    depositEnable: boolean;
    withdrawEnable: boolean;
    withdrawFee: string;
    withdrawMin: string;
    withdrawMax: string;
    minConfirm: number;
    depositDesc?: string;
    withdrawDesc?: string;
    depositTips?: string;
    withdrawTips?: string;
  }[];
}

interface MexcTickerPrice {
  symbol: string;
  price: string;
}

interface MexcTicker24h {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
}

export interface MexcKline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteVolume: number;
  trades: number;
}

type KlineInterval = "1m" | "5m" | "15m" | "30m" | "60m" | "4h" | "1d" | "1w";

function generateSignature(queryString: string): string {
  return crypto
    .createHmac("sha256", API_SECRET)
    .update(queryString)
    .digest("hex");
}

function sortParams(params: Record<string, string | number>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");
  return sorted;
}

async function makeSignedRequest<T>(
  method: "GET" | "POST" | "DELETE",
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const timestamp = Date.now();
  const allParams = { ...params, timestamp, recvWindow: 60000 };
  const queryString = sortParams(allParams);
  const signature = generateSignature(queryString);
  const finalQueryString = `${queryString}&signature=${signature}`;

  const url = `${MEXC_BASE_URL}${endpoint}?${finalQueryString}`;

  const response = await fetch(url, {
    method,
    headers: {
      "X-MEXC-APIKEY": API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`MEXC API Error: ${response.status} - ${errorText}`);
    throw new Error(`MEXC API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function makePublicRequest<T>(endpoint: string): Promise<T> {
  const url = `${MEXC_BASE_URL}${endpoint}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MEXC API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export const mexcService = {
  async getDepositAddress(
    coin: string,
    network: string
  ): Promise<MexcDepositAddress[]> {
    return makeSignedRequest<MexcDepositAddress[]>(
      "POST",
      "/api/v3/capital/deposit/address",
      { coin: coin.toUpperCase(), network: network.toUpperCase() }
    );
  },

  async getDepositHistory(
    coin?: string,
    status?: number,
    startTime?: number,
    endTime?: number,
    limit: number = 100
  ): Promise<MexcDepositRecord[]> {
    const params: Record<string, string | number> = { limit };
    if (coin) params.coin = coin.toUpperCase();
    if (status !== undefined) params.status = status;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    return makeSignedRequest<MexcDepositRecord[]>(
      "GET",
      "/api/v3/capital/deposit/hisrec",
      params
    );
  },

  async withdraw(
    coin: string,
    address: string,
    amount: string,
    network: string,
    memo?: string
  ): Promise<MexcWithdrawResult> {
    const params: Record<string, string | number> = {
      coin: coin.toUpperCase(),
      address,
      amount,
      network: network.toUpperCase(),
    };
    if (memo) params.withdrawOrderId = memo;

    return makeSignedRequest<MexcWithdrawResult>(
      "POST",
      "/api/v3/capital/withdraw/apply",
      params
    );
  },

  async getWithdrawHistory(
    coin?: string,
    status?: string,
    startTime?: number,
    endTime?: number,
    limit: number = 100
  ): Promise<MexcWithdrawRecord[]> {
    const params: Record<string, string | number> = { limit };
    if (coin) params.coin = coin.toUpperCase();
    if (status) params.status = status;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    return makeSignedRequest<MexcWithdrawRecord[]>(
      "GET",
      "/api/v3/capital/withdraw/history",
      params
    );
  },

  async getAccountBalance(): Promise<MexcAccountBalance[]> {
    const result = await makeSignedRequest<{ balances: MexcAccountBalance[] }>(
      "GET",
      "/api/v3/account"
    );
    return result.balances.filter(
      (b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    );
  },

  async getCoinInfo(): Promise<MexcCoinInfo[]> {
    return makeSignedRequest<MexcCoinInfo[]>(
      "GET",
      "/api/v3/capital/config/getall"
    );
  },

  async getNetworksForCoin(coin: string): Promise<MexcCoinInfo | undefined> {
    const coins = await this.getCoinInfo();
    return coins.find((c) => c.coin.toUpperCase() === coin.toUpperCase());
  },

  async getTickerPrice(symbol?: string): Promise<MexcTickerPrice[]> {
    const endpoint = symbol
      ? `/api/v3/ticker/price?symbol=${symbol}`
      : "/api/v3/ticker/price";
    return makePublicRequest<MexcTickerPrice[]>(endpoint);
  },

  async getTicker24h(symbol?: string): Promise<MexcTicker24h[]> {
    const endpoint = symbol
      ? `/api/v3/ticker/24hr?symbol=${symbol}`
      : "/api/v3/ticker/24hr";
    const result = await makePublicRequest<MexcTicker24h | MexcTicker24h[]>(
      endpoint
    );
    return Array.isArray(result) ? result : [result];
  },

  async getKlines(
    symbol: string,
    interval: KlineInterval = "15m",
    limit: number = 100
  ): Promise<MexcKline[]> {
    const formattedSymbol = symbol.replace("/", "").toUpperCase();
    const endpoint = `/api/v3/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`;
    
    const rawData = await makePublicRequest<(string | number)[][]>(endpoint);
    
    return rawData.map((kline) => ({
      openTime: Number(kline[0]),
      open: parseFloat(String(kline[1])),
      high: parseFloat(String(kline[2])),
      low: parseFloat(String(kline[3])),
      close: parseFloat(String(kline[4])),
      volume: parseFloat(String(kline[5])),
      closeTime: Number(kline[6]),
      quoteVolume: parseFloat(String(kline[7])),
      trades: Number(kline[8]),
    }));
  },

  async testConnection(): Promise<boolean> {
    try {
      const balance = await this.getAccountBalance();
      console.log("MEXC API connection successful");
      console.log(
        `Found ${balance.length} assets with balance`
      );
      return true;
    } catch (error) {
      console.error("MEXC API connection failed:", error);
      return false;
    }
  },

  async getMyTrades(
    symbol: string,
    startTime?: number,
    endTime?: number,
    limit: number = 100
  ): Promise<MexcTrade[]> {
    const params: Record<string, string | number> = { 
      symbol: symbol.replace("/", "").toUpperCase(),
      limit 
    };
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    return makeSignedRequest<MexcTrade[]>(
      "GET",
      "/api/v3/myTrades",
      params
    );
  },

  async getAllTrades(limit: number = 100): Promise<MexcTrade[]> {
    const tradingPairs = [
      "BTCUSDT",
      "ETHUSDT",
      "SOLUSDT",
      "XRPUSDT",
      "BNBUSDT",
      "ADAUSDT",
      "DOGEUSDT",
      "AVAXUSDT",
    ];

    const allTrades: MexcTrade[] = [];
    
    for (const pair of tradingPairs) {
      try {
        const trades = await this.getMyTrades(pair, undefined, undefined, limit);
        allTrades.push(...trades);
      } catch (error) {
        console.log(`No trades found for ${pair} or error fetching`);
      }
    }

    // Sort by time descending
    return allTrades.sort((a, b) => b.time - a.time);
  },

  async getOpenOrders(symbol?: string): Promise<MexcOrder[]> {
    const params: Record<string, string | number> = {};
    if (symbol) {
      params.symbol = symbol.replace("/", "").toUpperCase();
    }

    return makeSignedRequest<MexcOrder[]>(
      "GET",
      "/api/v3/openOrders",
      params
    );
  },

  async getAllOrders(
    symbol: string,
    startTime?: number,
    endTime?: number,
    limit: number = 100
  ): Promise<MexcOrder[]> {
    const params: Record<string, string | number> = { 
      symbol: symbol.replace("/", "").toUpperCase(),
      limit 
    };
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    return makeSignedRequest<MexcOrder[]>(
      "GET",
      "/api/v3/allOrders",
      params
    );
  },

  async syncMarketData(): Promise<
    { symbol: string; price: string; data: MexcTicker24h }[]
  > {
    const tradingPairs = [
      "BTCUSDT",
      "ETHUSDT",
      "SOLUSDT",
      "XRPUSDT",
      "BNBUSDT",
      "ADAUSDT",
      "DOGEUSDT",
      "AVAXUSDT",
    ];

    const results: { symbol: string; price: string; data: MexcTicker24h }[] =
      [];

    for (const pair of tradingPairs) {
      try {
        const tickers = await this.getTicker24h(pair);
        if (tickers.length > 0) {
          const ticker = tickers[0];
          results.push({
            symbol: pair.replace("USDT", "/USDT"),
            price: ticker.lastPrice,
            data: ticker,
          });
        }
      } catch (error) {
        console.error(`Failed to get ticker for ${pair}:`, error);
      }
    }

    return results;
  },
};

export type {
  MexcDepositAddress,
  MexcWithdrawResult,
  MexcDepositRecord,
  MexcWithdrawRecord,
  MexcAccountBalance,
  MexcCoinInfo,
  MexcTickerPrice,
  MexcTicker24h,
  MexcTrade,
  MexcOrder,
  KlineInterval,
};
