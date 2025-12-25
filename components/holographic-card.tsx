import { memo, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

function HolographicCardComponent({ 
  children, 
  className = "",
  glowColor = "primary"
}: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    setTransform({ rotateX, rotateY });
    setGlowPosition({ 
      x: (x / rect.width) * 100, 
      y: (y / rect.height) * 100 
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform({ rotateX: 0, rotateY: 0 });
    setGlowPosition({ x: 50, y: 50 });
  }, []);

  const glowColors: Record<string, string> = {
    primary: "217, 91%, 50%",
    purple: "262, 83%, 58%",
    pink: "340, 82%, 52%",
    cyan: "180, 80%, 50%",
    emerald: "142, 76%, 45%",
  };

  const colorValue = glowColors[glowColor] || glowColors.primary;

  return (
    <div
      ref={cardRef}
      className={`holographic-card-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
      }}
    >
      <div
        className="holographic-glow"
        style={{
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, hsl(${colorValue} / 0.3) 0%, transparent 60%)`,
        }}
      />
      <Card className="holographic-card overflow-visible">
        <CardContent className="p-6 relative z-10">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export const HolographicCard = memo(HolographicCardComponent);
