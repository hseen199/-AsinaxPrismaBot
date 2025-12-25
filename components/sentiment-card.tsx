import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Bot, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Sentiment } from "@shared/schema";

interface SentimentCardProps {
  sentiments: Sentiment[];
  isLoading?: boolean;
}

const sentimentConfig = {
  bullish: {
    label: "صاعد",
    color: "text-success",
    bgColor: "bg-success/10",
    icon: TrendingUp,
  },
  bearish: {
    label: "هابط",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    icon: TrendingDown,
  },
  neutral: {
    label: "محايد",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    icon: Minus,
  },
};

export function SentimentCard({ sentiments, isLoading }: SentimentCardProps) {
  const latestSentiments = sentiments.slice(0, 4);

  return (
    <Card data-testid="card-sentiment">
      <CardHeader className="flex flex-row items-center gap-2 pb-4">
        <Bot className="w-5 h-5 text-primary" />
        <CardTitle className="text-lg">تحليل الذكاء الاصطناعي</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-2 bg-muted rounded w-full mb-1" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : latestSentiments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا يوجد تحليل متاح حالياً</p>
            <p className="text-xs mt-1">سيتم تحديث التحليل قريباً</p>
          </div>
        ) : (
          <div className="space-y-4">
            {latestSentiments.map((sentiment) => {
              const config = sentimentConfig[sentiment.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;
              const score = parseFloat(sentiment.score);
              const normalizedScore = ((score + 100) / 200) * 100;
              const confidence = sentiment.confidence ? parseFloat(sentiment.confidence) : 0;
              const SentimentIcon = config.icon;

              return (
                <div
                  key={sentiment.id}
                  className={cn("p-3 rounded-md", config.bgColor)}
                  data-testid={`sentiment-${sentiment.symbol}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" dir="ltr">{sentiment.symbol}</span>
                      <Badge variant="outline" className={cn("text-xs", config.color)}>
                        <SentimentIcon className="w-3 h-3 ml-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <span className={cn("text-sm font-bold", config.color)} dir="ltr">
                      {score > 0 && "+"}{score.toFixed(0)}
                    </span>
                  </div>
                  <Progress value={normalizedScore} className="h-1.5 mb-2" />
                  {sentiment.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {sentiment.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      ثقة: {confidence.toFixed(0)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {sentiment.createdAt && new Date(sentiment.createdAt).toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
