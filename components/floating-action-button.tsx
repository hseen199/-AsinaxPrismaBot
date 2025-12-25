import { memo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function FloatingActionButtonComponent() {
  const { t, dir } = useLanguage();
  
  return (
    <div className={`fixed bottom-6 ${dir === "rtl" ? "left-6" : "right-6"} z-50`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/wallet">
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg float-animation bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              data-testid="button-fab-deposit"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side={dir === "rtl" ? "right" : "left"} className="tooltip-enhanced">
          {t.wallet.deposit}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export const FloatingActionButton = memo(FloatingActionButtonComponent);
