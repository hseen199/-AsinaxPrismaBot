import { memo } from "react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

function AnimatedCounterComponent({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  className = "",
  duration = 500,
}: AnimatedCounterProps) {
  const { displayValue, isUpdating } = useAnimatedCounter(value, {
    duration,
    decimals,
  });

  return (
    <span className={`counter-animate ${isUpdating ? "updating" : ""} ${className}`}>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export const AnimatedCounter = memo(AnimatedCounterComponent);
