import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import type { MarketData } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";

interface OpenPositionsProps {
  marketData: MarketData[];
  isLoading: boolean;
}

export function OpenPositions({ marketData, isLoading }: OpenPositionsProps) {
  const { t } = useLanguage();
  
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-primary/20 animate-pulse">
        <div className="h-6 bg-muted rounded w-40 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const positions = marketData.map(data => {
    const change = data.changePercent24h ? parseFloat(data.changePercent24h) : 0;
    return {
      pair: data.symbol,
      type: change >= 0 ? 'LONG' : 'SHORT',
      current: parseFloat(data.price),
      change24h: change,
      volume: data.volume24h ? parseFloat(data.volume24h) : 0,
      high: data.high24h ? parseFloat(data.high24h) : 0,
      low: data.low24h ? parseFloat(data.low24h) : 0,
      status: change >= 0 ? 'profit' : 'loss',
    };
  });

  return (
    <div className="bg-card rounded-2xl p-6 border border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t.trades.activeTrades}</h2>
      </div>
      
      <div className="space-y-4">
        {positions.slice(0, 4).map((position, index) => (
          <div
            key={index}
            className="bg-muted/50 rounded-xl p-4 border border-border hover:border-primary/30 transition-colors"
            data-testid={`card-position-${position.pair}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground">{position.pair}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  position.type === 'LONG' 
                    ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-500 border border-red-500/30'
                }`}>
                  {position.type === 'LONG' ? t.dashboard.bullish : t.dashboard.bearish}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {position.status === 'profit' ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-lg font-bold ${
                  position.status === 'profit' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {position.change24h >= 0 ? '+' : ''}{position.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">{t.market.price}</p>
                <p className="text-foreground font-semibold">${position.current.toLocaleString("en-US")}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t.market.high24h}</p>
                <p className="text-foreground font-semibold">${position.high.toLocaleString("en-US")}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t.market.low24h}</p>
                <p className="text-foreground font-semibold">${position.low.toLocaleString("en-US")}</p>
              </div>
            </div>
          </div>
        ))}

        {positions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t.common.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
}
