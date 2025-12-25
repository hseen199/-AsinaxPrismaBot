import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Brain,
  AlertCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { Sentiment } from "@shared/schema";

export default function AiAnalysis() {
  const { t, language } = useLanguage();
  
  const sentimentConfig = {
    bullish: {
      label: t.dashboard.bullish,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
      icon: TrendingUp,
    },
    bearish: {
      label: t.dashboard.bearish,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
      icon: TrendingDown,
    },
    neutral: {
      label: t.dashboard.neutral,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      borderColor: "border-border",
      icon: Minus,
    },
  };

  const { data: sentiments = [], isLoading, refetch, isFetching } = useQuery<Sentiment[]>({
    queryKey: ["/api/sentiment"],
  });

  const bullishCount = sentiments.filter(s => s.sentiment === "bullish").length;
  const bearishCount = sentiments.filter(s => s.sentiment === "bearish").length;
  const neutralCount = sentiments.filter(s => s.sentiment === "neutral").length;
  
  const avgScore = sentiments.length > 0 
    ? sentiments.reduce((sum, s) => sum + parseFloat(s.score), 0) / sentiments.length 
    : 0;

  const avgConfidence = sentiments.length > 0
    ? sentiments.reduce((sum, s) => sum + (s.confidence ? parseFloat(s.confidence) : 0), 0) / sentiments.length
    : 0;

  const overallSentiment = avgScore > 20 ? "bullish" : avgScore < -20 ? "bearish" : "neutral";
  const overallConfig = sentimentConfig[overallSentiment];
  const OverallIcon = overallConfig.icon;

  const dateLocale = language === "ar" ? "ar-SA" : "en-US";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">{t.aiAnalysis.title}</h1>
          <p className="text-muted-foreground text-sm">{t.aiAnalysis.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <Brain className="w-3 h-3 ml-1" />
            {t.aiAnalysis.poweredByOpenai}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-analysis"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cn("border-2", overallConfig.borderColor)} data-testid="card-overall-sentiment">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-3 rounded-md", overallConfig.bgColor)}>
                <OverallIcon className={cn("w-6 h-6", overallConfig.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.aiAnalysis.overallTrend}</p>
                <p className={cn("text-xl font-bold", overallConfig.color)}>
                  {overallConfig.label}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.aiAnalysis.confidenceLevel}</span>
              <span className="font-medium" dir="ltr">{avgConfidence.toFixed(0)}%</span>
            </div>
            <Progress value={avgConfidence} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="card-bullish-count">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.aiAnalysis.bullishSignals}</p>
                <p className="text-2xl font-bold text-success">{bullishCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-bearish-count">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-destructive/10">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.aiAnalysis.bearishSignals}</p>
                <p className="text-2xl font-bold text-destructive">{bearishCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-neutral-count">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-muted">
                <Minus className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.aiAnalysis.neutralSignals}</p>
                <p className="text-2xl font-bold">{neutralCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-sentiment-details">
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <Bot className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">{t.aiAnalysis.analysisDetails}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse p-4 bg-muted rounded-md">
                  <div className="h-4 bg-muted-foreground/20 rounded w-24 mb-3" />
                  <div className="h-2 bg-muted-foreground/20 rounded w-full mb-2" />
                  <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : sentiments.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">{t.aiAnalysis.noAnalysisAvailable}</p>
              <p className="text-xs text-muted-foreground">{t.aiAnalysis.autoUpdateDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sentiments.map((sentiment) => {
                const config = sentimentConfig[sentiment.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;
                const score = parseFloat(sentiment.score);
                const normalizedScore = ((score + 100) / 200) * 100;
                const confidence = sentiment.confidence ? parseFloat(sentiment.confidence) : 0;
                const SentimentIcon = config.icon;

                return (
                  <div
                    key={sentiment.id}
                    className={cn("p-4 rounded-md border", config.bgColor, config.borderColor)}
                    data-testid={`analysis-${sentiment.symbol}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg" dir="ltr">{sentiment.symbol}</span>
                        <Badge variant="outline" className={cn("text-xs", config.color)}>
                          <SentimentIcon className="w-3 h-3 ml-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <span className={cn("text-xl font-bold", config.color)} dir="ltr">
                        {score > 0 && "+"}{score.toFixed(0)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{t.aiAnalysis.sentimentIndicator}</span>
                        <span dir="ltr">{score.toFixed(0)} / 100</span>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all", 
                            score > 0 ? "bg-success" : score < 0 ? "bg-destructive" : "bg-muted-foreground"
                          )}
                          style={{ width: `${normalizedScore}%` }}
                        />
                      </div>
                    </div>

                    {sentiment.summary && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {sentiment.summary}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        <span>{t.aiAnalysis.confidence}: {confidence.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {sentiment.createdAt && new Date(sentiment.createdAt).toLocaleString(dateLocale, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {sentiment.newsSource && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                          {t.aiAnalysis.source}: {sentiment.newsSource}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
