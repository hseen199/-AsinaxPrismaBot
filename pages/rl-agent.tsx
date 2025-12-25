import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Cpu,
  Play,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Target,
  Zap,
  Brain,
  BarChart3,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import type { RlAgentConfig, RlTrainingEpisode, RlDecision } from "@shared/schema";

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

export default function RLAgent() {
  const { toast } = useToast();
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [trainEpisodes, setTrainEpisodes] = useState(100);
  const [initialCapital, setInitialCapital] = useState(10000);

  const { data: agents, isLoading: agentsLoading } = useQuery<RlAgentConfig[]>({
    queryKey: ["/api/rl/agents"],
  });

  const { data: agentData, isLoading: agentLoading } = useQuery<{
    config: RlAgentConfig;
    stats: {
      totalEpisodes: number;
      totalReward: number;
      avgReward: number;
      explorationRate: number;
      statesLearned: number;
    };
  }>({
    queryKey: ["/api/rl/agent", selectedSymbol],
    enabled: !!selectedSymbol,
    retry: false,
  });

  const { data: episodes } = useQuery<RlTrainingEpisode[]>({
    queryKey: ["/api/rl/episodes", selectedSymbol],
    enabled: !!selectedSymbol,
  });

  const { data: decisions } = useQuery<RlDecision[]>({
    queryKey: ["/api/rl/decisions", selectedSymbol],
    enabled: !!selectedSymbol,
  });

  const createAgentMutation = useMutation({
    mutationFn: async (symbol: string) => {
      return apiRequest("POST", "/api/rl/agent", { symbol });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rl/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rl/agent", selectedSymbol] });
      toast({
        title: "تم إنشاء الوكيل",
        description: `تم إنشاء وكيل التعلم الآلي لـ ${selectedSymbol}`,
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الوكيل",
        variant: "destructive",
      });
    },
  });

  const trainMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/rl/train/${selectedSymbol}`, {
        episodes: trainEpisodes,
        initialCapital,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rl/agent", selectedSymbol] });
      queryClient.invalidateQueries({ queryKey: ["/api/rl/episodes", selectedSymbol] });
      toast({
        title: "اكتمل التدريب",
        description: `تم تدريب الوكيل على ${data.trainingResults?.length || trainEpisodes} حلقة`,
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في التدريب",
        variant: "destructive",
      });
    },
  });

  const predictMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/rl/predict/${selectedSymbol}`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rl/decisions", selectedSymbol] });
      const actionLabels: Record<string, string> = {
        buy: "شراء",
        sell: "بيع",
        hold: "انتظار",
      };
      toast({
        title: "توقع جديد",
        description: `التوصية: ${actionLabels[data.decision?.action] || data.decision?.action} بثقة ${((data.decision?.confidence || 0) * 100).toFixed(1)}%`,
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في الحصول على توقع",
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/rl/reset/${selectedSymbol}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rl/agent", selectedSymbol] });
      queryClient.invalidateQueries({ queryKey: ["/api/rl/episodes", selectedSymbol] });
      queryClient.invalidateQueries({ queryKey: ["/api/rl/decisions", selectedSymbol] });
      toast({
        title: "تم إعادة الضبط",
        description: "تم إعادة ضبط الوكيل بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إعادة الضبط",
        variant: "destructive",
      });
    },
  });

  const agentExists = agents?.some((a) => a.symbol === selectedSymbol);

  const episodeChartData =
    episodes?.map((ep, idx) => ({
      episode: idx + 1,
      reward: Number(ep.totalReward) || 0,
      endingCapital: Number(ep.endingCapital) || 0,
    })) || [];

  const getActionIcon = (action: string) => {
    switch (action) {
      case "buy":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "sell":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "buy":
        return "شراء";
      case "sell":
        return "بيع";
      default:
        return "انتظار";
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "buy":
        return "default";
      case "sell":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Cpu className="w-7 h-7 text-primary" />
            وكيل التعلم الآلي
          </h1>
          <p className="text-muted-foreground mt-1">
            نظام تداول ذكي يتعلم من أنماط السوق باستخدام Q-Learning
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-40" data-testid="select-symbol">
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

          {!agentExists && (
            <Button
              onClick={() => createAgentMutation.mutate(selectedSymbol)}
              disabled={createAgentMutation.isPending}
              data-testid="button-create-agent"
            >
              <Zap className="w-4 h-4 ml-2" />
              إنشاء وكيل
            </Button>
          )}
        </div>
      </div>

      {agentLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : agentData?.config ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  حلقات التدريب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold" data-testid="text-total-episodes">
                    {agentData.stats?.totalEpisodes ?? 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  متوسط المكافأة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold" data-testid="text-avg-reward">
                    {(agentData.stats?.avgReward ?? 0).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  إجمالي المكافأة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold" data-testid="text-total-reward">
                    {(agentData.stats?.totalReward ?? 0).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  معدل الاستكشاف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold" data-testid="text-exploration-rate">
                    {((agentData.stats?.explorationRate ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="training" className="space-y-4">
            <TabsList>
              <TabsTrigger value="training" data-testid="tab-training">
                <Play className="w-4 h-4 ml-2" />
                التدريب
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">
                <BarChart3 className="w-4 h-4 ml-2" />
                سجل التدريب
              </TabsTrigger>
              <TabsTrigger value="decisions" data-testid="tab-decisions">
                <Clock className="w-4 h-4 ml-2" />
                القرارات
              </TabsTrigger>
              <TabsTrigger value="config" data-testid="tab-config">
                <Cpu className="w-4 h-4 ml-2" />
                الإعدادات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="training" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      تدريب الوكيل
                    </CardTitle>
                    <CardDescription>
                      قم بتدريب الوكيل على بيانات السوق الحالية
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>عدد حلقات التدريب</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[trainEpisodes]}
                          onValueChange={([val]) => setTrainEpisodes(val)}
                          min={10}
                          max={500}
                          step={10}
                          className="flex-1"
                          data-testid="slider-episodes"
                        />
                        <Input
                          type="number"
                          value={trainEpisodes}
                          onChange={(e) => setTrainEpisodes(Number(e.target.value))}
                          className="w-20"
                          data-testid="input-episodes"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>رأس المال الأولي (USDT)</Label>
                      <Input
                        type="number"
                        value={initialCapital}
                        onChange={(e) => setInitialCapital(Number(e.target.value))}
                        data-testid="input-capital"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => trainMutation.mutate()}
                        disabled={trainMutation.isPending}
                        className="flex-1"
                        data-testid="button-train"
                      >
                        {trainMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 ml-2" />
                        )}
                        بدء التدريب
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => resetMutation.mutate()}
                        disabled={resetMutation.isPending}
                        data-testid="button-reset"
                      >
                        <RotateCcw className="w-4 h-4 ml-2" />
                        إعادة ضبط
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      الحصول على توقع
                    </CardTitle>
                    <CardDescription>
                      استخدم الوكيل المدرب للحصول على توصية تداول
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-md bg-muted/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">العملة</span>
                        <Badge variant="outline">{selectedSymbol}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">حالة الوكيل</span>
                        <Badge variant={(agentData.stats?.totalEpisodes ?? 0) > 0 ? "default" : "secondary"}>
                          {(agentData.stats?.totalEpisodes ?? 0) > 0 ? "مُدرَّب" : "غير مُدرَّب"}
                        </Badge>
                      </div>
                      {decisions && decisions.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">آخر توصية</span>
                          <div className="flex items-center gap-2">
                            {getActionIcon(decisions[0].action)}
                            <Badge variant={getActionBadgeVariant(decisions[0].action)}>
                              {getActionLabel(decisions[0].action)}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => predictMutation.mutate()}
                      disabled={predictMutation.isPending || (agentData.stats?.totalEpisodes ?? 0) === 0}
                      className="w-full"
                      data-testid="button-predict"
                    >
                      {predictMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 ml-2" />
                      )}
                      الحصول على توقع
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    سجل التدريب
                  </CardTitle>
                  <CardDescription>
                    أداء الوكيل عبر حلقات التدريب المختلفة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {episodeChartData.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={episodeChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="episode"
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                          />
                          <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            labelFormatter={(val) => `الحلقة ${val}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="reward"
                            name="المكافأة"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary) / 0.2)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      لا توجد بيانات تدريب بعد
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decisions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    سجل القرارات
                  </CardTitle>
                  <CardDescription>القرارات التي اتخذها الوكيل</CardDescription>
                </CardHeader>
                <CardContent>
                  {decisions && decisions.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {decisions.slice(0, 20).map((decision, idx) => (
                        <div
                          key={decision.id}
                          className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                          data-testid={`decision-row-${idx}`}
                        >
                          <div className="flex items-center gap-3">
                            {getActionIcon(decision.action)}
                            <div>
                              <div className="font-medium">
                                {getActionLabel(decision.action)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {decision.createdAt ? new Date(decision.createdAt).toLocaleString("ar-SA") : "-"}
                              </div>
                            </div>
                          </div>
                          <div className="text-left">
                            <Badge variant="outline">
                              ثقة: {((Number(decision.confidence) || 0) * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      لا توجد قرارات بعد
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    إعدادات الوكيل
                  </CardTitle>
                  <CardDescription>معاملات خوارزمية Q-Learning</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">معدل التعلم</span>
                        <span className="font-mono font-medium" data-testid="text-learning-rate">
                          {(Number(agentData.config?.learningRate) || 0.001).toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">معامل الخصم</span>
                        <span className="font-mono font-medium" data-testid="text-discount-factor">
                          {(Number(agentData.config?.discountFactor) || 0.95).toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">معدل الاستكشاف</span>
                        <span className="font-mono font-medium">
                          {(Number(agentData.config?.explorationRate) || 0.1).toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">انحلال الاستكشاف</span>
                        <span className="font-mono font-medium" data-testid="text-exploration-decay">
                          {(Number(agentData.config?.explorationDecay) || 0.995).toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">الحد الأدنى للاستكشاف</span>
                        <span className="font-mono font-medium" data-testid="text-min-exploration">
                          {(Number(agentData.config?.minExploration) || 0.01).toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <span className="text-muted-foreground">حالة الوكيل</span>
                        <Badge variant={agentData.config?.isActive ? "default" : "secondary"}>
                          {agentData.config?.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Cpu className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا يوجد وكيل لـ {selectedSymbol}</h3>
            <p className="text-muted-foreground mb-4">
              قم بإنشاء وكيل تعلم آلي جديد للبدء في التدريب والتداول
            </p>
            <Button
              onClick={() => createAgentMutation.mutate(selectedSymbol)}
              disabled={createAgentMutation.isPending}
              data-testid="button-create-agent-empty"
            >
              <Zap className="w-4 h-4 ml-2" />
              إنشاء وكيل جديد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
