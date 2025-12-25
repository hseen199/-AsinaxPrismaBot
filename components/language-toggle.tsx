import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
      data-testid="button-language-toggle"
    >
      <Languages className="h-5 w-5" />
      <span className="sr-only">{t.common.toggleLanguage}</span>
    </Button>
  );
}
