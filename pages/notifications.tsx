import { useState } from "react";
import { Bell, BellRing, Wifi, WifiOff, TrendingUp, AlertCircle, RefreshCcw, Check, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/i18n";
import { useNotifications } from "@/hooks/use-notifications";

interface NotificationItemProps {
  notification: any;
  language: "ar" | "en";
}

function NotificationItem({ notification, language }: NotificationItemProps) {
  const getMessage = (text: { ar: string; en: string }) => language === "ar" ? text.ar : text.en;
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return language === "ar" ? "الآن" : "Just now";
    if (minutes < 60) return language === "ar" ? `${minutes} دقيقة` : `${minutes}m ago`;
    if (hours < 24) return language === "ar" ? `${hours} ساعة` : `${hours}h ago`;
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US");
  };

  const getIcon = () => {
    if (notification.type === "trade") {
      return <TrendingUp className="w-5 h-5 text-primary" />;
    }
    if (notification.type === "portfolio") {
      return <RefreshCcw className="w-5 h-5 text-blue-500" />;
    }
    if (notification.type === "alert") {
      const severity = notification.data.severity;
      if (severity === "success") return <Check className="w-5 h-5 text-green-500" />;
      if (severity === "warning") return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      if (severity === "error") return <AlertCircle className="w-5 h-5 text-red-500" />;
      return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
    return <Bell className="w-5 h-5 text-muted-foreground" />;
  };

  const getTitle = () => {
    if (notification.type === "trade") {
      return language === "ar" ? "صفقة جديدة" : "New Trade";
    }
    if (notification.type === "portfolio") {
      return language === "ar" ? "تحديث المحفظة" : "Portfolio Update";
    }
    if (notification.type === "alert" && notification.data.title) {
      return getMessage(notification.data.title);
    }
    return language === "ar" ? "إشعار" : "Notification";
  };

  const getDescription = () => {
    if (notification.data.message) {
      return getMessage(notification.data.message);
    }
    return "";
  };

  return (
    <div className="flex items-start gap-4 p-4 hover-elevate rounded-md transition-colors" data-testid={`notification-item-${notification.timestamp}`}>
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm">{getTitle()}</p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(notification.timestamp)}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{getDescription()}</p>
      </div>
    </div>
  );
}

export default function Notifications() {
  const { t, language } = useLanguage();
  const { notifications, connected, unreadCount, markAllAsRead, clearNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState("all");

  const groupNotificationsByDate = (notifs: any[]) => {
    const today: any[] = [];
    const yesterday: any[] = [];
    const earlier: any[] = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    notifs.forEach((n) => {
      const date = new Date(n.timestamp);
      if (date >= todayStart) {
        today.push(n);
      } else if (date >= yesterdayStart) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });

    return { today, yesterday, earlier };
  };

  const grouped = groupNotificationsByDate(notifications);

  const renderNotificationGroup = (title: string, items: any[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2 px-4">{title}</h3>
        <div className="space-y-1">
          {items.map((notification, index) => (
            <NotificationItem
              key={`${notification.timestamp}-${index}`}
              notification={notification}
              language={language}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <BellRing className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-notifications-title">{t.notifications.title}</h1>
            <p className="text-muted-foreground text-sm">{t.notifications.realTimeUpdatesDesc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? "default" : "secondary"} className="gap-1">
            {connected ? (
              <>
                <Wifi className="w-3 h-3" />
                {t.notifications.connected}
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                {t.notifications.disconnected}
              </>
            )}
          </Badge>
          {unreadCount > 0 && (
            <Badge variant="destructive" data-testid="badge-unread-count">{unreadCount}</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg">{t.notifications.allNotifications}</CardTitle>
            <CardDescription>{t.notifications.realTimeUpdates}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              data-testid="button-mark-all-read"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">{t.notifications.markAllRead}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearNotifications}
              disabled={notifications.length === 0}
              data-testid="button-clear-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.notifications.clearAll}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-4">
              <TabsList className="bg-transparent h-auto p-0">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
                  data-testid="tab-all-notifications"
                >
                  {t.notifications.allNotifications}
                </TabsTrigger>
                <TabsTrigger
                  value="trades"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
                  data-testid="tab-trade-notifications"
                >
                  {t.notifications.newTrade}
                </TabsTrigger>
                <TabsTrigger
                  value="alerts"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
                  data-testid="tab-alert-notifications"
                >
                  {t.notifications.alert}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <ScrollArea className="h-[500px]">
              <TabsContent value="all" className="m-0 pt-4">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="font-medium text-muted-foreground">{t.notifications.noNotifications}</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">{t.notifications.noNotificationsDesc}</p>
                  </div>
                ) : (
                  <>
                    {renderNotificationGroup(t.notifications.today, grouped.today)}
                    {renderNotificationGroup(t.notifications.yesterday, grouped.yesterday)}
                    {renderNotificationGroup(t.notifications.earlier, grouped.earlier)}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="trades" className="m-0 pt-4">
                {notifications.filter(n => n.type === "trade").length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <TrendingUp className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="font-medium text-muted-foreground">{t.notifications.noNotifications}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.filter(n => n.type === "trade").map((notification, index) => (
                      <NotificationItem
                        key={`${notification.timestamp}-${index}`}
                        notification={notification}
                        language={language}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="alerts" className="m-0 pt-4">
                {notifications.filter(n => n.type === "alert").length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="font-medium text-muted-foreground">{t.notifications.noNotifications}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.filter(n => n.type === "alert").map((notification, index) => (
                      <NotificationItem
                        key={`${notification.timestamp}-${index}`}
                        notification={notification}
                        language={language}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
