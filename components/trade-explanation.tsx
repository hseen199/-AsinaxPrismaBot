import { Brain, TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { Trade } from "@shared/schema";

interface TradeExplanationProps {
  trade: Trade;
  compact?: boolean;
}

export function TradeExplanation({ trade, compact = false }: TradeExplanationProps) {
  const { t } = useLanguage();

  const getStrategyIcon = (strategy: string | null) => {
    switch (strategy) {
      case "RSI":
        return <Activity className="w-4 h-4" />;
      case "MACD":
        return <BarChart3 className="w-4 h-4" />;
      case "AI_SENTIMENT":
        return <Brain className="w-4 h-4" />;
      case "MOVING_AVERAGES":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStrategyLabel = (strategy: string | null) => {
    const labels: Record<string, string> = {
      RSI: t.trades.strategyRsi,
      MACD: t.trades.strategyMacd,
      AI_SENTIMENT: t.trades.strategyAiSentiment,
      MOVING_AVERAGES: t.trades.strategyMovingAverages,
      MANUAL: t.trades.strategyManual,
    };
    return labels[strategy || ""] || strategy || t.trades.strategyManual;
  };

  const hasReason = trade.aiReason && trade.aiReason.trim().length > 0;

  if (!hasReason) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-muted-foreground",
        compact ? "text-xs" : "text-sm"
      )}>
        <Brain className="w-4 h-4" />
        <span>{t.trades.noReasonAvailable}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
          {getStrategyIcon(trade.strategy)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">
            {getStrategyLabel(trade.strategy)}
          </p>
          <p className="text-sm line-clamp-2">
            {trade.aiReason}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-muted/30 border-muted">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-primary/10 shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">
                {t.trades.aiExplanation}
              </p>
              <Badge variant="outline" className="text-xs">
                {getStrategyIcon(trade.strategy)}
                <span className="mr-1">{getStrategyLabel(trade.strategy)}</span>
              </Badge>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs",
                  trade.type === "buy" 
                    ? "bg-success/20 text-success" 
                    : "bg-destructive/20 text-destructive"
                )}
              >
                {trade.type === "buy" ? (
                  <><TrendingUp className="w-3 h-3 ml-1" />{t.trades.buy}</>
                ) : (
                  <><TrendingDown className="w-3 h-3 ml-1" />{t.trades.sell}</>
                )}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {trade.aiReason}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
