import { History, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { Trade } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";

interface TradeHistoryProps {
  trades: Trade[];
  isLoading: boolean;
}

export function TradeHistory({ trades, isLoading }: TradeHistoryProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === "ar" ? ar : enUS;
  
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-primary/20 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-muted" />
          <div className="h-6 bg-muted rounded w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/20 border border-primary/30 flex items-center justify-center">
          <History className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t.trades.tradeHistory}</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full" data-testid="table-trades">
          <thead>
            <tr className="border-b border-border">
              <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">{t.trades.symbol}</th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">{t.trades.side}</th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">{t.market.price}</th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">{t.trades.quantity}</th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">{t.trades.pnl}</th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">{t.trades.openTime}</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 10).map((trade) => {
              const pnl = trade.profitLoss ? parseFloat(trade.profitLoss) : 0;
              const isProfit = pnl >= 0;
              
              return (
                <tr key={trade.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors" data-testid={`row-trade-${trade.id}`}>
                  <td className="py-3 px-2">
                    <span className="text-foreground font-semibold">{trade.pair}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      trade.type === 'buy' 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {trade.type === 'buy' ? t.trades.buy : t.trades.sell}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">${parseFloat(trade.price).toLocaleString()}</td>
                  <td className="py-3 px-2 text-muted-foreground">{parseFloat(trade.amount).toFixed(4)}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {isProfit ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <p className={`text-sm font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                          {isProfit ? '+' : ''}{pnl.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground text-sm">
                    {trade.createdAt ? format(new Date(trade.createdAt), 'MMM dd, HH:mm', { locale: dateLocale }) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {trades.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t.common.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
}
