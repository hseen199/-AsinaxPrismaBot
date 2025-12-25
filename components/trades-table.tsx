import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Trade } from "@shared/schema";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Brain, Info } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TradesTableProps {
  trades: Trade[];
  isLoading?: boolean;
  showAll?: boolean;
}

export function TradesTable({ trades, isLoading, showAll = false }: TradesTableProps) {
  const { t, language } = useLanguage();
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  
  const toggleExpanded = (tradeId: string) => {
    setExpandedTradeId(prev => prev === tradeId ? null : tradeId);
  };
  
  const strategyLabels: Record<string, string> = {
    RSI: t.trades.strategyRsi,
    MACD: t.trades.strategyMacd,
    AI_SENTIMENT: t.trades.strategyAiSentiment,
    MOVING_AVERAGES: t.trades.strategyMovingAverages,
    MANUAL: t.trades.strategyManual,
  };
  const displayedTrades = showAll ? trades : trades.slice(0, 5);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (value: string | null, decimals = 2) => {
    if (!value) return "-";
    return parseFloat(value).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <Card data-testid="card-trades-table">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <CardTitle className="text-lg">{t.dashboard.recentTrades}</CardTitle>
        {!showAll && trades.length > 5 && (
          <Badge variant="secondary" className="text-xs">
            {trades.length} {t.trades.tradeCount}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            {t.common.loading}
          </div>
        ) : displayedTrades.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {t.common.noData}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t.wallet.date}</TableHead>
                  <TableHead className="text-right">{t.trades.symbol}</TableHead>
                  <TableHead className="text-right">{t.trades.side}</TableHead>
                  <TableHead className="text-left">{t.trades.quantity}</TableHead>
                  <TableHead className="text-left">{t.market.price}</TableHead>
                  <TableHead className="text-left">{t.wallet.amount}</TableHead>
                  <TableHead className="text-left">{t.trades.pnl}</TableHead>
                  <TableHead className="text-right">{t.trades.strategy}</TableHead>
                  <TableHead className="text-center w-10">{t.trades.tradeReason}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedTrades.map((trade) => {
                  const profitLoss = trade.profitLoss ? parseFloat(trade.profitLoss) : 0;
                  const isProfit = profitLoss > 0;
                  const isLoss = profitLoss < 0;
                  const isExpanded = expandedTradeId === trade.id;
                  const hasReason = trade.aiReason && trade.aiReason.trim().length > 0;

                  return (
                    <>
                      <TableRow key={trade.id} data-testid={`row-trade-${trade.id}`} className={cn(isExpanded && "border-b-0")}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(trade.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium" dir="ltr">
                          {trade.pair}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={trade.type === "buy" ? "default" : "secondary"}
                            className={cn(
                              trade.type === "buy" 
                                ? "bg-success/20 text-success border-success/30" 
                                : "bg-destructive/20 text-destructive border-destructive/30"
                            )}
                          >
                            {trade.type === "buy" ? t.trades.buy : t.trades.sell}
                          </Badge>
                        </TableCell>
                        <TableCell dir="ltr" className="font-mono text-sm">
                          {formatNumber(trade.amount, 6)}
                        </TableCell>
                        <TableCell dir="ltr" className="font-mono text-sm">
                          ${formatNumber(trade.price)}
                        </TableCell>
                        <TableCell dir="ltr" className="font-mono text-sm">
                          ${formatNumber(trade.total)}
                        </TableCell>
                        <TableCell>
                          {trade.profitLoss && (
                            <div className={cn(
                              "flex items-center gap-1",
                              isProfit && "text-success",
                              isLoss && "text-destructive"
                            )}>
                              {isProfit && <TrendingUp className="w-3 h-3" />}
                              {isLoss && <TrendingDown className="w-3 h-3" />}
                              <span dir="ltr" className="font-mono text-sm">
                                {isProfit && "+"}${formatNumber(trade.profitLoss)}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {strategyLabels[trade.strategy || ""] || trade.strategy || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {hasReason ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleExpanded(trade.id)}
                              data-testid={`button-expand-reason-${trade.id}`}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-muted-foreground mx-auto" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t.trades.noReasonAvailable}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasReason && (
                        <TableRow key={`${trade.id}-reason`} className="bg-muted/30">
                          <TableCell colSpan={9} className="py-3">
                            <div className="flex items-start gap-3 px-2">
                              <div className="p-2 rounded-md bg-primary/10 shrink-0">
                                <Brain className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-1">
                                  {t.trades.aiExplanation}
                                </p>
                                <p className="text-sm leading-relaxed">
                                  {trade.aiReason}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
