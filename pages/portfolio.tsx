import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPortfolio } from "@/components/user-portfolio";
import { TransactionsList } from "@/components/transactions-list";
import { PortfolioChart } from "@/components/portfolio-chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Wallet, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Coins, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserShares, Transaction, PortfolioHistory, MarketData, PortfolioNav } from "@shared/schema";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Portfolio() {
  const { data: userShares, isLoading: loadingShares } = useQuery<UserShares>({
    queryKey: ["/api/user/shares"],
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
  });

  const { data: portfolioHistory = [], isLoading: loadingHistory } = useQuery<PortfolioHistory[]>({
    queryKey: ["/api/portfolio/history"],
  });

  const { data: poolStats } = useQuery<{ totalValue: number; totalShares: number; pricePerShare: number }>({
    queryKey: ["/api/pool/stats"],
  });

  const { data: marketData = [] } = useQuery<MarketData[]>({
    queryKey: ["/api/market"],
  });

  const { data: navData } = useQuery<PortfolioNav>({
    queryKey: ["/api/portfolio/nav"],
  });

  const totalDeposited = userShares?.totalDeposited ? parseFloat(userShares.totalDeposited) : 0;
  const currentValue = userShares?.currentValue ? parseFloat(userShares.currentValue) : 0;
  const profitLoss = userShares?.profitLoss ? parseFloat(userShares.profitLoss) : 0;
  const profitLossPercent = userShares?.profitLossPercent ? parseFloat(userShares.profitLossPercent) : 0;
  const userSharesCount = userShares?.totalShares ? parseFloat(userShares.totalShares) : 0;

  const navPerShare = navData?.navPerShare ? parseFloat(navData.navPerShare) : 1;
  const totalEquity = navData?.totalEquityUsdt ? parseFloat(navData.totalEquityUsdt) : 0;
  const totalSharesOutstanding = navData?.totalSharesOutstanding ? parseFloat(navData.totalSharesOutstanding) : 0;

  const allocationData = marketData.slice(0, 5).map((item, index) => ({
    name: item.symbol,
    value: Math.random() * 30 + 10,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const totalDeposits = transactions
    .filter(t => t.type === "deposit" && t.status === "confirmed")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === "withdrawal" && t.status === "confirmed")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">المحفظة</h1>
          <p className="text-muted-foreground text-sm">تفاصيل استثماراتك وحصصك</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-deposited">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-primary/10">
                <ArrowUpCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيداعات</p>
                <p className="text-xl font-bold" dir="ltr">{formatCurrency(totalDeposits)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-withdrawals">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-destructive/10">
                <ArrowDownCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي السحوبات</p>
                <p className="text-xl font-bold" dir="ltr">{formatCurrency(totalWithdrawals)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-current-value">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-muted">
                <Wallet className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">القيمة الحالية</p>
                <p className="text-xl font-bold" dir="ltr">{formatCurrency(currentValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-profit-loss">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-md",
                profitLoss >= 0 ? "bg-success/10" : "bg-destructive/10"
              )}>
                {profitLoss >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الربح / الخسارة</p>
                <p className={cn(
                  "text-xl font-bold",
                  profitLoss >= 0 ? "text-success" : "text-destructive"
                )} dir="ltr">
                  {profitLoss >= 0 && "+"}{formatCurrency(profitLoss)}
                  <span className="text-sm font-normal mr-1">({profitLossPercent.toFixed(2)}%)</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-nav-info">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            معلومات صافي قيمة الأصول (NAV)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">سعر الحصة</p>
              <p className="text-lg font-bold" dir="ltr">{formatCurrency(navPerShare)}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">حصصك</p>
              <p className="text-lg font-bold" dir="ltr">{userSharesCount.toFixed(4)}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الحصص</p>
              <p className="text-lg font-bold" dir="ltr">{totalSharesOutstanding.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الأصول</p>
              <p className="text-lg font-bold" dir="ltr">{formatCurrency(totalEquity)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PortfolioChart data={portfolioHistory} isLoading={loadingHistory} />

          <Card data-testid="card-allocation">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">توزيع الأصول</CardTitle>
            </CardHeader>
            <CardContent>
              {allocationData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات متاحة
                </div>
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-popover-border rounded-md p-2 shadow-lg">
                                <p className="text-sm font-medium">{payload[0].name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(payload[0].value as number).toFixed(1)}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign="middle" 
                        align="left"
                        layout="vertical"
                        wrapperStyle={{ paddingRight: 20 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <UserPortfolio 
            shares={userShares || null} 
            isLoading={loadingShares}
            totalPoolValue={poolStats?.totalValue}
          />
          <TransactionsList transactions={transactions} isLoading={loadingTx} />
        </div>
      </div>
    </div>
  );
}
