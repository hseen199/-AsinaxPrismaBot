import { memo, useMemo } from "react";

interface ParticlesBackgroundProps {
  count?: number;
}

function ParticlesBackgroundComponent({ count = 30 }: ParticlesBackgroundProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 15}s`,
      animationDuration: `${15 + Math.random() * 10}s`,
      size: `${2 + Math.random() * 2}px`,
      opacity: 0.2 + Math.random() * 0.3,
    }));
  }, [count]);

  return (
    <div className="particles-bg">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: particle.left,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  );
}

export const ParticlesBackground = memo(ParticlesBackgroundComponent);
