import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  Bot, 
  Shield, 
  Activity, 
  Brain,
  Save,
  AlertTriangle
} from "lucide-react";
import type { BotSettings } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const { data: settings, isLoading } = useQuery<BotSettings>({
    queryKey: ["/api/bot/settings"],
  });

  const [formData, setFormData] = useState<Partial<BotSettings>>({});

  const currentSettings = { ...settings, ...formData };

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<BotSettings>) => {
      return apiRequest("/api/bot/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/settings"] });
      toast({
        title: t.settings.saved,
        description: t.common.save,
      });
      setFormData({});
    },
    onError: () => {
      toast({
        title: t.common.error,
        description: t.settings.saveFailed,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (Object.keys(formData).length > 0) {
      updateMutation.mutate(formData);
    }
  };

  const handleToggle = (key: keyof BotSettings, value: boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSliderChange = (key: keyof BotSettings, value: number[]) => {
    setFormData(prev => ({ ...prev, [key]: value[0].toString() }));
  };

  const hasChanges = Object.keys(formData).length > 0;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">{t.settings.title}</h1>
          <p className="text-muted-foreground text-sm">{t.settings.subtitle}</p>
        </div>
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            data-testid="button-save-settings"
          >
            <Save className="w-4 h-4 ml-2" />
            {updateMutation.isPending ? t.settings.saving : t.settings.saveChanges}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-bot-settings">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{t.settings.botSettings}</CardTitle>
            </div>
            <CardDescription>{t.settings.botSettingsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-md">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${currentSettings.isActive ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
                <div>
                  <p className="font-medium">{t.settings.botStatus}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentSettings.isActive ? t.settings.botActiveTrading : t.settings.botStopped}
                  </p>
                </div>
              </div>
              <Switch
                checked={currentSettings.isActive || false}
                onCheckedChange={(checked) => handleToggle("isActive", checked)}
                data-testid="switch-bot-active"
              />
            </div>

            {currentSettings.isActive && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-md flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">{t.settings.warning}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.settings.warningDesc}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-strategies">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{t.settings.strategies}</CardTitle>
            </div>
            <CardDescription>{t.settings.strategiesDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t.settings.rsiIndicator}</p>
                  <p className="text-xs text-muted-foreground">{t.settings.rsiDesc}</p>
                </div>
              </div>
              <Switch
                checked={currentSettings.useRsi || false}
                onCheckedChange={(checked) => handleToggle("useRsi", checked)}
                data-testid="switch-use-rsi"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t.settings.macd}</p>
                  <p className="text-xs text-muted-foreground">{t.settings.macdDesc}</p>
                </div>
              </div>
              <Switch
                checked={currentSettings.useMacd || false}
                onCheckedChange={(checked) => handleToggle("useMacd", checked)}
                data-testid="switch-use-macd"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t.settings.movingAverages}</p>
                  <p className="text-xs text-muted-foreground">{t.settings.maDesc}</p>
                </div>
              </div>
              <Switch
                checked={currentSettings.useMovingAverages || false}
                onCheckedChange={(checked) => handleToggle("useMovingAverages", checked)}
                data-testid="switch-use-ma"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-md">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{t.settings.aiSentiment}</p>
                  <p className="text-xs text-muted-foreground">{t.settings.openaiSentiment}</p>
                </div>
              </div>
              <Switch
                checked={currentSettings.useAiSentiment || false}
                onCheckedChange={(checked) => handleToggle("useAiSentiment", checked)}
                data-testid="switch-use-ai"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-testid="card-risk-management">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{t.settings.riskManagement}</CardTitle>
            </div>
            <CardDescription>{t.settings.riskManagementDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>{t.settings.stopLossPercent}</Label>
                    <Badge variant="outline">
                      {currentSettings.stopLossPercent || "3"}%
                    </Badge>
                  </div>
                  <Slider
                    value={[parseFloat(currentSettings.stopLossPercent?.toString() || "3")]}
                    onValueChange={(v) => handleSliderChange("stopLossPercent", v)}
                    max={20}
                    min={1}
                    step={0.5}
                    data-testid="slider-stop-loss"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.settings.autoCloseAtLoss}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>{t.settings.takeProfitPercent}</Label>
                    <Badge variant="outline">
                      {currentSettings.takeProfitPercent || "10"}%
                    </Badge>
                  </div>
                  <Slider
                    value={[parseFloat(currentSettings.takeProfitPercent?.toString() || "10")]}
                    onValueChange={(v) => handleSliderChange("takeProfitPercent", v)}
                    max={50}
                    min={1}
                    step={1}
                    data-testid="slider-take-profit"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.settings.autoCloseAtProfit}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>{t.settings.maxRiskPercent}</Label>
                    <Badge variant="outline">
                      {currentSettings.maxRiskPercent || "5"}%
                    </Badge>
                  </div>
                  <Slider
                    value={[parseFloat(currentSettings.maxRiskPercent?.toString() || "5")]}
                    onValueChange={(v) => handleSliderChange("maxRiskPercent", v)}
                    max={25}
                    min={1}
                    step={0.5}
                    data-testid="slider-max-risk"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.settings.maxRiskPerTrade}
                  </p>
                </div>

                <div>
                  <Label className="mb-2 block">{t.settings.maxPositionSize}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={currentSettings.maxPositionSize?.toString() || "1000"}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxPositionSize: e.target.value }))}
                      className="font-mono"
                      dir="ltr"
                      data-testid="input-max-position"
                    />
                    <Badge variant="secondary">USDT</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.settings.maxTradeAmount}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-testid="card-trading-pairs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{t.settings.tradingPairsTitle}</CardTitle>
            </div>
            <CardDescription>{t.settings.tradingPairsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(currentSettings.tradingPairs || ["BTC/USDT", "ETH/USDT"]).map((pair) => (
                <Badge key={pair} variant="secondary" className="text-sm py-1.5 px-3">
                  {pair}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {t.settings.tradingPairsNote}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
