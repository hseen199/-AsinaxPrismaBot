import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/i18n";
import { PortfolioStats } from "@/components/asinax/portfolio-stats";
import { BotStatusCard } from "@/components/asinax/bot-status-card";
import { AIInsights } from "@/components/asinax/ai-insights";
import { TradeHistory } from "@/components/asinax/trade-history";
import { OpenPositions } from "@/components/asinax/open-positions";
import { TransactionsList } from "@/components/asinax/transactions-list";
import { DepositForm } from "@/components/asinax/deposit-form";
import { WithdrawalForm } from "@/components/asinax/withdrawal-form";
import { MarketTicker } from "@/components/market-ticker";
import { queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ArrowUpFromLine } from "lucide-react";
import { NeuralNetworkBg } from "@/components/neural-network-bg";
import type { 
  PortfolioHistory, 
  Trade, 
  MarketData, 
  Sentiment, 
  BotSettings,
  UserShares 
} from "@shared/schema";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

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

  const { data: trades = [], isLoading: loadingTrades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const { data: marketData = [], isLoading: loadingMarket } = useQuery<MarketData[]>({
    queryKey: ["/api/market"],
  });

  const { data: sentiments = [], isLoading: loadingSentiment } = useQuery<Sentiment[]>({
    queryKey: ["/api/sentiment"],
  });

  const { data: botSettings, isLoading: loadingBot } = useQuery<BotSettings>({
    queryKey: ["/api/bot/settings"],
  });

  const { data: userShares, isLoading: loadingShares } = useQuery<UserShares>({
    queryKey: ["/api/user/shares"],
  });

  const { data: poolStats } = useQuery<{ totalValue: number; totalShares: number; pricePerShare: number }>({
    queryKey: ["/api/pool/stats"],
  });

  return (
    <div className="p-4 md:p-6 space-y-6 relative">
      <NeuralNetworkBg nodeCount={8} className="opacity-20 fixed" />
      
      <div className="flex items-center justify-between gap-4 mb-2 relative z-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text-animate">
            {t.dashboard.title}
          </h1>
          <p className="text-muted-foreground text-sm">{t.dashboard.subtitle}</p>
        </div>
      </div>

      <MarketTicker marketData={marketData} isLoading={loadingMarket} />

      <PortfolioStats 
        shares={userShares || null} 
        isLoading={loadingShares}
        poolStats={poolStats}
        isAdmin={isAdmin}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OpenPositions marketData={marketData} isLoading={loadingMarket} />
          <TradeHistory trades={trades} isLoading={loadingTrades} />
        </div>
        
        <div className="space-y-6">
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="deposit" className="gap-2" data-testid="tab-deposit">
                <Wallet className="w-4 h-4" />
                {t.wallet.deposit}
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="gap-2" data-testid="tab-withdraw">
                <ArrowUpFromLine className="w-4 h-4" />
                {t.wallet.withdraw}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="deposit">
              <DepositForm />
            </TabsContent>
            <TabsContent value="withdraw">
              <WithdrawalForm shares={userShares || null} poolStats={poolStats} />
            </TabsContent>
          </Tabs>

          <BotStatusCard isActive={botSettings?.isActive ?? true} />
          
          <AIInsights sentiments={sentiments} isLoading={loadingSentiment} />
          
          <TransactionsList />
        </div>
      </div>
    </div>
  );
}
