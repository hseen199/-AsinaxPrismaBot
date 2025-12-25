import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, DollarSign, PieChart } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";

interface PortfolioData {
  totalValue: string;
  pricePerShare: string;
}

export function ShareCalculator() {
  const { t, language } = useLanguage();
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [monthlyReturnRate, setMonthlyReturnRate] = useState<number>(5);
  const [holdingMonths, setHoldingMonths] = useState<number>(12);

  const { data: portfolioData } = useQuery<PortfolioData>({
    queryKey: ["/api/portfolio/current"],
  });

  const pricePerShare = portfolioData ? parseFloat(portfolioData.pricePerShare || "1") : 1;

  const calculations = useMemo(() => {
    const sharesToBuy = depositAmount / pricePerShare;
    const monthlyRate = monthlyReturnRate / 100;
    const futureValue = depositAmount * Math.pow(1 + monthlyRate, holdingMonths);
    const totalProfit = futureValue - depositAmount;
    const totalReturnPercent = ((futureValue - depositAmount) / depositAmount) * 100;
    
    return {
      sharesToBuy,
      futureValue,
      totalProfit,
      totalReturnPercent,
    };
  }, [depositAmount, pricePerShare, monthlyReturnRate, holdingMonths]);

  const formatNumber = (value: number, decimals = 2) => {
    return value.toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const calcLabels = language === "ar" ? {
    title: "حاسبة الحصص",
    description: "احسب قيمة استثمارك المتوقعة",
    depositAmount: "مبلغ الإيداع (USDT)",
    monthlyReturn: "معدل العائد الشهري المتوقع",
    holdingPeriod: "فترة الاستثمار (أشهر)",
    sharesToBuy: "عدد الحصص المتوقعة",
    futureValue: "القيمة المتوقعة",
    totalProfit: "الربح المتوقع",
    totalReturn: "العائد الإجمالي",
    months: "شهر",
    disclaimer: "هذه تقديرات تقريبية. الأرباح الفعلية قد تختلف.",
  } : {
    title: "Share Calculator",
    description: "Calculate your expected investment value",
    depositAmount: "Deposit Amount (USDT)",
    monthlyReturn: "Expected Monthly Return",
    holdingPeriod: "Holding Period (months)",
    sharesToBuy: "Expected Shares",
    futureValue: "Expected Value",
    totalProfit: "Expected Profit",
    totalReturn: "Total Return",
    months: "months",
    disclaimer: "These are estimates. Actual returns may vary.",
  };

  return (
    <Card data-testid="card-share-calculator">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          {calcLabels.title}
        </CardTitle>
        <CardDescription>{calcLabels.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>{calcLabels.depositAmount}</span>
              <span className="font-bold text-primary" dir="ltr">${formatNumber(depositAmount, 0)}</span>
            </Label>
            <Slider
              value={[depositAmount]}
              onValueChange={(v) => setDepositAmount(v[0])}
              min={100}
              max={100000}
              step={100}
              data-testid="slider-deposit-amount"
            />
            <Input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Math.max(100, Number(e.target.value)))}
              className="mt-2"
              min={100}
              data-testid="input-calc-deposit"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>{calcLabels.monthlyReturn}</span>
              <span className="font-bold text-success" dir="ltr">{monthlyReturnRate}%</span>
            </Label>
            <Slider
              value={[monthlyReturnRate]}
              onValueChange={(v) => setMonthlyReturnRate(v[0])}
              min={1}
              max={80}
              step={0.5}
              data-testid="slider-monthly-return"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>{calcLabels.holdingPeriod}</span>
              <span className="font-bold" dir="ltr">{holdingMonths} {calcLabels.months}</span>
            </Label>
            <Slider
              value={[holdingMonths]}
              onValueChange={(v) => setHoldingMonths(v[0])}
              min={1}
              max={36}
              step={1}
              data-testid="slider-holding-months"
            />
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{calcLabels.sharesToBuy}</span>
            </div>
            <span className="font-bold" dir="ltr" data-testid="text-calc-shares">
              {formatNumber(calculations.sharesToBuy, 4)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{calcLabels.futureValue}</span>
            </div>
            <span className="font-bold text-lg" dir="ltr" data-testid="text-calc-future-value">
              ${formatNumber(calculations.futureValue)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-md bg-success/10">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">{calcLabels.totalProfit}</span>
            </div>
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="font-bold text-success" dir="ltr" data-testid="text-calc-profit">
                +${formatNumber(calculations.totalProfit)}
              </span>
              <span className="text-xs text-success" dir="ltr">
                (+{formatNumber(calculations.totalReturnPercent)}%)
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {calcLabels.disclaimer}
        </p>
      </CardContent>
    </Card>
  );
}
