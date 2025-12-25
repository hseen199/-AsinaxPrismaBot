import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Calendar,
  PieChart,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { PerformanceComparison } from "@/components/performance-comparison";
import type { PortfolioHistory, Trade } from "@shared/schema";

export default function Stats() {
  const { t, language } = useLanguage();
  const dateLocale = language === "ar" ? "ar-SA" : "en-US";

  const { data: portfolioHistory = [], isLoading: loadingHistory } = useQuery<PortfolioHistory[]>({
    queryKey: ["/api/portfolio/history"],
  });

  const { data: trades = [], isLoading: loadingTrades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const totalTrades = trades.length;
  const profitableTrades = trades.filter(t => t.profitLoss && parseFloat(t.profitLoss) > 0).length;
  const losingTrades = trades.filter(t => t.profitLoss && parseFloat(t.profitLoss) < 0).length;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

  const totalProfit = trades.reduce((sum, t) => {
    const pl = t.profitLoss ? parseFloat(t.profitLoss) : 0;
    return pl > 0 ? sum + pl : sum;
  }, 0);

  const totalLoss = trades.reduce((sum, t) => {
    const pl = t.profitLoss ? parseFloat(t.profitLoss) : 0;
    return pl < 0 ? sum + Math.abs(pl) : sum;
  }, 0);

  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

  const avgProfit = profitableTrades > 0 ? totalProfit / profitableTrades : 0;
  const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;

  const portfolioChartData = portfolioHistory.slice().reverse().map((item) => ({
    date: new Date(item.recordedAt!).toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
    }),
    value: parseFloat(item.totalValue),
    change: parseFloat(item.dailyChangePercent || "0"),
  }));

  const tradesByDay = trades.reduce((acc, trade) => {
    if (!trade.createdAt) return acc;
    const date = new Date(trade.createdAt).toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
    });
    if (!acc[date]) {
      acc[date] = { date, profit: 0, loss: 0, count: 0 };
    }
    const pl = trade.profitLoss ? parseFloat(trade.profitLoss) : 0;
    if (pl > 0) {
      acc[date].profit += pl;
    } else {
      acc[date].loss += Math.abs(pl);
    }
    acc[date].count += 1;
    return acc;
  }, {} as Record<string, { date: string; profit: number; loss: number; count: number }>);

  const dailyPnLData = Object.values(tradesByDay).slice(-14);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-popover-border rounded-md p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
              {p.name}: {typeof p.value === "number" ? formatCurrency(p.value) : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">{t.stats.title}</h1>
          <p className="text-muted-foreground text-sm">{t.stats.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-win-rate">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.stats.winRate}</p>
                <p className="text-2xl font-bold" dir="ltr">{winRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-profit-factor">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-success/10">
                <PieChart className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.stats.profitFactor}</p>
                <p className="text-2xl font-bold text-success" dir="ltr">
                  {profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-profit">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.stats.averageProfit}</p>
                <p className="text-2xl font-bold text-success" dir="ltr">{formatCurrency(avgProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-loss">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-destructive/10">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.stats.averageLoss}</p>
                <p className="text-2xl font-bold text-destructive" dir="ltr">{formatCurrency(avgLoss)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-portfolio-growth">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{t.stats.portfolioGrowth}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingHistory ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                {t.common.loading}
              </div>
            ) : portfolioChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                {t.common.noData}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    name={t.stats.value}
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorGrowth)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-daily-pnl">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{t.stats.dailyPnl}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingTrades ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                {t.common.loading}
              </div>
            ) : dailyPnLData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                {t.common.noData}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyPnLData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar name={t.stats.profits} dataKey="profit" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar name={t.stats.losses} dataKey="loss" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card data-testid="card-trade-summary">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t.stats.tradeSummary}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.stats.totalTrades}</span>
                <span className="font-bold">{totalTrades}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.stats.profitableTrades}</span>
                <span className="font-bold text-success">{profitableTrades}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.stats.losingTrades}</span>
                <span className="font-bold text-destructive">{losingTrades}</span>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.stats.totalProfits}</span>
                  <span className="font-bold text-success" dir="ltr">+{formatCurrency(totalProfit)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.stats.totalLosses}</span>
                <span className="font-bold text-destructive" dir="ltr">-{formatCurrency(totalLoss)}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="font-medium">{t.stats.netProfit}</span>
                <span className={cn(
                  "font-bold text-lg",
                  totalProfit - totalLoss >= 0 ? "text-success" : "text-destructive"
                )} dir="ltr">
                  {totalProfit - totalLoss >= 0 && "+"}{formatCurrency(totalProfit - totalLoss)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-testid="card-monthly-performance">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{t.stats.monthlyPerformance}</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t.stats.notEnoughData}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }, (_, i) => {
                  const month = new Date();
                  month.setMonth(month.getMonth() - (5 - i));
                  const monthName = month.toLocaleDateString(dateLocale, { month: "short" });
                  const monthData = portfolioHistory.filter(p => {
                    const d = new Date(p.recordedAt!);
                    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
                  });
                  const change = monthData.length > 0 
                    ? monthData.reduce((sum, p) => sum + parseFloat(p.dailyChangePercent || "0"), 0)
                    : 0;
                  const isPositive = change > 0;
                  
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-3 rounded-md text-center",
                        isPositive ? "bg-success/10" : change < 0 ? "bg-destructive/10" : "bg-muted"
                      )}
                    >
                      <p className="text-xs text-muted-foreground mb-1">{monthName}</p>
                      <p className={cn(
                        "font-bold",
                        isPositive ? "text-success" : change < 0 ? "text-destructive" : "text-foreground"
                      )} dir="ltr">
                        {isPositive && "+"}{change.toFixed(1)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PerformanceComparison />
    </div>
  );
}
