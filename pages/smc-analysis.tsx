import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Target,
  AlertCircle,
  Zap,
  BarChart3,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface KillZone {
  name: string;
  nameAr: string;
  startHour: number;
  endHour: number;
  isActive: boolean;
  description: string;
}

interface FairValueGap {
  type: "bullish" | "bearish";
  startPrice: number;
  endPrice: number;
  gapSize: number;
  gapPercent: number;
  timestamp: number;
  filled: boolean;
}

interface OrderBlock {
  type: "bullish" | "bearish";
  priceHigh: number;
  priceLow: number;
  strength: number;
  timestamp: number;
  tested: boolean;
}

interface LiquiditySweep {
  type: "buy_side" | "sell_side";
  level: number;
  sweptAt: number;
  priceAfterSweep: number;
  reversal: boolean;
}

interface SMCAnalysis {
  symbol: string;
  timestamp: number;
  killZones: KillZone[];
  activeKillZone: KillZone | null;
  fairValueGaps: FairValueGap[];
  orderBlocks: OrderBlock[];
  liquiditySweeps: LiquiditySweep[];
  marketStructure: "bullish" | "bearish" | "ranging";
  bias: "long" | "short" | "neutral";
  confidenceScore: number;
}

interface SMCSignal {
  action: "buy" | "sell" | "hold";
  reason: string;
  confidence: number;
  killZoneBonus: boolean;
}

interface KillZonesResponse {
  killZones: KillZone[];
  activeKillZone: KillZone | null;
}

const biasConfig = {
  long: {
    label: "شراء",
    labelEn: "Long",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    icon: TrendingUp,
  },
  short: {
    label: "بيع",
    labelEn: "Short",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    icon: TrendingDown,
  },
  neutral: {
    label: "محايد",
    labelEn: "Neutral",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-border",
    icon: Minus,
  },
};

const actionConfig = {
  buy: {
    label: "شراء",
    labelEn: "Buy",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  sell: {
    label: "بيع",
    labelEn: "Sell",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  hold: {
    label: "انتظار",
    labelEn: "Hold",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

const tradingPairs = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "XRP/USDT",
  "BNB/USDT",
  "ADA/USDT",
  "DOGE/USDT",
  "AVAX/USDT",
];

export default function SMCAnalysisPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDT");
  
  const { data: killZonesData, isLoading: killZonesLoading } = useQuery<KillZonesResponse>({
    queryKey: ["/api/smc/killzones"],
    refetchInterval: 60000,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const response = await apiRequest("POST", "/api/smc/analyze", { symbol });
      return response.json();
    },
  });

  const handleAnalyze = () => {
    analyzeMutation.mutate(selectedSymbol);
  };

  const analysis: SMCAnalysis | undefined = analyzeMutation.data?.analysis;
  const signal: SMCSignal | undefined = analyzeMutation.data?.signal;

  const activeKillZone = killZonesData?.activeKillZone;
  const killZones = killZonesData?.killZones || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">تحليل Smart Money</h1>
          <p className="text-muted-foreground text-sm">مفاهيم الأموال الذكية و ICT Kill Zones</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {activeKillZone && (
            <Badge variant="default" className="bg-primary text-primary-foreground">
              <Zap className="w-3 h-3 ml-1" />
              {activeKillZone.nameAr}
            </Badge>
          )}
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-36" data-testid="select-symbol">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tradingPairs.map((pair) => (
                <SelectItem key={pair} value={pair}>{pair}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            data-testid="button-analyze-smc"
          >
            <RefreshCw className={cn("w-4 h-4 ml-2", analyzeMutation.isPending && "animate-spin")} />
            تحليل
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-kill-zone-status">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-3 rounded-md", activeKillZone ? "bg-primary/10" : "bg-muted")}>
                <Clock className={cn("w-6 h-6", activeKillZone ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kill Zone</p>
                <p className={cn("text-lg font-bold", activeKillZone ? "text-primary" : "text-muted-foreground")}>
                  {activeKillZone ? activeKillZone.nameAr : "غير نشط"}
                </p>
              </div>
            </div>
            {activeKillZone && (
              <p className="text-xs text-muted-foreground">{activeKillZone.description}</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-market-structure">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-md", 
                analysis?.marketStructure === "bullish" ? "bg-success/10" :
                analysis?.marketStructure === "bearish" ? "bg-destructive/10" : "bg-muted"
              )}>
                <Activity className={cn("w-5 h-5",
                  analysis?.marketStructure === "bullish" ? "text-success" :
                  analysis?.marketStructure === "bearish" ? "text-destructive" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">هيكل السوق</p>
                <p className={cn("text-lg font-bold",
                  analysis?.marketStructure === "bullish" ? "text-success" :
                  analysis?.marketStructure === "bearish" ? "text-destructive" : "text-muted-foreground"
                )}>
                  {analysis?.marketStructure === "bullish" ? "صاعد" :
                   analysis?.marketStructure === "bearish" ? "هابط" : "متذبذب"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-trading-bias">
          <CardContent className="p-6">
            {analysis ? (
              <div className="flex items-center gap-3">
                <div className={cn("p-3 rounded-md", biasConfig[analysis.bias].bgColor)}>
                  {(() => {
                    const BiasIcon = biasConfig[analysis.bias].icon;
                    return <BiasIcon className={cn("w-5 h-5", biasConfig[analysis.bias].color)} />;
                  })()}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الاتجاه المتوقع</p>
                  <p className={cn("text-lg font-bold", biasConfig[analysis.bias].color)}>
                    {biasConfig[analysis.bias].label}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-muted">
                  <Target className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الاتجاه المتوقع</p>
                  <p className="text-lg font-bold text-muted-foreground">-</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-confidence-score">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-md bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">درجة الثقة</p>
                <p className="text-lg font-bold" dir="ltr">
                  {analysis ? `${analysis.confidenceScore.toFixed(0)}%` : "-"}
                </p>
              </div>
            </div>
            {analysis && (
              <Progress value={analysis.confidenceScore} className="h-1.5" />
            )}
          </CardContent>
        </Card>
      </div>

      {signal && (
        <Card className={cn("border-2", actionConfig[signal.action].bgColor)} data-testid="card-smc-signal">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                إشارة التداول
              </CardTitle>
              <Badge className={cn(actionConfig[signal.action].bgColor, actionConfig[signal.action].color)}>
                {actionConfig[signal.action].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{signal.reason}</p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">درجة الثقة:</span>
                <span className="font-medium" dir="ltr">{signal.confidence}%</span>
              </div>
              {signal.killZoneBonus && (
                <Badge variant="outline" className="text-primary border-primary">
                  <Zap className="w-3 h-3 ml-1" />
                  تعزيز Kill Zone
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-kill-zones">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">ICT Kill Zones</CardTitle>
          </CardHeader>
          <CardContent>
            {killZonesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse p-3 bg-muted rounded-md h-16" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {killZones.map((kz, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "p-4 rounded-md border transition-colors",
                      kz.isActive 
                        ? "bg-primary/10 border-primary/30" 
                        : "bg-muted/50 border-border"
                    )}
                    data-testid={`killzone-${kz.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{kz.nameAr}</span>
                        {kz.isActive && (
                          <Badge variant="default">نشط</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground" dir="ltr">
                        {String(kz.startHour).padStart(2, '0')}:00 - {String(kz.endHour).padStart(2, '0')}:00 UTC
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{kz.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-order-blocks">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Order Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            {!analysis ? (
              <div className="text-center py-8">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-sm">اضغط تحليل لعرض Order Blocks</p>
              </div>
            ) : analysis.orderBlocks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">لا توجد Order Blocks حالياً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analysis.orderBlocks.map((ob, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "p-3 rounded-md border",
                      ob.type === "bullish" ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                    )}
                    data-testid={`orderblock-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {ob.type === "bullish" ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                        <span className={cn("font-medium", ob.type === "bullish" ? "text-success" : "text-destructive")}>
                          {ob.type === "bullish" ? "صاعد" : "هابط"}
                        </span>
                        {ob.tested && (
                          <Badge variant="outline">مختبر</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        قوة: {ob.strength.toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground" dir="ltr">
                      ${ob.priceLow.toFixed(2)} - ${ob.priceHigh.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-fvg">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Fair Value Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            {!analysis ? (
              <div className="text-center py-8">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-sm">اضغط تحليل لعرض FVGs</p>
              </div>
            ) : analysis.fairValueGaps.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">لا توجد Fair Value Gaps حالياً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analysis.fairValueGaps.map((fvg, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "p-3 rounded-md border",
                      fvg.type === "bullish" ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                    )}
                    data-testid={`fvg-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {fvg.type === "bullish" ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                        <span className={cn("font-medium", fvg.type === "bullish" ? "text-success" : "text-destructive")}>
                          {fvg.type === "bullish" ? "صاعد" : "هابط"}
                        </span>
                        {fvg.filled && (
                          <Badge variant="outline">ممتلئ</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {fvg.gapPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground" dir="ltr">
                      ${fvg.startPrice.toFixed(2)} - ${fvg.endPrice.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-liquidity-sweeps">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Liquidity Sweeps</CardTitle>
          </CardHeader>
          <CardContent>
            {!analysis ? (
              <div className="text-center py-8">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-sm">اضغط تحليل لعرض Liquidity Sweeps</p>
              </div>
            ) : analysis.liquiditySweeps.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">لا توجد Liquidity Sweeps حالياً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analysis.liquiditySweeps.map((sweep, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "p-3 rounded-md border",
                      sweep.reversal 
                        ? sweep.type === "sell_side" ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                        : "bg-muted border-border"
                    )}
                    data-testid={`sweep-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {sweep.type === "buy_side" ? "Buy Side" : "Sell Side"}
                        </span>
                        {sweep.reversal && (
                          <Badge className={sweep.type === "sell_side" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}>
                            انعكاس
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground" dir="ltr">
                      Level: ${sweep.level.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
