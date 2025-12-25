import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Wallet, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import { triggerConfetti } from "@/lib/confetti";

const TREASURY_WALLET = "TMJHBaXHyDzoVUy9DCsHNG8eLZDF52Ag7K";

export function DepositForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: string; txHash: string }) => {
      return apiRequest("POST", "/api/transactions", {
        type: "deposit",
        amount: data.amount,
        txHash: data.txHash,
        status: "pending",
      });
    },
    onSuccess: () => {
      triggerConfetti();
      toast({
        title: t.wallet.depositRequestSent,
        description: t.wallet.depositReviewDesc,
      });
      setAmount("");
      setTxHash("");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/shares"] });
    },
    onError: () => {
      toast({
        title: t.common.error,
        description: t.wallet.depositFailed,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(TREASURY_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ description: t.wallet.addressCopied });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !txHash) return;
    depositMutation.mutate({ amount, txHash });
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-primary/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t.wallet.depositUsdt}</h2>
      </div>

      <div className="mb-6 p-4 bg-muted/50 rounded-xl border border-border">
        <label className="text-sm text-muted-foreground mb-2 block">{t.wallet.centralWalletAddress}</label>
        <div className="flex items-center justify-between gap-2 bg-background p-3 rounded-lg border border-border">
          <code className="text-primary text-sm truncate font-mono select-all" data-testid="text-wallet-address">{TREASURY_WALLET}</code>
          <Button size="icon" variant="ghost" onClick={copyToClipboard} className="shrink-0" data-testid="button-copy-address">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{t.wallet.trc20Warning}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t.wallet.amountUsdt}</label>
          <div className="relative">
            <Input 
              type="number" 
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-16"
              min="100"
              step="1"
              required
              data-testid="input-deposit-amount"
            />
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="text-muted-foreground text-sm font-bold">USDT</span>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t.wallet.txHash}</label>
          <Input 
            type="text" 
            placeholder="0x..."
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            className="font-mono text-sm"
            required
            data-testid="input-tx-hash"
          />
        </div>

        <Button 
          type="submit" 
          disabled={depositMutation.isPending}
          className="w-full py-6 text-lg"
          data-testid="button-confirm-deposit"
        >
          {depositMutation.isPending ? t.wallet.sending : t.wallet.confirmDeposit}
        </Button>
      </form>
    </div>
  );
}
