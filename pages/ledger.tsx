import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, ArrowUpCircle, ArrowDownCircle, RefreshCw, TrendingUp, TrendingDown, Coins } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { LedgerEntry } from "@shared/schema";

const creditTypes = ["DEPOSIT", "PNL_ALLOCATION", "ADJUSTMENT"];
const debitTypes = ["WITHDRAWAL", "FEE", "SHARE_BURN"];

const entryTypeLabels: Record<string, { label: string; icon: typeof ArrowUpCircle; color: string }> = {
  DEPOSIT: { label: "إيداع", icon: ArrowUpCircle, color: "text-success" },
  WITHDRAWAL: { label: "سحب", icon: ArrowDownCircle, color: "text-destructive" },
  FEE: { label: "رسوم", icon: Coins, color: "text-muted-foreground" },
  PNL_ALLOCATION: { label: "توزيع أرباح", icon: TrendingUp, color: "text-success" },
  ADJUSTMENT: { label: "تعديل", icon: RefreshCw, color: "text-muted-foreground" },
  SHARE_ISSUE: { label: "إصدار حصص", icon: TrendingUp, color: "text-primary" },
  SHARE_BURN: { label: "استهلاك حصص", icon: TrendingDown, color: "text-warning" },
};

export default function Ledger() {
  const { data: ledgerEntries = [], isLoading } = useQuery<LedgerEntry[]>({
    queryKey: ["/api/user/ledger"],
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const totalCredits = ledgerEntries
    .filter(e => creditTypes.includes(e.entryType))
    .reduce((sum, e) => sum + parseFloat(e.amountUsdt), 0);

  const totalDebits = ledgerEntries
    .filter(e => debitTypes.includes(e.entryType))
    .reduce((sum, e) => sum + parseFloat(e.amountUsdt), 0);

  const netBalance = totalCredits - totalDebits;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            سجل المعاملات
          </h1>
          <p className="text-muted-foreground text-sm">جميع حركاتك المالية في مكان واحد</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-total-credits">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-success/10">
                <ArrowUpCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإضافات</p>
                <p className="text-xl font-bold text-success" dir="ltr">+{formatCurrency(totalCredits)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-debits">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-destructive/10">
                <ArrowDownCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
                <p className="text-xl font-bold text-destructive" dir="ltr">-{formatCurrency(totalDebits)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-net-balance">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-md bg-primary/10">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">صافي الحركات</p>
                <p className={cn("text-xl font-bold", netBalance >= 0 ? "text-success" : "text-destructive")} dir="ltr">
                  {netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-ledger-entries">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">سجل الحركات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : ledgerEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد حركات مالية بعد</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {ledgerEntries.map((entry) => {
                  const typeInfo = entryTypeLabels[entry.entryType] || { 
                    label: entry.entryType, 
                    icon: RefreshCw, 
                    color: "text-muted-foreground" 
                  };
                  const Icon = typeInfo.icon;
                  const isCredit = creditTypes.includes(entry.entryType);
                  const amount = parseFloat(entry.amountUsdt);

                  return (
                    <div 
                      key={entry.id} 
                      className="flex items-center justify-between p-4 rounded-md bg-muted/30 hover-elevate"
                      data-testid={`ledger-entry-${entry.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-md bg-muted", typeInfo.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{typeInfo.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.description || entry.referenceType || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.createdAt ? format(new Date(entry.createdAt), "dd MMM yyyy HH:mm", { locale: ar }) : "-"}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={cn(
                          "font-bold",
                          isCredit ? "text-success" : "text-destructive"
                        )} dir="ltr">
                          {isCredit ? "+" : "-"}{formatCurrency(amount)}
                        </p>
                        {entry.sharesAffected && parseFloat(entry.sharesAffected) !== 0 && (
                          <p className="text-xs text-muted-foreground" dir="ltr">
                            {parseFloat(entry.sharesAffected).toFixed(4)} حصص
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
