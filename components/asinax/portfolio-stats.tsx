import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, PieChart } from "lucide-react";
import type { UserShares } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";
import { AnimatedCounter } from "@/components/animated-counter";

interface PortfolioStatsProps {
  shares: UserShares | null;
  isLoading: boolean;
  poolStats?: {
    totalValue: number;
    totalShares: number;
    pricePerShare: number;
  };
  isAdmin?: boolean;
}

export function PortfolioStats({ shares, isLoading, poolStats, isAdmin = false }: PortfolioStatsProps) {
  const { t } = useLanguage();
  const userShares = shares?.totalShares ? parseFloat(shares.totalShares) : 0;
  const totalDeposited = shares?.totalDeposited ? parseFloat(shares.totalDeposited) : 0;
  const sharePrice = poolStats?.pricePerShare || 1;
  const currentValue = userShares * sharePrice;
  const totalPnl = currentValue - totalDeposited;
  const pnlPercent = totalDeposited > 0 ? (totalPnl / totalDeposited) * 100 : 0;
  const poolShare = poolStats?.totalShares && poolStats.totalShares > 0 
    ? (userShares / poolStats.totalShares) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-4" />
            <div className="h-8 bg-muted rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="bg-card rounded-2xl p-6 border border-primary/20 relative overflow-hidden"
        data-testid="card-portfolio-value"
      >
        <div className="absolute top-0 left-0 p-4 opacity-10">
          <Wallet className="w-24 h-24 text-primary" />
        </div>
        <h3 className="text-muted-foreground text-sm mb-2">{t.wallet.currentValue}</h3>
        <p className="text-3xl font-bold text-foreground mb-2">
          <AnimatedCounter value={currentValue} prefix="$" decimals={2} />
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t.wallet.totalSharesCount}: <AnimatedCounter value={userShares} decimals={4} /></span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1, delay: 0.02 }}
        className="bg-card rounded-2xl p-6 border border-purple-500/20 relative overflow-hidden"
        data-testid="card-total-pnl"
      >
        <div className="absolute top-0 left-0 p-4 opacity-10">
          <TrendingUp className="w-24 h-24 text-purple-400" />
        </div>
        <h3 className="text-muted-foreground text-sm mb-2">{t.wallet.profitLoss}</h3>
        <div className="flex items-end gap-3 mb-2">
          <p className={`text-3xl font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <AnimatedCounter value={totalPnl} prefix={totalPnl >= 0 ? '+' : ''} decimals={2} />
          </p>
          <span className={`mb-1 text-sm font-semibold px-2 py-0.5 rounded ${totalPnl >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            <AnimatedCounter value={pnlPercent} decimals={2} suffix="%" />
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t.wallet.totalDeposited}: $<AnimatedCounter value={totalDeposited} decimals={0} /></p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1, delay: 0.04 }}
        className="bg-card rounded-2xl p-6 border border-pink-500/20 relative overflow-hidden"
        data-testid="card-pool-share"
      >
        <div className="absolute top-0 left-0 p-4 opacity-10">
          <PieChart className="w-24 h-24 text-pink-400" />
        </div>
        <h3 className="text-muted-foreground text-sm mb-2">{t.wallet.yourShareInFund}</h3>
        <p className="text-3xl font-bold text-foreground mb-2">
          <AnimatedCounter value={poolShare} decimals={4} suffix="%" />
        </p>
        {isAdmin && (
          <p className="text-sm text-muted-foreground">
            {t.wallet.totalDeposits}: $<AnimatedCounter value={poolStats?.totalValue || 0} decimals={0} />
          </p>
        )}
      </motion.div>
    </div>
  );
}
