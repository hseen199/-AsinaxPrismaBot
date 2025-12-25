import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Bitcoin, BarChart3 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import type { PortfolioHistory, MarketData } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export function PerformanceComparison() {
  const { t, language } = useLanguage();
  const dateLocale = language === "ar" ? "ar-SA" : "en-US";

  const { data: portfolioHistory = [], isLoading: loadingHistory } = useQuery<PortfolioHistory[]>({
    queryKey: ["/api/portfolio/history"],
  });

  const { data: marketData = [], isLoading: loadingMarket } = useQuery<MarketData[]>({
    queryKey: ["/api/market"],
  });

  const btcData = marketData.find(m => m.symbol === "BTCUSDT");
  const btcChange24h = btcData ? parseFloat(btcData.change24h || "0") : 0;
  
  const ethData = marketData.find(m => m.symbol === "ETHUSDT");
  const bnbData = marketData.find(m => m.symbol === "BNBUSDT");
  const solData = marketData.find(m => m.symbol === "SOLUSDT");
  
  const marketChanges = [
    btcChange24h,
    ethData ? parseFloat(ethData.change24h || "0") : 0,
    bnbData ? parseFloat(bnbData.change24h || "0") : 0,
    solData ? parseFloat(solData.change24h || "0") : 0,
  ].filter(c => c !== 0);
  
  const avgMarketChange = marketChanges.length > 0 
    ? marketChanges.reduce((a, b) => a + b, 0) / marketChanges.length 
    : 0;

  const portfolioChartData = useMemo(() => {
    if (portfolioHistory.length === 0) return [];

    const sortedHistory = [...portfolioHistory].sort((a, b) => 
      new Date(a.recordedAt!).getTime() - new Date(b.recordedAt!).getTime()
    );

    const firstValue = parseFloat(sortedHistory[0]?.totalValue || "100");

    return sortedHistory.map((item) => {
      const currentValue = parseFloat(item.totalValue);
      const portfolioChange = ((currentValue - firstValue) / firstValue) * 100;

      return {
        date: new Date(item.recordedAt!).toLocaleDateString(dateLocale, {
          month: "short",
          day: "numeric",
        }),
        portfolio: Math.round(portfolioChange * 100) / 100,
        value: currentValue,
      };
    });
  }, [portfolioHistory, dateLocale]);

  const latestPortfolioChange = portfolioChartData.length > 0 
    ? portfolioChartData[portfolioChartData.length - 1].portfolio 
    : 0;

  const labels = language === "ar" ? {
    title: "مقارنة الأداء",
    description: "أداء المحفظة مقارنة بسوق العملات الرقمية (24 ساعة)",
    portfolioTotal: "إجمالي المحفظة",
    btc24h: "بيتكوين (24س)",
    market24h: "السوق (24س)",
    portfolioHistory: "تطور المحفظة",
    outperforming: "متفوق على السوق",
    underperforming: "أقل من السوق",
    noData: "لا توجد بيانات كافية للمقارنة",
    change: "التغيير",
  } : {
    title: "Performance Comparison",
    description: "Portfolio performance vs crypto market (24h)",
    portfolioTotal: "Total Portfolio",
    btc24h: "Bitcoin (24h)",
    market24h: "Market (24h)",
    portfolioHistory: "Portfolio History",
    outperforming: "Outperforming market",
    underperforming: "Underperforming market",
    noData: "Not enough data for comparison",
    change: "Change",
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-popover-border rounded-md p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{labels.change}:</span>
            <span 
              className="font-medium"
              style={{ color: payload[0].value >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))" }}
            >
              {payload[0].value >= 0 ? "+" : ""}{payload[0].value.toFixed(2)}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const isLoading = loadingHistory || loadingMarket;

  if (isLoading) {
    return (
      <Card data-testid="card-performance-comparison">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {labels.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          {t.common.loading}
        </CardContent>
      </Card>
    );
  }

  if (portfolioChartData.length === 0) {
    return (
      <Card data-testid="card-performance-comparison">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {labels.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          {labels.noData}
        </CardContent>
      </Card>
    );
  }

  const isOutperforming = latestPortfolioChange > avgMarketChange;

  return (
    <Card data-testid="card-performance-comparison">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {labels.title}
            </CardTitle>
            <CardDescription>{labels.description}</CardDescription>
          </div>
          <Badge 
            variant={isOutperforming ? "default" : "secondary"}
            className={isOutperforming ? "bg-green-500/20 text-green-500 border-green-500/30" : ""}
          >
            {isOutperforming ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {isOutperforming ? labels.outperforming : labels.underperforming}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-md bg-primary/10 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">{labels.portfolioTotal}</span>
            </div>
            <p 
              className="font-bold text-lg"
              style={{ color: latestPortfolioChange >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))" }}
              dir="ltr"
              data-testid="text-portfolio-change"
            >
              {latestPortfolioChange >= 0 ? "+" : ""}{latestPortfolioChange.toFixed(2)}%
            </p>
          </div>
          
          <div className="p-3 rounded-md bg-orange-500/10 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Bitcoin className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">{labels.btc24h}</span>
            </div>
            <p 
              className="font-bold text-lg"
              style={{ color: btcChange24h >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))" }}
              dir="ltr"
              data-testid="text-btc-change"
            >
              {btcChange24h >= 0 ? "+" : ""}{btcChange24h.toFixed(2)}%
            </p>
          </div>
          
          <div className="p-3 rounded-md bg-blue-500/10 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">{labels.market24h}</span>
            </div>
            <p 
              className="font-bold text-lg"
              style={{ color: avgMarketChange >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))" }}
              dir="ltr"
              data-testid="text-market-change"
            >
              {avgMarketChange >= 0 ? "+" : ""}{avgMarketChange.toFixed(2)}%
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">{labels.portfolioHistory}</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 11 }} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="portfolio"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
