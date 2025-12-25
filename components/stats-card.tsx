import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  testId?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "text-primary",
  testId,
}: StatsCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <Card className="overflow-visible" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold tracking-tight" dir="ltr">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive && (
                  <TrendingUp className="w-4 h-4 text-success" />
                )}
                {isNegative && (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                {isNeutral && (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    isPositive && "text-success",
                    isNegative && "text-destructive",
                    isNeutral && "text-muted-foreground"
                  )}
                  dir="ltr"
                >
                  {isPositive && "+"}
                  {change.toFixed(2)}%
                </span>
                {changeLabel && (
                  <span className="text-xs text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-md bg-muted", iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
