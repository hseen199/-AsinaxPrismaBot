const colors = [
  "#fbbf24", // amber
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#10b981", // emerald
  "#f97316", // orange
];

export function triggerConfetti(duration = 3000) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "9999";
  container.style.overflow = "hidden";
  document.body.appendChild(container);

  const pieces: HTMLDivElement[] = [];
  const pieceCount = 50;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.animationDuration = `${2 + Math.random() * 2}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    if (Math.random() > 0.5) {
      piece.style.borderRadius = "50%";
    }
    
    container.appendChild(piece);
    pieces.push(piece);
  }

  setTimeout(() => {
    container.remove();
  }, duration);
}
