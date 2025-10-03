import { useEffect, useRef, useState } from "react";

export const OceanBackground = () => {
  const [bubbles, setBubbles] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // No creature setup — this frame intentionally has no creatures.

  // Try to start video playback (mobile-safe)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = async () => {
      try {
        await v.play();
      } catch (_) {
        // ignore; user gesture may be required on some browsers
      }
    };
    // when can play, ensure it starts
    const onCanPlay = () => tryPlay();
    v.addEventListener('canplay', onCanPlay);
    tryPlay();
    return () => v.removeEventListener('canplay', onCanPlay);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/bg%20t%E1%BB%95ng?updatedAt=1759522141999"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      
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

      {/* No creature layers rendered here. */}

      {/* Local styles for ripple and any missing keyframes */}
      <style>{`
        @keyframes bubble-rise { 0% { transform: translateY(20vh); opacity: 0 } 10% { opacity: .5 } 100% { transform: translateY(-120vh); opacity: 0 } }
        .creature-ripple { position: absolute; width: 8px; height: 8px; border-radius: 9999px; pointer-events: none; background: radial-gradient(circle, rgba(255,255,255,.9), rgba(255,255,255,0) 60%); transform: translate(-50%, -50%); animation: ripple .6s ease-out forwards; filter: drop-shadow(0 0 10px rgba(255,255,255,.9)); }
        @keyframes ripple { from { opacity: .9; transform: translate(-50%, -50%) scale(.6) } to { opacity: 0; transform: translate(-50%, -50%) scale(6) } }
      `}</style>
    </div>
  );
};
