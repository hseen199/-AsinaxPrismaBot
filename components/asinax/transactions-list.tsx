import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Clock, Check, X } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@shared/schema";

export function TransactionsList() {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Check className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
      case 'failed': return <X className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'مؤكد';
      case 'pending': return 'قيد المراجعة';
      case 'cancelled': return 'ملغي';
      case 'failed': return 'فشل';
      default: return status;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled':
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h2 className="text-xl font-bold text-foreground mb-6">سجل العمليات المالية</h2>
      
      <div className="space-y-3">
        {transactions.slice(0, 10).map((tx) => (
          <div 
            key={tx.id} 
            className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border"
            data-testid={`row-transaction-${tx.id}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === 'deposit' 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-orange-500/20 text-orange-500'
              }`}>
                {tx.type === 'deposit' ? (
                  <ArrowDownToLine className="w-5 h-5" />
                ) : (
                  <ArrowUpFromLine className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {tx.type === 'deposit' ? 'إيداع' : 'سحب'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tx.createdAt ? format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm', { locale: ar }) : '-'}
                </p>
              </div>
            </div>

            <div className="text-left">
              <p className={`font-bold ${tx.type === 'deposit' ? 'text-green-500' : 'text-orange-500'}`}>
                {tx.type === 'deposit' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}
              </p>
              <Badge variant={getStatusVariant(tx.status)} className="gap-1">
                {getStatusIcon(tx.status)}
                {getStatusLabel(tx.status)}
              </Badge>
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد عمليات مالية حتى الآن</p>
          </div>
        )}
      </div>
    </div>
  );
}
