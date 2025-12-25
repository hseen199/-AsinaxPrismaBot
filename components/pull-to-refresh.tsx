import { memo, ReactNode, forwardRef } from "react";
import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

function PullToRefreshComponent({ children, onRefresh, className = "" }: PullToRefreshProps) {
  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh,
    threshold: 80,
  });

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-200 z-10"
        style={{
          top: Math.max(pullDistance - 40, -40),
          opacity: progress,
        }}
      >
        <div
          className={`w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center ${
            isRefreshing ? "animate-spin" : ""
          }`}
          style={{
            transform: `rotate(${progress * 360}deg)`,
          }}
        >
          <RefreshCw className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? "transform 0.2s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const PullToRefresh = memo(PullToRefreshComponent);
