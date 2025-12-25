import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bot, ShieldCheck, TrendingUp, Brain, Activity } from "lucide-react";
import type { BotSettings } from "@shared/schema";

interface BotStatusProps {
  settings: BotSettings | null;
  isLoading?: boolean;
  onToggle?: (active: boolean) => void;
}

export function BotStatus({ settings, isLoading, onToggle }: BotStatusProps) {
  const isActive = settings?.isActive ?? false;

  const strategies = [
    { key: "useRsi", label: "RSI", icon: Activity, enabled: settings?.useRsi },
    { key: "useMacd", label: "MACD", icon: TrendingUp, enabled: settings?.useMacd },
    { key: "useMovingAverages", label: "MA", icon: Activity, enabled: settings?.useMovingAverages },
    { key: "useAiSentiment", label: "AI", icon: Brain, enabled: settings?.useAiSentiment },
  ];

  return (
    <Card data-testid="card-bot-status">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">حالة البوت</CardTitle>
        </div>
        <Badge 
          variant={isActive ? "default" : "secondary"}
          className={isActive ? "bg-success text-success-foreground" : ""}
        >
          {isActive ? "نشط" : "متوقف"}
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-sm font-medium">تفعيل التداول الآلي</span>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={onToggle}
                data-testid="switch-bot-active"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {strategies.map((strategy) => {
                const StrategyIcon = strategy.icon;
                return (
                  <div
                    key={strategy.key}
                    className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                      strategy.enabled ? "bg-primary/10 text-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <StrategyIcon className="w-4 h-4" />
                    <span>{strategy.label}</span>
                    {strategy.enabled && <span className="w-1.5 h-1.5 bg-success rounded-full mr-auto" />}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>إعدادات المخاطر</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">وقف الخسارة:</span>
                  <span className="font-medium" dir="ltr">{settings?.stopLossPercent || "3"}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">جني الأرباح:</span>
                  <span className="font-medium" dir="ltr">{settings?.takeProfitPercent || "10"}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الحد الأقصى:</span>
                  <span className="font-medium" dir="ltr">${settings?.maxPositionSize || "1000"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نسبة المخاطرة:</span>
                  <span className="font-medium" dir="ltr">{settings?.maxRiskPercent || "5"}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
