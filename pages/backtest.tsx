import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  FlaskConical,
  Play,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  BarChart3,
  Clock,
  RefreshCw,
  Percent,
  DollarSign,
  AlertTriangle,
  History,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BacktestResult as BacktestResultType } from "@shared/schema";

const AVAILABLE_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "SOLUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "DOTUSDT",
];

const STRATEGIES = [
  { value: "rsi", label: "استراتيجية RSI" },
  { value: "macd", label: "استراتيجية MACD" },
  { value: "sma", label: "تقاطع المتوسط المتحرك" },
  { value: "combined", label: "الاستراتيجية المجمعة" },
  { value: "smc", label: "Smart Money Concepts" },
];

interface BacktestRunResult {
  strategyName: string;
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalReturn: number;
  totalReturnPercent: number;
  trades: Array<{
    timestamp: number;
    type: "buy" | "sell";
    price: number;
    quantity: number;
    value: number;
    pnl: number;
    reason: string;
  }>;
  equityCurve: Array<{
    timestamp: number;
    equity: number;
    drawdown: number;
  }>;
  parameters: Record<string, unknown>;
}

export default function Backtest() {
  const { toast } = useToast();
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedStrategy, setSelectedStrategy] = useState("rsi");
  const [initialCapital, setInitialCapital] = useState(10000);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [rsiBuyThreshold, setRsiBuyThreshold] = useState(30);
  const [rsiSellThreshold, setRsiSellThreshold] = useState(70);
  const [macdFastPeriod, setMacdFastPeriod] = useState(12);
  const [macdSlowPeriod, setMacdSlowPeriod] = useState(26);
  const [macdSignalPeriod, setMacdSignalPeriod] = useState(9);
  const [smaPeriod, setSmaPeriod] = useState(20);
  const [stopLossPercent, setStopLossPercent] = useState(2);
  const [takeProfitPercent, setTakeProfitPercent] = useState(5);
  const [lastResult, setLastResult] = useState<BacktestRunResult | null>(null);

  const { data: backtestResults, isLoading: resultsLoading } = useQuery<BacktestResultType[]>({
    queryKey: ["/api/backtest/results"],
  });

  const runBacktestMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        strategy: selectedStrategy,
        symbol: selectedSymbol,
        initialCapital: Number(initialCapital) || 10000,
        rsiPeriod: Number(rsiPeriod) || 14,
        rsiBuyThreshold: Number(rsiBuyThreshold) || 30,
        rsiSellThreshold: Number(rsiSellThreshold) || 70,
        macdFastPeriod: Number(macdFastPeriod) || 12,
        macdSlowPeriod: Number(macdSlowPeriod) || 26,
        macdSignalPeriod: Number(macdSignalPeriod) || 9,
        smaPeriod: Number(smaPeriod) || 20,
        stopLossPercent: Number(stopLossPercent) || 2,
        takeProfitPercent: Number(takeProfitPercent) || 5,
      };
      const response = await apiRequest("POST", "/api/backtest/run", payload);
      return response.json();
    },
    onSuccess: (data: BacktestRunResult) => {
      setLastResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/backtest/results"] });
      toast({
        title: "اكتمل الاختبار",
        description: `تم اختبار ${STRATEGIES.find(s => s.value === selectedStrategy)?.label} على ${selectedSymbol}`,
      });
    },
    onError: (error: Error) => {
      setLastResult(null);
      toast({
        title: "خطأ في الاختبار",
        description: error.message || "فشل في تشغيل الاختبار. تحقق من البيانات المدخلة.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("ar-SA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const equityChartData = lastResult?.equityCurve.map((point) => ({
    time: formatTimestamp(point.timestamp),
    equity: point.equity,
    drawdown: point.drawdown,
  })) || [];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <FlaskConical className="w-7 h-7 text-primary" />
            اختبار الاستراتيجيات
          </h1>
          <p className="text-muted-foreground mt-1">
            اختبر استراتيجيات التداول على البيانات التاريخية
          </p>
        </div>
      </div>

      <Tabs defaultValue="run" className="space-y-4">
        <TabsList>
          <TabsTrigger value="run" data-testid="tab-run">
            <Play className="w-4 h-4 ml-2" />
            تشغيل اختبار
          </TabsTrigger>
          <TabsTrigger value="results" data-testid="tab-results">
            <BarChart3 className="w-4 h-4 ml-2" />
            النتائج
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <History className="w-4 h-4 ml-2" />
            السجل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5" />
                  إعدادات الاختبار
                </CardTitle>
                <CardDescription>
                  حدد الاستراتيجية والمعاملات للاختبار
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger data-testid="select-symbol">
                      <SelectValue placeholder="اختر العملة" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_SYMBOLS.map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>الاستراتيجية</Label>
                  <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                    <SelectTrigger data-testid="select-strategy">
                      <SelectValue placeholder="اختر الاستراتيجية" />
                    </SelectTrigger>
                    <SelectContent>
                      {STRATEGIES.map((strategy) => (
                        <SelectItem key={strategy.value} value={strategy.value}>
                          {strategy.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>رأس المال الأولي (USDT)</Label>
                  <Input
                    type="number"
                    min={100}
                    step={100}
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value) || 10000)}
                    data-testid="input-capital"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>وقف الخسارة %</Label>
                    <Input
                      type="number"
                      min={0.1}
                      max={50}
                      step={0.5}
                      value={stopLossPercent}
                      onChange={(e) => setStopLossPercent(Number(e.target.value) || 2)}
                      data-testid="input-stop-loss"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>جني الأرباح %</Label>
                    <Input
                      type="number"
                      min={0.1}
                      max={100}
                      step={0.5}
                      value={takeProfitPercent}
                      onChange={(e) => setTakeProfitPercent(Number(e.target.value) || 5)}
                      data-testid="input-take-profit"
                    />
                  </div>
                </div>

                {(selectedStrategy === "rsi" || selectedStrategy === "combined") && (
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-muted-foreground">معاملات RSI</Label>
                    <div className="space-y-2">
                      <Label>فترة RSI</Label>
                      <Input
                        type="number"
                        min={2}
                        max={100}
                        step={1}
                        value={rsiPeriod}
                        onChange={(e) => setRsiPeriod(Number(e.target.value) || 14)}
                        data-testid="input-rsi-period"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>حد الشراء</Label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          step={1}
                          value={rsiBuyThreshold}
                          onChange={(e) => setRsiBuyThreshold(Number(e.target.value) || 30)}
                          data-testid="input-rsi-buy"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>حد البيع</Label>
                        <Input
                          type="number"
                          min={50}
                          max={99}
                          step={1}
                          value={rsiSellThreshold}
                          onChange={(e) => setRsiSellThreshold(Number(e.target.value) || 70)}
                          data-testid="input-rsi-sell"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(selectedStrategy === "macd" || selectedStrategy === "combined") && (
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-muted-foreground">معاملات MACD</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label>سريع</Label>
                        <Input
                          type="number"
                          min={2}
                          max={50}
                          step={1}
                          value={macdFastPeriod}
                          onChange={(e) => setMacdFastPeriod(Number(e.target.value) || 12)}
                          data-testid="input-macd-fast"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>بطيء</Label>
                        <Input
                          type="number"
                          min={10}
                          max={100}
                          step={1}
                          value={macdSlowPeriod}
                          onChange={(e) => setMacdSlowPeriod(Number(e.target.value) || 26)}
                          data-testid="input-macd-slow"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>إشارة</Label>
                        <Input
                          type="number"
                          min={2}
                          max={50}
                          step={1}
                          value={macdSignalPeriod}
                          onChange={(e) => setMacdSignalPeriod(Number(e.target.value) || 9)}
                          data-testid="input-macd-signal"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(selectedStrategy === "sma" || selectedStrategy === "combined") && (
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-muted-foreground">معاملات SMA</Label>
                    <div className="space-y-2">
                      <Label>فترة المتوسط</Label>
                      <Input
                        type="number"
                        min={5}
                        max={200}
                        step={1}
                        value={smaPeriod}
                        onChange={(e) => setSmaPeriod(Number(e.target.value) || 20)}
                        data-testid="input-sma-period"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => runBacktestMutation.mutate()}
                  disabled={runBacktestMutation.isPending}
                  className="w-full mt-4"
                  data-testid="button-run-backtest"
                >
                  {runBacktestMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 ml-2" />
                  )}
                  تشغيل الاختبار
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  منحنى رأس المال
                </CardTitle>
                <CardDescription>
                  تطور رأس المال خلال فترة الاختبار
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lastResult && equityChartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={equityChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          className="text-muted-foreground"
                          tickFormatter={(val) => `$${val.toLocaleString()}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, "رأس المال"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="equity"
                          name="رأس المال"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary) / 0.2)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    قم بتشغيل اختبار لعرض النتائج
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {lastResult ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      العائد الإجمالي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {Number(lastResult.totalReturnPercent) >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                      <span
                        className={`text-2xl font-bold ${Number(lastResult.totalReturnPercent) >= 0 ? "text-green-500" : "text-red-500"}`}
                        data-testid="text-total-return"
                      >
                        {Number(lastResult.totalReturnPercent) >= 0 ? "+" : ""}
                        {Number(lastResult.totalReturnPercent).toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${Number(lastResult.totalReturn).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      معدل الفوز
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold" data-testid="text-win-rate">
                        {Number(lastResult.winRate).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lastResult.winningTrades} فوز / {lastResult.losingTrades} خسارة
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      عامل الربح
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold" data-testid="text-profit-factor">
                        {Number(lastResult.profitFactor).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lastResult.totalTrades} صفقة
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      أقصى تراجع
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span className="text-2xl font-bold text-orange-500" data-testid="text-max-drawdown">
                        {Number(lastResult.maxDrawdown).toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sharpe: {Number(lastResult.sharpeRatio).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      ملخص رأس المال
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">رأس المال الأولي</span>
                        <span className="font-mono font-medium">
                          ${Number(lastResult.initialCapital).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">رأس المال النهائي</span>
                        <span className={`font-mono font-medium ${Number(lastResult.finalCapital) >= Number(lastResult.initialCapital) ? "text-green-500" : "text-red-500"}`}>
                          ${Number(lastResult.finalCapital).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">فترة الاختبار</span>
                        <span className="font-medium">
                          {formatDate(lastResult.startDate)} - {formatDate(lastResult.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">الاستراتيجية</span>
                        <Badge variant="outline">{lastResult.strategyName}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="w-5 h-5" />
                      مؤشرات الأداء
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">نسبة Sharpe</span>
                        <span className="font-mono font-medium">{Number(lastResult.sharpeRatio).toFixed(4)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">عامل الربح</span>
                        <span className="font-mono font-medium">{Number(lastResult.profitFactor).toFixed(4)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">أقصى تراجع</span>
                        <span className="font-mono font-medium text-orange-500">{Number(lastResult.maxDrawdown).toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">إجمالي الصفقات</span>
                        <span className="font-mono font-medium">{lastResult.totalTrades}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    سجل الصفقات
                  </CardTitle>
                  <CardDescription>
                    جميع الصفقات المنفذة خلال فترة الاختبار
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lastResult.trades.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {lastResult.trades.map((trade, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                          data-testid={`trade-row-${idx}`}
                        >
                          <div className="flex items-center gap-3">
                            {trade.type === "buy" ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={trade.type === "buy" ? "default" : "destructive"}>
                                  {trade.type === "buy" ? "شراء" : "بيع"}
                                </Badge>
                                <span className="text-sm text-muted-foreground">{trade.reason}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatTimestamp(trade.timestamp)}
                              </div>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="font-mono">${trade.price.toFixed(2)}</div>
                            {trade.type === "sell" && (
                              <div className={`text-sm ${trade.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      لا توجد صفقات
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>قم بتشغيل اختبار لعرض النتائج</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                سجل الاختبارات السابقة
              </CardTitle>
              <CardDescription>
                جميع نتائج الاختبارات المحفوظة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : backtestResults && backtestResults.length > 0 ? (
                <div className="space-y-3">
                  {backtestResults.map((result, idx) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-4 rounded-md bg-muted/50"
                      data-testid={`history-row-${idx}`}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium">{result.strategyName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline">{result.symbol}</Badge>
                            <span>{result.createdAt ? formatDate(result.createdAt) : "-"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-left">
                          <div className="text-sm text-muted-foreground">معدل الفوز</div>
                          <div className="font-medium">{Number(result.winRate).toFixed(1)}%</div>
                        </div>
                        <div className="text-left">
                          <div className="text-sm text-muted-foreground">العائد</div>
                          <div className={`font-medium ${Number(result.finalCapital) >= Number(result.initialCapital) ? "text-green-500" : "text-red-500"}`}>
                            {((Number(result.finalCapital) - Number(result.initialCapital)) / Number(result.initialCapital) * 100).toFixed(2)}%
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-sm text-muted-foreground">الصفقات</div>
                          <div className="font-medium">{result.totalTrades}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد اختبارات سابقة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
