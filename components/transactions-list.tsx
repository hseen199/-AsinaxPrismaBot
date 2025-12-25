import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transaction } from "@shared/schema";

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const statusConfig = {
  pending: { label: "قيد الانتظار", icon: Clock, color: "text-warning" },
  confirmed: { label: "مؤكد", icon: CheckCircle, color: "text-success" },
  cancelled: { label: "ملغي", icon: XCircle, color: "text-destructive" },
};

export function TransactionsList({ transactions, isLoading }: TransactionsListProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ar-SA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(parseFloat(value));
  };

  return (
    <Card data-testid="card-transactions">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">سجل العمليات</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-24 mb-2" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
                <div className="h-5 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            لا توجد عمليات حتى الآن
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="p-4 space-y-3">
              {transactions.map((tx) => {
                const isDeposit = tx.type === "deposit";
                const status = statusConfig[tx.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover-elevate"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isDeposit ? "bg-success/20" : "bg-destructive/20"
                    )}>
                      {isDeposit ? (
                        <ArrowUpCircle className="w-5 h-5 text-success" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {isDeposit ? "إيداع" : "سحب"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className={cn(
                        "font-bold text-sm",
                        isDeposit ? "text-success" : "text-destructive"
                      )} dir="ltr">
                        {isDeposit ? "+" : "-"}{formatCurrency(tx.amount)}
                      </p>
                      <Badge variant="outline" className={cn("text-xs", status.color)}>
                        <StatusIcon className="w-3 h-3 ml-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
