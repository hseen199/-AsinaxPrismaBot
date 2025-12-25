import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { MarketData } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";

interface MarketTickerProps {
  marketData: MarketData[];
  isLoading?: boolean;
}

export function MarketTicker({ marketData, isLoading }: MarketTickerProps) {
  const { t } = useLanguage();
  
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-w-[180px] animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-16 mb-2" />
              <div className="h-6 bg-muted rounded w-24 mb-1" />
              <div className="h-4 bg-muted rounded w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (marketData.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2" data-testid="market-ticker">
      {marketData.map((item, index) => {
        const changePercent = item.changePercent24h ? parseFloat(item.changePercent24h) : 0;
        const isPositive = changePercent > 0;
        const isNegative = changePercent < 0;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card 
              className="min-w-[180px] flex-shrink-0"
              data-testid={`ticker-${item.symbol}`}
            >
              <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" dir="ltr">{item.symbol}</span>
                <div className={cn(
                  "flex items-center gap-0.5 text-xs",
                  isPositive && "text-success",
                  isNegative && "text-destructive",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}>
                  {isPositive && <TrendingUp className="w-3 h-3" />}
                  {isNegative && <TrendingDown className="w-3 h-3" />}
                  <span dir="ltr">
                    {isPositive && "+"}
                    {changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
              <p className="text-xl font-bold" dir="ltr">
                ${parseFloat(item.price).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: item.price.includes(".") && item.price.split(".")[1].length > 2 ? 4 : 2,
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t.market.volume24h}: <span dir="ltr">${item.volume24h ? (parseFloat(item.volume24h) / 1000000).toFixed(2) : "0"}M</span>
              </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
