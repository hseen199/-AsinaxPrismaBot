import OpenAI from "openai";
import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface SentimentResult {
  sentiment: "bullish" | "bearish" | "neutral";
  score: number;
  summary: string;
  confidence: number;
}

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

export async function analyzeSentiment(symbol: string, newsContext?: string): Promise<SentimentResult> {
  const limit = pLimit(2);
  
  return limit(() =>
    pRetry(
      async () => {
        const prompt = `Analyze the current market sentiment for ${symbol} cryptocurrency.
${newsContext ? `Recent news context: ${newsContext}` : ""}

Provide a detailed sentiment analysis with the following JSON structure:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "score": <number from -100 to 100, where -100 is extremely bearish and 100 is extremely bullish>,
  "summary": "<brief 2-3 sentence summary of the sentiment analysis>",
  "confidence": <number from 0 to 100 indicating confidence level>
}

Consider factors like:
- Recent price action trends
- Market momentum indicators
- General crypto market conditions
- Any relevant news or events

Respond ONLY with valid JSON, no additional text.`;

        const response = await openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 1024,
          response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content || "{}";
        const result = JSON.parse(content);
        
        return {
          sentiment: result.sentiment || "neutral",
          score: Number(result.score) || 0,
          summary: result.summary || "Unable to determine sentiment",
          confidence: Number(result.confidence) || 50
        };
      },
      {
        retries: 3,
        minTimeout: 2000,
        maxTimeout: 16000,
        factor: 2,
        onFailedAttempt: (ctx) => {
          if (!isRateLimitError(ctx.error)) {
            throw new AbortError(ctx.error?.message || "Non-retriable error");
          }
        }
      }
    )
  );
}

export async function analyzeTradeSignal(
  symbol: string,
  priceData: { price: number; change24h: number },
  technicalIndicators?: { rsi?: number; macd?: string; sma?: number }
): Promise<{ action: "buy" | "sell" | "hold"; reason: string; confidence: number }> {
  const limit = pLimit(2);
  
  return limit(() =>
    pRetry(
      async () => {
        const prompt = `Analyze ${symbol} for a trading signal.

Current data:
- Price: $${priceData.price}
- 24h Change: ${priceData.change24h}%
${technicalIndicators ? `
Technical Indicators:
- RSI: ${technicalIndicators.rsi ?? "N/A"}
- MACD: ${technicalIndicators.macd ?? "N/A"}
- SMA: ${technicalIndicators.sma ?? "N/A"}
` : ""}

Provide a trading recommendation in JSON format:
{
  "action": "buy" | "sell" | "hold",
  "reason": "<brief explanation for the recommendation>",
  "confidence": <number from 0 to 100>
}

Respond ONLY with valid JSON, no additional text.`;

        const response = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [{ role: "user", content: prompt }],
          max_completion_tokens: 512,
          response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content || "{}";
        const result = JSON.parse(content);
        
        return {
          action: result.action || "hold",
          reason: result.reason || "Unable to determine signal",
          confidence: Number(result.confidence) || 50
        };
      },
      {
        retries: 3,
        minTimeout: 2000,
        maxTimeout: 16000,
        factor: 2,
        onFailedAttempt: (ctx) => {
          if (!isRateLimitError(ctx.error)) {
            throw new AbortError(ctx.error?.message || "Non-retriable error");
          }
        }
      }
    )
  );
}
