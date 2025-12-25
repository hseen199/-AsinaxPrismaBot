import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowUpFromLine, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import type { UserShares } from "@shared/schema";

interface WithdrawalFormProps {
  shares: UserShares | null;
  poolStats?: {
    totalValue: number;
    totalShares: number;
    pricePerShare: number;
  };
}

export function WithdrawalForm({ shares, poolStats }: WithdrawalFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const userShares = shares?.totalShares ? parseFloat(shares.totalShares) : 0;
  const sharePrice = poolStats?.pricePerShare || 1;
  const maxWithdraw = userShares * sharePrice;
  const withdrawalFeePercent = 1.5;
  const requestedAmount = parseFloat(amount) || 0;
  const feeAmount = requestedAmount * (withdrawalFeePercent / 100);
  const netAmount = requestedAmount - feeAmount;

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: string; walletAddress: string }) => {
      return apiRequest("POST", "/api/transactions", {
        type: "withdrawal",
        amount: data.amount,
        walletAddress: data.walletAddress,
        status: "pending",
      });
    },
    onSuccess: () => {
      toast({
        title: t.wallet.withdrawRequestSent,
        description: t.wallet.withdrawProcessDesc,
      });
      setAmount("");
      setWalletAddress("");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/shares"] });
    },
    onError: () => {
      toast({
        title: t.common.error,
        description: t.wallet.withdrawFailed,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !walletAddress) return;
    
    const requestedAmount = parseFloat(amount);
    if (requestedAmount > maxWithdraw) {
      toast({
        title: t.components.withdraw.amountNotAvailable,
        description: `${t.components.withdraw.maxAvailable}: $${maxWithdraw.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }
    
    withdrawMutation.mutate({ amount, walletAddress });
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-orange-500/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 flex items-center justify-center">
          <ArrowUpFromLine className="w-5 h-5 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t.wallet.withdrawUsdt}</h2>
      </div>

      <div className="mb-6 p-4 bg-muted/50 rounded-xl border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground">{t.components.withdraw.availableToWithdraw}</span>
          <span className="font-bold text-foreground">${maxWithdraw.toFixed(2)}</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-background p-2 rounded-lg border border-border">
          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{t.wallet.withdrawNote}</p>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-orange-500">{t.wallet.withdrawFee}: {withdrawalFeePercent}%</span>
        </div>
      </div>

      {requestedAmount > 0 && (
        <div className="mb-4 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t.components.withdraw.requestedAmount}</span>
            <span className="font-medium">${requestedAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t.wallet.withdrawFee} ({withdrawalFeePercent}%)</span>
            <span className="text-orange-500">-${feeAmount.toFixed(2)}</span>
          </div>
          <div className="border-t border-orange-500/20 pt-2 mt-2 flex items-center justify-between">
            <span className="font-bold">{t.components.withdraw.netAmount}</span>
            <span className="font-bold text-green-500">${netAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t.wallet.amountUsdt}</label>
          <div className="relative">
            <Input 
              type="number" 
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-16"
              min="10"
              max={maxWithdraw}
              step="0.01"
              required
              data-testid="input-withdraw-amount"
            />
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="text-muted-foreground text-sm font-bold">USDT</span>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t.wallet.walletAddressTrc20}</label>
          <Input 
            type="text" 
            placeholder="T..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="font-mono text-sm"
            required
            data-testid="input-withdraw-address"
          />
        </div>

        <div className="flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{t.components.withdraw.walletWarning}</p>
        </div>

        <Button 
          type="submit" 
          variant="outline"
          disabled={withdrawMutation.isPending || maxWithdraw <= 0}
          className="w-full py-6 text-lg border-orange-500/50 text-orange-600 dark:text-orange-400"
          data-testid="button-confirm-withdraw"
        >
          {withdrawMutation.isPending ? t.wallet.sending : t.components.withdraw.requestWithdraw}
        </Button>
      </form>
    </div>
  );
}
