import { Link } from "wouter";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBell() {
  const { unreadCount, connected } = useNotifications();

  return (
    <Link href="/notifications">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        data-testid="button-notifications"
      >
        <Bell className={`w-5 h-5 ${connected ? "" : "text-muted-foreground"}`} />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center"
            data-testid="badge-notification-count"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}
