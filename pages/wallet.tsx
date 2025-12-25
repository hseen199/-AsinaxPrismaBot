import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Wallet, ArrowUpCircle, ArrowDownCircle, Copy, CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle, Check, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareCalculator } from "@/components/share-calculator";
import type { Transaction, UserShares } from "@shared/schema";

const TREASURY_WALLET = "TMJHBaXHyDzoVUy9DCsHNG8eLZDF52Ag7K";
const MIN_DEPOSIT = 100;
const MIN_WITHDRAWAL = 10;

export default function WalletPage() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTxHash, setDepositTxHash] = useState("");
  
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: transactions = [], isLoading: loadingTx } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
  });

  const { data: userShares, isLoading: loadingShares, refetch: refetchShares } = useQuery<UserShares>({
    queryKey: ["/api/user/shares"],
  });

  const userBalance = userShares ? parseFloat(userShares.currentValue || "0") : 0;

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: string; txHash: string }) => {
      const res = await apiRequest("POST", "/api/transactions", {
        type: "deposit",
        amount: data.amount,
        txHash: data.txHash,
        status: "pending",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || t.wallet.depositFailed);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t.wallet.depositRequestSent,
        description: t.wallet.depositReviewDesc,
      });
      setDepositAmount("");
      setDepositTxHash("");
      setIsDepositDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/shares"] });
    },
    onError: (error: Error) => {
      toast({
        title: t.common.error,
        description: error.message || t.wallet.depositFailed,
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: string; walletAddress: string }) => {
      const res = await apiRequest("POST", "/api/transactions", {
        type: "withdrawal",
        amount: data.amount,
        walletAddress: data.walletAddress,
        status: "pending",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || t.wallet.withdrawFailed);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t.wallet.withdrawRequestSent,
        description: t.wallet.withdrawProcessDesc,
      });
      setWithdrawAddress("");
      setWithdrawAmount("");
      setIsWithdrawDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/shares"] });
    },
    onError: (error: Error) => {
      toast({
        title: t.common.error,
        description: error.message || t.wallet.withdrawFailed,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(TREASURY_WALLET);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
    toast({
      description: t.wallet.addressCopied,
    });
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || !depositTxHash) {
      toast({
        title: t.common.error,
        description: t.wallet.fillAllFields,
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < MIN_DEPOSIT) {
      toast({
        title: t.common.error,
        description: `${t.wallet.minDepositError} ${MIN_DEPOSIT} USDT`,
        variant: "destructive",
      });
      return;
    }
    
    if (depositTxHash.length < 10) {
      toast({
        title: t.common.error,
        description: t.wallet.invalidTxHash,
        variant: "destructive",
      });
      return;
    }
    
    depositMutation.mutate({ amount: depositAmount, txHash: depositTxHash });
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !withdrawAddress) {
      toast({
        title: t.common.error,
        description: t.wallet.fillAllFields,
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
      toast({
        title: t.common.error,
        description: `${t.wallet.minWithdrawError} ${MIN_WITHDRAWAL} USDT`,
        variant: "destructive",
      });
      return;
    }
    
    if (amount > userBalance) {
      toast({
        title: t.common.error,
        description: `${t.wallet.insufficientBalance} $${formatNumber(userBalance)}`,
        variant: "destructive",
      });
      return;
    }
    
    if (!withdrawAddress.startsWith("T") || withdrawAddress.length < 30) {
      toast({
        title: t.common.error,
        description: t.wallet.invalidTrc20Address,
        variant: "destructive",
      });
      return;
    }
    
    withdrawMutation.mutate({ amount: withdrawAmount, walletAddress: withdrawAddress });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 ml-1" />{t.wallet.confirmed}</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 ml-1" />{t.wallet.pending}</Badge>;
      case "failed":
      case "cancelled":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 ml-1" />{t.wallet.failed}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatNumber = (value: string | number, decimals = 2) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: decimals });
  };

  const dateLocale = language === "ar" ? "ar-SA" : "en-US";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{t.wallet.title}</h1>
          <p className="text-muted-foreground text-sm">{t.wallet.subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchShares();
          }}
          data-testid="button-refresh-balance"
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          {t.wallet.refresh}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card data-testid="card-transactions">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{t.wallet.transactionHistory}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTx ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t.wallet.noTransactions}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 rounded-md bg-muted/50"
                      data-testid={`transaction-${tx.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-md",
                          tx.type === "deposit" ? "bg-success/10" : "bg-destructive/10"
                        )}>
                          {tx.type === "deposit" ? (
                            <ArrowUpCircle className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowDownCircle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.type === "deposit" ? t.wallet.deposit : t.wallet.withdraw}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString(dateLocale) : "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(tx.status)}
                        <span className={cn(
                          "font-bold",
                          tx.type === "deposit" ? "text-success" : "text-destructive"
                        )} dir="ltr">
                          {tx.type === "deposit" ? "+" : "-"}${formatNumber(tx.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card data-testid="card-user-share">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                {t.wallet.yourShareInFund}
              </CardTitle>
              <CardDescription>{t.wallet.yourShareInFundDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingShares ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : userShares ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <span className="text-sm text-muted-foreground">{t.wallet.totalDeposited}</span>
                      <span className="font-bold" dir="ltr" data-testid="text-total-deposited">
                        ${formatNumber(userShares.totalDeposited || "0")}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <span className="text-sm text-muted-foreground">{t.wallet.currentValue}</span>
                      <span className="font-bold text-lg" dir="ltr" data-testid="text-current-value">
                        ${formatNumber(userShares.currentValue || "0")}
                      </span>
                    </div>
                    
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-md",
                      parseFloat(userShares.profitLoss || "0") >= 0 
                        ? "bg-success/10" 
                        : "bg-destructive/10"
                    )}>
                      <div className="flex items-center gap-2">
                        {parseFloat(userShares.profitLoss || "0") >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                        <span className="text-sm text-muted-foreground">{t.wallet.profitLoss}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <span className={cn(
                          "font-bold",
                          parseFloat(userShares.profitLoss || "0") >= 0 
                            ? "text-success" 
                            : "text-destructive"
                        )} dir="ltr" data-testid="text-profit-loss">
                          {parseFloat(userShares.profitLoss || "0") >= 0 ? "+" : ""}
                          ${formatNumber(userShares.profitLoss || "0")}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            parseFloat(userShares.profitLossPercent || "0") >= 0 
                              ? "bg-success/10 text-success border-success/20" 
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          )}
                          data-testid="text-profit-loss-percent"
                        >
                          <span dir="ltr">
                            {parseFloat(userShares.profitLossPercent || "0") >= 0 ? "+" : ""}
                            {formatNumber(userShares.profitLossPercent || "0")}%
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t.wallet.totalSharesCount}</span>
                      <span dir="ltr" data-testid="text-total-shares">{formatNumber(userShares.totalShares || "0")}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <PieChart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t.wallet.noShares}</p>
                  <p className="text-xs mt-1">{t.wallet.startDeposit}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <ShareCalculator />

          <Card data-testid="card-actions">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{t.wallet.operations}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2" data-testid="button-deposit-open">
                    <ArrowUpCircle className="w-4 h-4" />
                    {t.wallet.deposit}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t.wallet.depositUsdt}</DialogTitle>
                    <DialogDescription>
                      {t.wallet.depositDesc}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDeposit} className="space-y-4 py-4">
                    <div className="p-4 bg-muted rounded-md space-y-3">
                      <Label className="text-sm text-muted-foreground">{t.wallet.centralWalletAddress}</Label>
                      <div className="flex items-center justify-between gap-2 bg-background p-3 rounded-md border">
                        <code className="text-sm font-mono text-primary truncate select-all" data-testid="text-treasury-address">
                          {TREASURY_WALLET}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={copyToClipboard}
                          data-testid="button-copy-address"
                        >
                          {copiedAddress ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-warning/10 rounded text-warning text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{t.wallet.trc20Warning}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t.wallet.amountUsdt}</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="1000"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
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

                    <div className="space-y-2">
                      <Label>{t.wallet.txHash}</Label>
                      <Input
                        type="text"
                        placeholder={t.wallet.txHashPlaceholder}
                        value={depositTxHash}
                        onChange={(e) => setDepositTxHash(e.target.value)}
                        className="font-mono text-sm"
                        required
                        data-testid="input-tx-hash"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={depositMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-deposit"
                    >
                      {depositMutation.isPending ? t.wallet.sending : t.wallet.confirmDeposit}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2" data-testid="button-withdraw-open">
                    <ArrowDownCircle className="w-4 h-4" />
                    {t.wallet.withdraw}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t.wallet.withdrawUsdt}</DialogTitle>
                    <DialogDescription>
                      {t.wallet.withdrawDesc}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleWithdraw} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t.wallet.walletAddressTrc20}</Label>
                      <Input
                        type="text"
                        placeholder={t.wallet.walletAddressPlaceholder}
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        className="font-mono text-sm"
                        required
                        data-testid="input-withdraw-address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t.wallet.amountUsdt}</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="100"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="pl-16"
                          min="10"
                          step="1"
                          required
                          data-testid="input-withdraw-amount"
                        />
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <span className="text-muted-foreground text-sm font-bold">USDT</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t.wallet.withdrawNote}
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={withdrawMutation.isPending}
                      className="w-full"
                      data-testid="button-confirm-withdraw"
                    >
                      {withdrawMutation.isPending ? t.wallet.sending : t.wallet.confirmWithdraw}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
