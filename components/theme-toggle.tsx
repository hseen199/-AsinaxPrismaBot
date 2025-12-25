import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      data-testid="button-theme-toggle"
      className="relative overflow-visible"
    >
      <Sun className="h-5 w-5 theme-toggle-icon theme-toggle-sun" />
      <Moon className="h-5 w-5 theme-toggle-icon theme-toggle-moon" />
      <span className="sr-only">تبديل المظهر</span>
    </Button>
  );
}
