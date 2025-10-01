import { useEffect, useState } from "react";

export const OceanBackground = () => {
  const [bubbles, setBubbles] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    const newBubbles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 15 + Math.random() * 10,
      size: 10 + Math.random() * 30,
    }));
    setBubbles(newBubbles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 ocean-gradient" />
      
      {/* Light Rays */}
      <div className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-white/20 via-white/5 to-transparent opacity-30 blur-xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-0 left-1/2 w-24 h-full bg-gradient-to-b from-white/15 via-white/5 to-transparent opacity-30 blur-xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      <div className="absolute top-0 left-3/4 w-28 h-full bg-gradient-to-b from-white/20 via-white/5 to-transparent opacity-30 blur-xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      
      {/* Floating Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full bg-white/30 backdrop-blur-sm"
          style={{
            left: `${bubble.left}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            animation: `bubble-rise ${bubble.duration}s linear infinite`,
            animationDelay: `${bubble.delay}s`,
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.3)',
          }}
        />
      ))}
    </div>
  );
};
