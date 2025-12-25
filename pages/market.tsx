import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { queryClient } from "@/lib/queryClient";
import type { MarketData } from "@shared/schema";

export default function Market() {
  const { t } = useLanguage();
  const { data: marketData = [], isLoading, refetch, isFetching } = useQuery<MarketData[]>({
    queryKey: ["/api/market"],
  });

  useEffect(() => {
    const syncMarketData = async () => {
      try {
        await fetch("/api/mexc/sync-market", { method: "POST" });
        queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      } catch (error) {
        console.log("Market sync in progress...");
      }
    };
    
    syncMarketData();
    const interval = setInterval(syncMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num >= 1000) {
      return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return num.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  };

  const formatVolume = (volume: string | null) => {
    if (!volume) return "-";
    const num = parseFloat(volume);
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    }
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    }
    return `$${num.toLocaleString("en-US")}`;
  };

  const topGainers = [...marketData]
    .filter(m => m.changePercent24h && parseFloat(m.changePercent24h) > 0)
    .sort((a, b) => parseFloat(b.changePercent24h || "0") - parseFloat(a.changePercent24h || "0"))
    .slice(0, 5);

  const topLosers = [...marketData]
    .filter(m => m.changePercent24h && parseFloat(m.changePercent24h) < 0)
    .sort((a, b) => parseFloat(a.changePercent24h || "0") - parseFloat(b.changePercent24h || "0"))
    .slice(0, 5);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">{t.market.title}</h1>
          <p className="text-muted-foreground text-sm">{t.market.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <Clock className="w-3 h-3 ml-1" />
            {t.market.liveUpdate}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-market"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-top-gainers">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <TrendingUp className="w-5 h-5 text-success" />
            <CardTitle className="text-lg">{t.market.topGainers}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topGainers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {t.market.noDataAvailable}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topGainers.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4"
                    data-testid={`gainer-${item.symbol}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium" dir="ltr">{item.symbol}</p>
                        <p className="text-xs text-muted-foreground">{t.market.volume}: {formatVolume(item.volume24h)}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold" dir="ltr">${formatPrice(item.price)}</p>
                      <p className="text-sm text-success" dir="ltr">
                        +{parseFloat(item.changePercent24h || "0").toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-top-losers">
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <TrendingDown className="w-5 h-5 text-destructive" />
            <CardTitle className="text-lg">{t.market.topLosers}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topLosers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {t.market.noDataAvailable}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topLosers.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4"
                    data-testid={`loser-${item.symbol}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium" dir="ltr">{item.symbol}</p>
                        <p className="text-xs text-muted-foreground">{t.market.volume}: {formatVolume(item.volume24h)}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold" dir="ltr">${formatPrice(item.price)}</p>
                      <p className="text-sm text-destructive" dir="ltr">
                        {parseFloat(item.changePercent24h || "0").toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-all-markets">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t.market.allMarkets}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              {t.common.loading}
            </div>
          ) : marketData.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t.market.noDataAvailable}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">{t.market.pair}</TableHead>
                    <TableHead className="text-left">{t.market.price}</TableHead>
                    <TableHead className="text-left">{t.market.change24h}</TableHead>
                    <TableHead className="text-left">{t.market.high24h}</TableHead>
                    <TableHead className="text-left">{t.market.low24h}</TableHead>
                    <TableHead className="text-left">{t.market.volume24h}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketData.map((item) => {
                    const changePercent = item.changePercent24h ? parseFloat(item.changePercent24h) : 0;
                    const isPositive = changePercent > 0;
                    const isNegative = changePercent < 0;

                    return (
                      <TableRow key={item.id} data-testid={`row-market-${item.symbol}`}>
                        <TableCell className="font-medium" dir="ltr">
                          {item.symbol}
                        </TableCell>
                        <TableCell dir="ltr" className="font-mono">
                          ${formatPrice(item.price)}
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "flex items-center gap-1",
                            isPositive && "text-success",
                            isNegative && "text-destructive"
                          )}>
                            {isPositive && <TrendingUp className="w-3 h-3" />}
                            {isNegative && <TrendingDown className="w-3 h-3" />}
                            <span dir="ltr" className="font-mono">
                              {isPositive && "+"}
                              {changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell dir="ltr" className="font-mono text-muted-foreground">
                          ${item.high24h ? formatPrice(item.high24h) : "-"}
                        </TableCell>
                        <TableCell dir="ltr" className="font-mono text-muted-foreground">
                          ${item.low24h ? formatPrice(item.low24h) : "-"}
                        </TableCell>
                        <TableCell dir="ltr" className="text-muted-foreground">
                          {formatVolume(item.volume24h)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
