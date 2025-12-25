import { memo, useMemo, useEffect, useState } from "react";

interface Node {
  id: number;
  x: number;
  y: number;
  size: number;
  pulseDelay: number;
  connections: number[];
}

interface NeuralNetworkBgProps {
  nodeCount?: number;
  className?: string;
}

function NeuralNetworkBgComponent({ nodeCount = 15, className = "" }: NeuralNetworkBgProps) {
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const nodes = useMemo(() => {
    const generatedNodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      generatedNodes.push({
        id: i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 3 + Math.random() * 4,
        pulseDelay: Math.random() * 3,
        connections: [],
      });
    }

    generatedNodes.forEach((node, i) => {
      const connectionCount = 1 + Math.floor(Math.random() * 2);
      const possibleConnections = generatedNodes
        .filter((n) => n.id !== node.id)
        .sort((a, b) => {
          const distA = Math.hypot(a.x - node.x, a.y - node.y);
          const distB = Math.hypot(b.x - node.x, b.y - node.y);
          return distA - distB;
        })
        .slice(0, 4);

      for (let j = 0; j < connectionCount && j < possibleConnections.length; j++) {
        if (!node.connections.includes(possibleConnections[j].id)) {
          node.connections.push(possibleConnections[j].id);
        }
      }
    });

    return generatedNodes;
  }, [nodeCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode(Math.floor(Math.random() * nodeCount));
      setTimeout(() => setActiveNode(null), 800);
    }, 2000);
    return () => clearInterval(interval);
  }, [nodeCount]);

  return (
    <div className={`neural-network-bg ${className}`}>
      <svg className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(217, 91%, 50%)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(262, 83%, 58%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(217, 91%, 50%)" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="hsl(262, 83%, 68%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {nodes.map((node) =>
          node.connections.map((targetId) => {
            const target = nodes.find((n) => n.id === targetId);
            if (!target) return null;
            const isActive = activeNode === node.id || activeNode === targetId;
            return (
              <line
                key={`${node.id}-${targetId}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke={isActive ? "url(#activeGradient)" : "url(#connectionGradient)"}
                strokeWidth={isActive ? 2 : 1}
                className={`neural-connection ${isActive ? "active" : ""}`}
                filter={isActive ? "url(#glow)" : undefined}
              />
            );
          })
        )}

        {nodes.map((node) => {
          const isActive = activeNode === node.id;
          return (
            <g key={node.id}>
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={isActive ? node.size * 2 : node.size * 1.5}
                className="neural-node-glow"
                fill={isActive ? "hsl(262, 83%, 58%)" : "hsl(217, 91%, 50%)"}
                opacity={isActive ? 0.4 : 0.15}
                filter="url(#glow)"
              />
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={node.size}
                className={`neural-node ${isActive ? "active" : ""}`}
                fill={isActive ? "hsl(262, 83%, 68%)" : "hsl(217, 91%, 60%)"}
                style={{ animationDelay: `${node.pulseDelay}s` }}
              />
            </g>
          );
        })}
      </svg>

      <div className="data-streams">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="data-stream"
            style={{
              left: `${15 + i * 18}%`,
              animationDelay: `${i * 0.5}s`,
              height: `${30 + Math.random() * 40}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const NeuralNetworkBg = memo(NeuralNetworkBgComponent);
