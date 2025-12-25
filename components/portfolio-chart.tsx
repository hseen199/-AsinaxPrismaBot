import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useState } from "react";
import type { PortfolioHistory } from "@shared/schema";

interface PortfolioChartProps {
  data: PortfolioHistory[];
  isLoading?: boolean;
}

const timeRanges = [
  { label: "24س", value: "1d" },
  { label: "7أ", value: "7d" },
  { label: "30ي", value: "30d" },
  { label: "90ي", value: "90d" },
  { label: "سنة", value: "1y" },
];

export function PortfolioChart({ data, isLoading }: PortfolioChartProps) {
  const [selectedRange, setSelectedRange] = useState("7d");

  const chartData = data.map((item) => ({
    date: new Date(item.recordedAt!).toLocaleDateString("ar-SA", {
      month: "short",
      day: "numeric",
    }),
    value: parseFloat(item.totalValue),
    pricePerShare: parseFloat(item.pricePerShare),
  }));

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-popover-border rounded-md p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-lg font-bold" dir="ltr">
            {formatValue(payload[0].value)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            سعر الحصة: <span dir="ltr">${payload[0].payload.pricePerShare.toFixed(4)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card data-testid="card-portfolio-chart">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-lg">أداء المحفظة</CardTitle>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={selectedRange === range.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedRange(range.value)}
              data-testid={`button-range-${range.value}`}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">لا توجد بيانات متاحة</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                className="fill-muted-foreground"
                orientation="left"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
