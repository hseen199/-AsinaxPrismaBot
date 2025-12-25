import { memo } from "react";
import { motion } from "framer-motion";

interface AIThinkingPulseProps {
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function AIThinkingPulseComponent({ 
  isActive = true, 
  size = "md",
  className = "" 
}: AIThinkingPulseProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const ringCount = size === "sm" ? 2 : size === "md" ? 3 : 4;

  if (!isActive) return null;

  return (
    <div className={`ai-thinking-pulse ${sizeClasses[size]} ${className}`}>
      {Array.from({ length: ringCount }).map((_, i) => (
        <motion.div
          key={i}
          className="ai-ring"
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{
            scale: [0.5, 1.5, 0.5],
            opacity: [0.8, 0, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut",
          }}
        />
      ))}
      <motion.div 
        className="ai-core"
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 0 10px hsl(262, 83%, 58%)",
            "0 0 25px hsl(262, 83%, 58%)",
            "0 0 10px hsl(262, 83%, 58%)",
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export const AIThinkingPulse = memo(AIThinkingPulseComponent);
