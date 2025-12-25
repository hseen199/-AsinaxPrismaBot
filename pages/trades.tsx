import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradesTable } from "@/components/trades-table";
import { TrendingUp, TrendingDown, Activity, Target, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { Trade } from "@shared/schema";

export default function Trades() {
  const { t } = useLanguage();
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const totalTrades = trades.length;
  const buyTrades = trades.filter(t => t.type === "buy").length;
  const sellTrades = trades.filter(t => t.type === "sell").length;
  
  const totalProfit = trades.reduce((sum, t) => {
    return sum + (t.profitLoss ? parseFloat(t.profitLoss) : 0);
  }, 0);

  const profitableTrades = trades.filter(t => t.profitLoss && parseFloat(t.profitLoss) > 0).length;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

  const strategyCounts = trades.reduce((acc, t) => {
    const strategy = t.strategy || "MANUAL";
    acc[strategy] = (acc[strategy] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const strategyLabels: Record<string, string> = {
    RSI: t.trades.strategyRsi,
    MACD: t.trades.strategyMacd,
    AI_SENTIMENT: t.trades.strategyAiSentiment,
    MOVING_AVERAGES: t.trades.strategyMovingAverages,
    MANUAL: t.trades.strategyManual,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">{t.trades.title}</h1>
          <p className="text-muted-foreground text-sm">{t.trades.subtitle}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Clock className="w-3 h-3 ml-1" />
          {t.trades.lastUpdate}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card data-testid="card-total-trades">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.trades.totalTrades}</p>
                <p className="text-lg font-bold">{totalTrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-buy-trades">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-success/10">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.trades.buyOperations}</p>
                <p className="text-lg font-bold">{buyTrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-sell-trades">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-destructive/10">
                <TrendingDown className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.trades.sellOperations}</p>
                <p className="text-lg font-bold">{sellTrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-profit">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-md",
                totalProfit >= 0 ? "bg-success/10" : "bg-destructive/10"
              )}>
                {totalProfit >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.trades.totalProfit}</p>
                <p className={cn(
                  "text-lg font-bold",
                  totalProfit >= 0 ? "text-success" : "text-destructive"
                )} dir="ltr">
                  {totalProfit >= 0 && "+"}{formatCurrency(totalProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-win-rate">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.trades.successRate}</p>
                <p className="text-lg font-bold" dir="ltr">{winRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <TradesTable trades={trades} isLoading={isLoading} showAll />
        </div>

        <div className="space-y-6">
          <Card data-testid="card-strategies">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{t.trades.strategiesUsed}</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(strategyCounts).length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  {t.common.noData}
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(strategyCounts).map(([strategy, count]) => {
                    const percentage = (count / totalTrades) * 100;
                    return (
                      <div key={strategy}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{strategyLabels[strategy] || strategy}</span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-pairs">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{t.trades.tradingPairs}</CardTitle>
            </CardHeader>
            <CardContent>
              {trades.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  {t.common.noData}
                </p>
              ) : (
                <div className="space-y-2">
                  {Array.from(new Set(trades.map(t => t.pair))).map(pair => {
                    const pairTrades = trades.filter(t => t.pair === pair);
                    const pairProfit = pairTrades.reduce((sum, t) => 
                      sum + (t.profitLoss ? parseFloat(t.profitLoss) : 0), 0);
                    
                    return (
                      <div 
                        key={pair} 
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                      >
                        <span className="font-medium text-sm" dir="ltr">{pair}</span>
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">{pairTrades.length} {t.trades.tradeCount}</p>
                          <p className={cn(
                            "text-sm font-medium",
                            pairProfit >= 0 ? "text-success" : "text-destructive"
                          )} dir="ltr">
                            {pairProfit >= 0 && "+"}{formatCurrency(pairProfit)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
