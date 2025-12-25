import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Activity, BarChart3, Droplets } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { Sentiment } from "@shared/schema";
import { AIThinkingPulse } from "@/components/ai-thinking-pulse";

interface AIInsightsProps {
  sentiments: Sentiment[];
  isLoading: boolean;
}

export function AIInsights({ sentiments, isLoading }: AIInsightsProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-primary/20 flex flex-col h-full animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-muted" />
          <div className="h-6 bg-muted rounded w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const getInsightColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish': return 'green';
      case 'bearish': return 'red';
      default: return 'cyan';
    }
  };

  const getInsightIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish': return TrendingUp;
      case 'bearish': return AlertTriangle;
      default: return Lightbulb;
    }
  };

  const getInsightLabel = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish': return t.components.aiInsights.strongUptrend;
      case 'bearish': return t.components.aiInsights.bearishWarning;
      default: return t.dashboard.neutral;
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-primary/20 flex flex-col h-full overflow-visible">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center icon-glow">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div className="absolute -top-1 -right-1">
            <AIThinkingPulse size="sm" isActive={sentiments.length > 0} />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground leading-none">{t.components.aiInsights.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">{t.components.aiInsights.poweredBy}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {sentiments.slice(0, 3).map((insight, index) => {
          const color = getInsightColor(insight.sentiment);
          const Icon = getInsightIcon(insight.sentiment);
          const label = getInsightLabel(insight.sentiment);
          const confidence = insight.confidence ? parseFloat(insight.confidence) : 75;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border transition-all ${
                color === 'green' ? 'bg-green-500/10 border-green-500/20' :
                color === 'red' ? 'bg-red-500/10 border-red-500/20' :
                'bg-primary/10 border-primary/20'
              }`}
              data-testid={`card-insight-${insight.symbol}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className={`mt-1 p-1.5 rounded-lg ${
                    color === 'green' ? 'bg-green-500/20 text-green-500' :
                    color === 'red' ? 'bg-red-500/20 text-red-500' :
                    'bg-primary/20 text-primary'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground">{insight.symbol}</h4>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        color === 'green' ? 'text-green-500 border-green-500/30' :
                        color === 'red' ? 'text-red-500 border-red-500/30' :
                        'text-primary border-primary/30'
                      }`}>{label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{insight.summary || t.components.aiInsights.analysisInProgress}</p>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-muted-foreground mb-1">{t.aiAnalysis.confidence}</div>
                  <div className={`font-bold text-lg ${
                    color === 'green' ? 'text-green-500' :
                    color === 'red' ? 'text-red-500' :
                    'text-primary'
                  }`}>{confidence.toFixed(0)}%</div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {sentiments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t.components.aiInsights.noAnalysis}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-auto">
        <div className="bg-muted/50 p-3 rounded-xl border border-border text-center">
          <Activity className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <div className="text-xs text-muted-foreground mb-1">{t.components.aiInsights.trendStrength}</div>
          <div className="font-bold text-green-500 text-sm">{t.components.aiInsights.strongUptrend}</div>
        </div>
        <div className="bg-muted/50 p-3 rounded-xl border border-border text-center">
          <BarChart3 className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
          <div className="text-xs text-muted-foreground mb-1">{t.components.aiInsights.riskLevel}</div>
          <div className="font-bold text-yellow-500 text-sm">{t.components.aiInsights.medium}</div>
        </div>
        <div className="bg-muted/50 p-3 rounded-xl border border-border text-center">
          <Droplets className="w-5 h-5 text-primary mx-auto mb-2" />
          <div className="text-xs text-muted-foreground mb-1">{t.components.aiInsights.liquidity}</div>
          <div className="font-bold text-primary text-sm">{t.components.aiInsights.high}</div>
        </div>
      </div>
    </div>
  );
}
