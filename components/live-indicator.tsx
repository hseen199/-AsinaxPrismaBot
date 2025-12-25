import { memo } from "react";
import { useLanguage } from "@/lib/i18n";

interface LiveIndicatorProps {
  isConnected?: boolean;
}

function LiveIndicatorComponent({ isConnected = true }: LiveIndicatorProps) {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="relative flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        {isConnected && (
          <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping" />
        )}
        <span className="text-muted-foreground">
          {isConnected ? t.notifications.connected : t.notifications.disconnected}
        </span>
      </div>
    </div>
  );
}

export const LiveIndicator = memo(LiveIndicatorComponent);
