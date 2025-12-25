import { storage } from "./storage";

interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown";
}

interface TradeNotification {
  pair: string;
  type: "buy" | "sell";
  amount: string;
  price: string;
  total: string;
  strategy?: string;
  profitLoss?: string;
}

interface PortfolioNotification {
  totalValue: string;
  dailyChange: string;
  dailyChangePercent: string;
}

interface SentimentNotification {
  symbol: string;
  sentiment: string;
  score: string;
  summary: string;
  confidence: string;
}

interface RlPredictionNotification {
  symbol: string;
  action: string;
  confidence: string;
  price: string;
}

interface DepositWithdrawalNotification {
  type: "deposit" | "withdrawal";
  amount: string;
  status: string;
  coin?: string;
  network?: string;
}

class TelegramService {
  private botToken: string | undefined;
  private baseUrl: string = "https://api.telegram.org";

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
  }

  private isConfigured(): boolean {
    return !!this.botToken;
  }

  private async sendMessage(message: TelegramMessage): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log("Telegram bot not configured - skipping notification");
      return false;
    }

    try {
      const url = `${this.baseUrl}/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: message.chatId,
          text: message.text,
          parse_mode: message.parseMode || "HTML",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Telegram API error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending Telegram message:", error);
      return false;
    }
  }

  async sendTradeNotification(trade: TradeNotification): Promise<void> {
    const subscribers = await storage.getUsersWithTelegramEnabled();
    const subscribersWithTrades = subscribers.filter(s => s.tradeNotifications && s.telegramChatId);

    const typeArabic = trade.type === "buy" ? "شراء" : "بيع";
    const profitText = trade.profitLoss 
      ? `\nالربح/الخسارة: ${parseFloat(trade.profitLoss) >= 0 ? "+" : ""}${trade.profitLoss} USDT`
      : "";

    const message = `
<b>صفقة جديدة - ${typeArabic}</b>

الزوج: ${trade.pair}
الكمية: ${trade.amount}
السعر: ${trade.price}
الإجمالي: ${trade.total} USDT
${trade.strategy ? `الاستراتيجية: ${trade.strategy}` : ""}${profitText}

MexAI Trader
    `.trim();

    for (const subscriber of subscribersWithTrades) {
      if (subscriber.telegramChatId) {
        await this.sendMessage({
          chatId: subscriber.telegramChatId,
          text: message,
        });
      }
    }
  }

  async sendPortfolioUpdate(portfolio: PortfolioNotification): Promise<void> {
    const subscribers = await storage.getUsersWithTelegramEnabled();
    
    const changeSign = parseFloat(portfolio.dailyChange) >= 0 ? "+" : "";

    const message = `
<b>تحديث المحفظة</b>

القيمة الإجمالية: ${portfolio.totalValue} USDT
التغير اليومي: ${changeSign}${portfolio.dailyChange} USDT (${changeSign}${portfolio.dailyChangePercent}%)

MexAI Trader
    `.trim();

    for (const subscriber of subscribers) {
      if (subscriber.telegramChatId) {
        await this.sendMessage({
          chatId: subscriber.telegramChatId,
          text: message,
        });
      }
    }
  }

  async sendAiSignal(sentiment: SentimentNotification): Promise<void> {
    const subscribers = await storage.getUsersWithTelegramEnabled();
    const subscribersWithAiSignals = subscribers.filter(s => s.aiSignalNotifications && s.telegramChatId);

    const sentimentArabic = sentiment.sentiment === "bullish" ? "صاعد" : 
                           sentiment.sentiment === "bearish" ? "هابط" : "محايد";

    const message = `
<b>تحليل الذكاء الاصطناعي</b>

الرمز: ${sentiment.symbol}
الاتجاه: ${sentimentArabic}
الدرجة: ${sentiment.score}/100
الثقة: ${sentiment.confidence}%

الملخص: ${sentiment.summary}

MexAI Trader
    `.trim();

    for (const subscriber of subscribersWithAiSignals) {
      if (subscriber.telegramChatId) {
        await this.sendMessage({
          chatId: subscriber.telegramChatId,
          text: message,
        });
      }
    }
  }

  async sendRlPrediction(prediction: RlPredictionNotification): Promise<void> {
    const subscribers = await storage.getUsersWithTelegramEnabled();
    const subscribersWithAiSignals = subscribers.filter(s => s.aiSignalNotifications && s.telegramChatId);

    const actionArabic = prediction.action === "buy" ? "شراء" : 
                        prediction.action === "sell" ? "بيع" : "انتظار";

    const message = `
<b>توقع وكيل التعلم الآلي</b>

الرمز: ${prediction.symbol}
الإجراء: ${actionArabic}
الثقة: ${(parseFloat(prediction.confidence) * 100).toFixed(1)}%
السعر الحالي: ${prediction.price}

MexAI Trader
    `.trim();

    for (const subscriber of subscribersWithAiSignals) {
      if (subscriber.telegramChatId) {
        await this.sendMessage({
          chatId: subscriber.telegramChatId,
          text: message,
        });
      }
    }
  }

  async sendDepositWithdrawalNotification(userId: string, notification: DepositWithdrawalNotification): Promise<void> {
    const settings = await storage.getNotificationSettings(userId);
    if (!settings?.telegramEnabled || !settings?.telegramChatId) {
      return;
    }

    const isDeposit = notification.type === "deposit";
    if ((isDeposit && !settings.depositNotifications) || (!isDeposit && !settings.withdrawalNotifications)) {
      return;
    }

    const typeArabic = isDeposit ? "إيداع" : "سحب";
    const statusArabic = notification.status === "confirmed" ? "مؤكد" : 
                        notification.status === "pending" ? "قيد الانتظار" : "فشل";

    const message = `
<b>${typeArabic}</b>

المبلغ: ${notification.amount} ${notification.coin || "USDT"}
الحالة: ${statusArabic}
${notification.network ? `الشبكة: ${notification.network}` : ""}

MexAI Trader
    `.trim();

    await this.sendMessage({
      chatId: settings.telegramChatId,
      text: message,
    });
  }

  async sendTestNotification(chatId: string): Promise<boolean> {
    const message = `
<b>اختبار الإشعارات</b>

تم إعداد إشعارات Telegram بنجاح!
ستتلقى الآن تنبيهات فورية حول:
- الصفقات الجديدة
- تحديثات المحفظة
- إشارات الذكاء الاصطناعي
- الإيداعات والسحوبات

MexAI Trader
    `.trim();

    return await this.sendMessage({
      chatId,
      text: message,
    });
  }

  getBotUsername(): string | null {
    return this.isConfigured() ? "MexAITraderBot" : null;
  }

  isEnabled(): boolean {
    return this.isConfigured();
  }
}

export const telegramService = new TelegramService();
