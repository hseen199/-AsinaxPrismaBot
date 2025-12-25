import { Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { AIThinkingPulse } from "@/components/ai-thinking-pulse";

interface BotStatusCardProps {
  isActive?: boolean;
}

export function BotStatusCard({ isActive = true }: BotStatusCardProps) {
  const { t } = useLanguage();
  
  return (
    <div className="bg-card rounded-2xl p-6 border border-purple-500/20 relative overflow-visible flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center icon-glow">
          <Zap className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-foreground">{t.dashboard.botStatus}</h3>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4 py-4">
        <div className="relative">
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <AIThinkingPulse size="lg" isActive={isActive} />
            </div>
          )}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 relative z-10 ${
            isActive ? 'border-green-500/30 bg-green-500/10 glow-primary' : 'border-muted/30 bg-muted/10'
          }`}>
            <Zap className={`w-10 h-10 ${isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
          </div>
        </div>
        
        <div>
          <h4 className={`text-2xl font-bold ${isActive ? 'text-green-500 glow-text' : 'text-muted-foreground'}`}>
            {isActive ? t.dashboard.botActive : t.dashboard.botPaused}
          </h4>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            {isActive 
              ? t.components.botStatus.activeDesc 
              : t.components.botStatus.inactiveDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
