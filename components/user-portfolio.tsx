import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserShares } from "@shared/schema";

interface UserPortfolioProps {
  shares: UserShares | null;
  isLoading?: boolean;
  totalPoolValue?: number;
}

export function UserPortfolio({ shares, isLoading, totalPoolValue = 0 }: UserPortfolioProps) {
  const totalDeposited = shares?.totalDeposited ? parseFloat(shares.totalDeposited) : 0;
  const currentValue = shares?.currentValue ? parseFloat(shares.currentValue) : 0;
  const profitLoss = shares?.profitLoss ? parseFloat(shares.profitLoss) : 0;
  const profitLossPercent = shares?.profitLossPercent ? parseFloat(shares.profitLossPercent) : 0;
  const userShares = shares?.totalShares ? parseFloat(shares.totalShares) : 0;

  const poolPercentage = totalPoolValue > 0 ? (currentValue / totalPoolValue) * 100 : 0;
  const isProfit = profitLoss > 0;
  const isLoss = profitLoss < 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card data-testid="card-user-portfolio">
      <CardHeader className="flex flex-row items-center gap-2 pb-4">
        <Wallet className="w-5 h-5 text-primary" />
        <CardTitle className="text-lg">محفظتي</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-16 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center py-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground mb-1">القيمة الحالية</p>
              <p className="text-3xl font-bold" dir="ltr">{formatCurrency(currentValue)}</p>
              <div className={cn(
                "flex items-center justify-center gap-1 mt-2",
                isProfit && "text-success",
                isLoss && "text-destructive"
              )}>
                {isProfit && <TrendingUp className="w-4 h-4" />}
                {isLoss && <TrendingDown className="w-4 h-4" />}
                <span dir="ltr">
                  {isProfit && "+"}
                  {formatCurrency(profitLoss)} ({profitLossPercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المبلغ المودع</span>
                <span className="font-medium" dir="ltr">{formatCurrency(totalDeposited)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">عدد الحصص</span>
                <span className="font-medium" dir="ltr">{userShares.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">نسبتك من المحفظة</span>
                <span className="font-medium" dir="ltr">{poolPercentage.toFixed(2)}%</span>
              </div>
              <Progress value={poolPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button className="gap-2" data-testid="button-deposit">
                <ArrowUpCircle className="w-4 h-4" />
                إيداع
              </Button>
              <Button variant="outline" className="gap-2" data-testid="button-withdraw">
                <ArrowDownCircle className="w-4 h-4" />
                سحب
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
