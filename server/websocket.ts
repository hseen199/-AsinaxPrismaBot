import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { Trade, Transaction } from "@shared/schema";

interface NotificationPayload {
  type: "trade" | "transaction" | "portfolio" | "market" | "alert";
  data: any;
  timestamp: string;
}

interface TradeNotification {
  type: "trade";
  data: {
    trade: Trade;
    message: {
      ar: string;
      en: string;
    };
  };
  timestamp: string;
}

interface PortfolioNotification {
  type: "portfolio";
  data: {
    totalValue: number;
    pricePerShare: number;
    dailyChangePercent: number;
    message: {
      ar: string;
      en: string;
    };
  };
  timestamp: string;
}

interface AlertNotification {
  type: "alert";
  data: {
    severity: "info" | "warning" | "success" | "error";
    title: {
      ar: string;
      en: string;
    };
    message: {
      ar: string;
      en: string;
    };
  };
  timestamp: string;
}

type Notification = TradeNotification | PortfolioNotification | AlertNotification | NotificationPayload;

class NotificationService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws, request) => {
      console.log("WebSocket client connected from:", request.socket.remoteAddress);
      this.clients.add(ws);

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        console.log("WebSocket client disconnected");
        this.clients.delete(ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(ws);
      });

      const welcomeMessage: AlertNotification = {
        type: "alert",
        data: {
          severity: "info",
          title: {
            ar: "مرحباً",
            en: "Welcome",
          },
          message: {
            ar: "تم الاتصال بنظام الإشعارات الفورية",
            en: "Connected to real-time notification system",
          },
        },
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(welcomeMessage));
    });

    console.log("WebSocket notification server initialized on /ws");
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    if (message.type === "ping") {
      ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
    }
  }

  broadcast(notification: Notification): void {
    if (!this.wss) {
      console.warn("WebSocket server not initialized");
      return;
    }

    const payload = JSON.stringify(notification);
    let successCount = 0;
    let failCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
          successCount++;
        } catch (error) {
          console.error("Failed to send to client:", error);
          failCount++;
        }
      }
    });

    console.log(`Broadcast notification: ${notification.type} to ${successCount} clients (${failCount} failed)`);
  }

  notifyNewTrade(trade: Trade): void {
    const isProfit = trade.profitLoss && parseFloat(trade.profitLoss) > 0;
    const isBuy = trade.type === "buy";

    const notification: TradeNotification = {
      type: "trade",
      data: {
        trade,
        message: {
          ar: isBuy
            ? `تم تنفيذ صفقة شراء ${trade.pair} بسعر $${parseFloat(trade.price).toFixed(2)}`
            : `تم تنفيذ صفقة بيع ${trade.pair} بسعر $${parseFloat(trade.price).toFixed(2)}${isProfit ? ` - ربح $${parseFloat(trade.profitLoss || "0").toFixed(2)}` : ""}`,
          en: isBuy
            ? `Buy order executed for ${trade.pair} at $${parseFloat(trade.price).toFixed(2)}`
            : `Sell order executed for ${trade.pair} at $${parseFloat(trade.price).toFixed(2)}${isProfit ? ` - Profit $${parseFloat(trade.profitLoss || "0").toFixed(2)}` : ""}`,
        },
      },
      timestamp: new Date().toISOString(),
    };

    this.broadcast(notification);
  }

  notifyPortfolioUpdate(totalValue: number, pricePerShare: number, dailyChangePercent: number): void {
    const isPositive = dailyChangePercent >= 0;

    const notification: PortfolioNotification = {
      type: "portfolio",
      data: {
        totalValue,
        pricePerShare,
        dailyChangePercent,
        message: {
          ar: isPositive
            ? `ارتفعت قيمة المحفظة بنسبة ${dailyChangePercent.toFixed(2)}%`
            : `انخفضت قيمة المحفظة بنسبة ${Math.abs(dailyChangePercent).toFixed(2)}%`,
          en: isPositive
            ? `Portfolio value increased by ${dailyChangePercent.toFixed(2)}%`
            : `Portfolio value decreased by ${Math.abs(dailyChangePercent).toFixed(2)}%`,
        },
      },
      timestamp: new Date().toISOString(),
    };

    this.broadcast(notification);
  }

  notifyAlert(
    severity: "info" | "warning" | "success" | "error",
    titleAr: string,
    titleEn: string,
    messageAr: string,
    messageEn: string
  ): void {
    const notification: AlertNotification = {
      type: "alert",
      data: {
        severity,
        title: { ar: titleAr, en: titleEn },
        message: { ar: messageAr, en: messageEn },
      },
      timestamp: new Date().toISOString(),
    };

    this.broadcast(notification);
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const notificationService = new NotificationService();
