import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Wallet,
  History,
  TrendingUp,
  Bot,
  PieChart,
  Bell,
  LogOut,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/lib/i18n";
import { AIThinkingPulse } from "@/components/ai-thinking-pulse";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t, dir } = useLanguage();

  const menuItems = [
    {
      title: t.nav.dashboard,
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: t.nav.wallet,
      url: "/wallet",
      icon: Wallet,
    },
    {
      title: t.nav.trades,
      url: "/trades",
      icon: History,
    },
    {
      title: t.nav.market,
      url: "/market",
      icon: TrendingUp,
    },
    {
      title: t.nav.aiAnalysis,
      url: "/ai-analysis",
      icon: Bot,
    },
    {
      title: t.nav.stats,
      url: "/stats",
      icon: PieChart,
    },
    {
      title: t.nav.notifications,
      url: "/notifications",
      icon: Bell,
    },
    {
      title: t.nav.ledger || "سجل المعاملات",
      url: "/ledger",
      icon: BookOpen,
    },
  ];

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "م";
  };

  return (
    <Sidebar side={dir === "rtl" ? "right" : "left"} collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border relative overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <img src="/favicon.png" alt="ASINAX Logo" className="w-10 h-10 rounded-xl object-cover logo-pulse glow-primary" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg gradient-text-animate">ASINAX</span>
              <AIThinkingPulse size="sm" isActive={true} />
            </div>
            <span className="text-xs text-muted-foreground">CRYPTO AI</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.common.mainMenu}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title} className="relative">
                    {isActive && (
                      <div className="absolute inset-y-1 start-0 w-1 bg-gradient-to-b from-primary via-purple-500 to-pink-500 rounded-full sidebar-active-glow" />
                    )}
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={isActive ? "sidebar-item-active" : "sidebar-item-hover"}
                    >
                      <Link href={item.url} data-testid={`link-${item.url.slice(1) || 'dashboard'}`}>
                        <item.icon className={`w-5 h-5 transition-all duration-200 ${isActive ? "text-primary" : ""}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="w-9 h-9">
            <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || t.common.user}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="group-data-[collapsible=icon]:hidden"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                window.location.href = "/login";
              } catch (e) {
                window.location.href = "/login";
              }
            }}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
