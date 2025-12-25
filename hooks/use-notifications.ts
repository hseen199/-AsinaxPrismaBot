import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";

interface BilingualText {
  ar: string;
  en: string;
}

interface TradeNotification {
  type: "trade";
  data: {
    trade: any;
    message: BilingualText;
  };
  timestamp: string;
}

interface PortfolioNotification {
  type: "portfolio";
  data: {
    totalValue: number;
    pricePerShare: number;
    dailyChangePercent: number;
    message: BilingualText;
  };
  timestamp: string;
}

interface AlertNotification {
  type: "alert";
  data: {
    severity: "info" | "warning" | "success" | "error";
    title: BilingualText;
    message: BilingualText;
  };
  timestamp: string;
}

type Notification = TradeNotification | PortfolioNotification | AlertNotification;

interface NotificationState {
  connected: boolean;
  notifications: Notification[];
  unreadCount: number;
}

export function useNotifications() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [state, setState] = useState<NotificationState>({
    connected: false,
    notifications: [],
    unreadCount: 0,
  });

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setState(prev => ({ ...prev, connected: true }));
      };

      ws.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          handleNotification(notification);
        } catch (error) {
          console.error("Failed to parse notification:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setState(prev => ({ ...prev, connected: false }));
        scheduleReconnect();
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      scheduleReconnect();
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log("Attempting WebSocket reconnect...");
      connect();
    }, 5000);
  }, [connect]);

  const handleNotification = useCallback((notification: Notification) => {
    setState(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications].slice(0, 100),
      unreadCount: prev.unreadCount + 1,
    }));

    const getMessage = (text: BilingualText) => language === "ar" ? text.ar : text.en;

    if (notification.type === "trade") {
      toast({
        title: language === "ar" ? "صفقة جديدة" : "New Trade",
        description: getMessage(notification.data.message),
      });
    } else if (notification.type === "alert" && notification.data.severity !== "info") {
      toast({
        title: getMessage(notification.data.title),
        description: getMessage(notification.data.message),
        variant: notification.data.severity === "error" ? "destructive" : "default",
      });
    }
  }, [language, toast]);

  const markAllAsRead = useCallback(() => {
    setState(prev => ({ ...prev, unreadCount: 0 }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [], unreadCount: 0 }));
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connected: state.connected,
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    markAllAsRead,
    clearNotifications,
  };
}
