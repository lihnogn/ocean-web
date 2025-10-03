import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useStars } from "@/state/StarsContext";
import { OceanBackground } from "@/components/OceanBackground";
import { toast } from "sonner";

type GameKey = "game1" | "game2" | "game3";

const GAME_META: Record<
  GameKey,
  { title: string; description: string; gradient: string; accent: string }
> = {
  game1: {
    title: "Match the Ocean",
    description: "Drag and drop sea creatures into their matching silhouettes.",
    gradient: "from-sky-200/70 via-cyan-200/70 to-emerald-200/70",
    accent: "shadow-sky-400/50",
  },
  game2: {
    title: "Dodge the Hunter",
    description: "Auto-run and avoid obstacles while collecting lucky stars.",
    gradient: "from-teal-200/70 via-cyan-200/70 to-sky-200/70",
    accent: "shadow-teal-400/50",
  },
  game3: {
    title: "Ocean Word Hunt",
    description:
      "Dive into ocean currents! Find missing letters in 15 ocean words by clicking floating treasures. Complete each word to earn Lucky Stars!",
    gradient: "from-teal-200/70 via-cyan-200/70 to-sky-200/70",
    accent: "shadow-teal-400/50",
  },
};

const Games = () => {
  const { stars, addStars: addStarsGlobal } = useStars();
  const [activeGame, setActiveGame] = useState<GameKey | null>(null);
  const [showTutorial, setShowTutorial] = useState<GameKey | null>(null);
  const [sparkles, setSparkles] = useState<
    { id: number; x: number; y: number; hue: number }[]
  >([]);
  const sparkleId = useRef(0);

  const addStars = useCallback((n: number, x?: number, y?: number) => {
    addStarsGlobal(n);
    // particle sparkle near optional coordinates
    const particles = Array.from({ length: Math.min(12, 4 * n) }).map(() => ({
      id: sparkleId.current++,
      x: (x ?? window.innerWidth / 2) + (Math.random() * 60 - 30),
      y: (y ?? 100) + (Math.random() * 40 - 20),
      hue: 180 + Math.floor(Math.random() * 60),
    }));
    setSparkles((prev) => [...prev, ...particles]);
    setTimeout(() => {
      setSparkles((prev) => prev.slice(particles.length));
    }, 900);
  }, [addStarsGlobal]);

  const loadGame = useCallback((key: GameKey) => {
    // show tutorial first
    setShowTutorial(key);
  }, []);

  // background subtle bubbles overlay (CSS only via Tailwind and inline keyframes)

  return (
    <div className="min-h-screen relative overflow-hidden">
      <OceanBackground />
      <Navbar />

      {/* Floating bubbles overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white/10 blur-[2px] animate-float-slow"
            style={{
              width: `${8 + Math.random() * 18}px`,
              height: `${8 + Math.random() * 18}px`,
              left: `${Math.random() * 100}%`,
              bottom: `-${Math.random() * 30}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${10 + Math.random() * 12}s`,
            }}
          />
        ))}
        {/* soft light rays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),rgba(255,255,255,0)_60%)] mix-blend-screen -slow" />
      </div>

      {/* Sparkle particles on star gain */}
      <div className="pointer-events-none absolute inset-0 z-[35]">
        {sparkles.map((p) => (
          <span
            key={p.id}
            className="absolute w-1.5 h-1.5 rounded-full animate-sparkle"
            style={{
              left: p.x,
              top: p.y,
              background: `conic-gradient(from 0deg, hsl(${p.hue} 90% 80%), transparent 60%)`,
              filter: "drop-shadow(0 0 6px rgba(255,255,255,0.9))",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-center w-full text-glow animate-float">
              Ocean Games
            </h1>
          </div>

          {/* Stars HUD */}
          <div className="mx-auto max-w-3xl mb-8">
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-5 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-300/90 shadow-[0_0_18px_rgba(252,211,77,0.9)]">
                ⭐
              </span>
              <span className="text-xl text-white/90">Stars:</span>
              <span className="text-2xl font-bold text-white drop-shadow-sm">{stars}</span>
            </div>
          </div>

          {/* Game cards grid */}
          <section id="games" className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {(Object.keys(GAME_META) as GameKey[]).map((key) => (
              <GameCard
                key={key}
                gameKey={key}
                meta={GAME_META[key]}
                onStart={() => loadGame(key)}
                onSparkle={addStars}
              />
            ))}
          </section>
        </div>
      </div>

      {/* Tutorial modal */}
      {showTutorial && (
        <TutorialModal
          gameKey={showTutorial}
          meta={GAME_META[showTutorial]}
          onClose={() => setShowTutorial(null)}
          onStart={() => {
            setShowTutorial(null);
            setActiveGame(showTutorial);
          }}
        />
      )}

      {/* Active game */}
      {activeGame === 'game1' && (
        <Game1Fullscreen
          onClose={() => setActiveGame(null)}
          onEarnStars={(n, x, y) => addStars(n, x, y)}
        />
      )}
      {activeGame === 'game2' && (
        <Game2RunnerFullscreen
          onClose={() => setActiveGame(null)}
          onEarnStars={(n, x, y) => addStars(n, x, y)}
        />
      )}
      {activeGame === 'game3' && (
        <OceanWordHunt
          onClose={() => setActiveGame(null)}
          onEarnStars={(n, x, y) => addStars(n, x, y)}
        />
      )}

      {/* Local keyframes for special animations */}
      <style>{`
        @keyframes float-slow { 0% { transform: translateY(20px); opacity: .0 } 20%{opacity:.3} 50% { opacity: .15 } 100% { transform: translateY(-120vh); opacity: 0 } }
        .animate-float-slow { animation: float-slow linear infinite; }

        @keyframes pulse-slow { 0%, 100% { opacity: .35 } 50% { opacity: .55 } }
        .-slow { animation: pulse-slow 5s ease-in-out infinite; }

        @keyframes sparkle { 0% { transform: translate(-50%, -50%) scale(.6) rotate(0deg); opacity: 1 } 80% { opacity: .9 } 100% { transform: translate(-50%, -180%) scale(0) rotate(180deg); opacity: 0 } }
        .animate-sparkle { animation: sparkle .9s ease-out forwards; }
      `}</style>
    </div>
  );
}


// ===== Full-screen Game 2: Runner / Dodge =====
type G2Skin = { id: string; name: string; img: string; cost: number };
const G2_BG = "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/BG2.mp4?updatedAt=1759345792705";
const G2_STAR = "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/34.png?updatedAt=1759317102787";
const G2_OBS = [
  "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/53.png?updatedAt=1759344290562",
  "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/58.png?updatedAt=1759344290530",
  "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/54.png?updatedAt=1759344290411",
  "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/52.png?updatedAt=1759344290355",
  "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/57.png?updatedAt=1759344290306",
  "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/56.png?updatedAt=1759344290254",
  "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/55.png?updatedAt=1759344290166",
];
const G2_SKINS: G2Skin[] = [
  { id: "crab", name: "CRAB", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/43.png?updatedAt=1759350573972", cost: 0 },
  { id: "shrimp", name: "shrimp", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/51.png?updatedAt=1759343441290", cost: 0 },
  { id: "oyster", name: "Oyster", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/48.png?updatedAt=1759343440403", cost: 0 },
  { id: "urchin", name: "URCHIN", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/44.png?updatedAt=1759350574040", cost: 2 },
  // updated urchin image URL per request
  // { id: "urchin", name: "URCHIN", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/44.png?updatedAt=1759343440655", cost: 2 },
  { id: "turtle", name: "TURTLE SEA", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/50.png?updatedAt=1759343440752", cost: 2 },
  { id: "puffer", name: "puffer fish", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/46.png?updatedAt=1759343441009", cost: 3 },
  { id: "seahorse", name: "seahorse", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/42.png?updatedAt=1759343441030", cost: 4 },
  { id: "zebrafish", name: "Zebrafish", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/47.png?updatedAt=1759343440536", cost: 4 },
  { id: "butterflyfish", name: "butterflyfish", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/49.png?updatedAt=1759343440550", cost: 4 },
  { id: "jellyfish", name: "JELLYFISH", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/45.png?updatedAt=1759350574039", cost: 7 },
];

type G2Obstacle = { id: number; type: number; x: number; y: number; w: number; h: number; passed: boolean; vx: number };
type G2Pickup = { id: number; x: number; y: number; w: number; h: number; collected: boolean };

// Game 2: Runner - Complete rebuild
function Game2RunnerFullscreen({ onClose, onEarnStars }: { onClose: () => void; onEarnStars: (n: number, x?: number, y?: number) => void }) {
  // Game constants
  const G2_BG = "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/BG2.mp4?updatedAt=1759345792705";
  const G2_STAR = "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/34.png?updatedAt=1759317102787";
  const G2_OBS = [
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle1.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle2.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle3.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle4.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle5.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle6.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle7.png"
  ];

  // Game state
  const [mode, setMode] = useState<"select" | "running" | "paused" | "gameover" | "win">("select");
  const [selectedSkin, setSelectedSkin] = useState<string | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);

  // Game objects arrays
  const [obstacles, setObstacles] = useState<Array<any>>([]);
  const [luckyStars, setLuckyStars] = useState<Array<any>>([]);

  // Game progression
  const [speedFactor, setSpeedFactor] = useState(1.0);
  const [obstaclesSpawned, setObstaclesSpawned] = useState(0);
  const [starsSpawned, setStarsSpawned] = useState(0);

  // Game refs
  const containerRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);

  // Skin selection
  const skins = [
    { id: "fish1", name: "Cá Xanh", emoji: "🐟", unlocked: true },
    { id: "fish2", name: "Cá Vàng", emoji: "🐠", unlocked: true }
  ];

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d", "escape"].includes(key)) {
        e.preventDefault();
        keysRef.current.add(key);

        if (key === "escape") {
          if (mode === "running") {
            setMode("paused");
          } else if (mode === "paused") {
            setMode("running");
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d"].includes(key)) {
        keysRef.current.delete(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [mode]);

  // Cleanup function
  const cleanup = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Remove all game elements
    if (containerRef.current) {
      const container = containerRef.current;
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }

    setObstacles([]);
    setLuckyStars([]);
    setObstaclesSpawned(0);
    setStarsSpawned(0);
    setSpeedFactor(1.0);
    setStarsEarned(0);
  };

  // Start game
  const startGame = () => {
    if (!selectedSkin) return;

    setMode("running");
    setStarsEarned(0);
    setObstacles([]);
    setLuckyStars([]);
    setSpeedFactor(1.0);
    setObstaclesSpawned(0);
    setStarsSpawned(0);
  };

  // Reset to menu
  const resetToMenu = () => {
    cleanup();
    setMode("select");
    setSelectedSkin(null);
  };

  // Game loop
  useEffect(() => {
    if (mode !== "running" || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Create player element
    const playerElement = document.createElement("div");
    playerElement.className = "absolute animate-runner-glow animate-runner-swim will-change-transform pointer-events-none";
    playerElement.style.width = "80px";
    playerElement.style.height = "80px";
    playerElement.style.backgroundColor = selectedSkin === "fish1" ? "#06b6d4" : "#eab308";
    playerElement.style.borderRadius = "50%";
    playerElement.style.display = "flex";
    playerElement.style.alignItems = "center";
    playerElement.style.justifyContent = "center";
    playerElement.style.fontSize = "48px";

    const emoji = selectedSkin === "fish1" ? "🐟" : "🐠";
    playerElement.textContent = emoji;

    container.appendChild(playerElement);

    let playerX = rect.width * 0.5 - 40; // Center position
    let playerY = rect.height - 100; // Bottom position
    let playerVx = 0;
    const playerSpeed = 300;

    let gameTime = 0;
    let nextSpawnTime = 2000; // 2 second delay
    let lastTimestamp = performance.now();

    const gameLoop = (timestamp: number) => {
      const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;
      gameTime += dt * 1000; // Convert to milliseconds

      // Update player position
      playerVx = 0;
      if (keysRef.current.has("arrowleft") || keysRef.current.has("a")) {
        playerVx = -playerSpeed;
      } else if (keysRef.current.has("arrowright") || keysRef.current.has("d")) {
        playerVx = playerSpeed;
      }

      playerX += playerVx * dt;
      playerX = Math.max(0, Math.min(rect.width - 80, playerX));

      playerElement.style.transform = `translate3d(${playerX}px, ${playerY}px, 0)`;

      // Spawn objects
      if (gameTime >= nextSpawnTime && obstaclesSpawned < 14) {
        const shouldSpawnStar = starsSpawned < 3 && Math.random() < 0.2;

        if (shouldSpawnStar) {
          // Spawn star
          const starElement = document.createElement("img");
          starElement.src = G2_STAR;
          starElement.className = "absolute animate-star-sparkle will-change-transform pointer-events-none";
          starElement.style.width = "32px";
          starElement.style.height = "32px";

          const starX = Math.random() * (rect.width - 100) + 50;
          starElement.style.left = `${starX}px`;
          starElement.style.top = "-32px";

          container.appendChild(starElement);

          setLuckyStars(prev => [...prev, {
            element: starElement,
            x: starX,
            y: -32,
            vy: rect.height * 0.25 * speedFactor
          }]);

          setStarsSpawned(prev => prev + 1);
        } else {
          // Spawn obstacle
          const obstacleElement = document.createElement("img");
          obstacleElement.src = G2_OBS[Math.floor(Math.random() * G2_OBS.length)];
          obstacleElement.className = "absolute animate-enter will-change-transform pointer-events-none";
          obstacleElement.style.width = "60px";
          obstacleElement.style.height = "60px";

          const obstacleX = Math.random() * (rect.width - 110) + 50;
          obstacleElement.style.left = `${obstacleX}px`;
          obstacleElement.style.top = "-60px";

          container.appendChild(obstacleElement);

          setObstacles(prev => [...prev, {
            element: obstacleElement,
            x: obstacleX,
            y: -60,
            vy: rect.height * 0.25 * speedFactor
          }]);

          setObstaclesSpawned(prev => prev + 1);
          setSpeedFactor(prev => prev * 1.05); // Increase speed by 5%
        }

        nextSpawnTime = gameTime + 1500 + Math.random() * 500; // 1.5-2 seconds
      }

      // Update obstacles and stars
      setObstacles(prev => prev.map(obstacle => {
        obstacle.y += obstacle.vy * dt;
        obstacle.element.style.transform = `translateY(${obstacle.y}px)`;

        // Check if passed bottom
        if (obstacle.y > rect.height && !obstacle.passed) {
          obstacle.passed = true;
          setStarsEarned(prev => prev + 1);
          onEarnStars(1);
        }

        // Remove if off screen
        if (obstacle.y > rect.height + 100) {
          if (obstacle.element.parentNode) {
            obstacle.element.remove();
          }
          return null;
        }
        return obstacle;
      }).filter(Boolean));

      setLuckyStars(prev => prev.map(star => {
        star.y += star.vy * dt;
        star.element.style.transform = `translateY(${star.y}px)`;

        // Remove if off screen
        if (star.y > rect.height + 100) {
          if (star.element.parentNode) {
            star.element.remove();
          }
          return null;
        }
        return star;
      }).filter(Boolean));

      // Collision detection
      const playerRect = { left: playerX, right: playerX + 80, top: playerY, bottom: playerY + 80 };

      // Check obstacle collisions
      for (const obstacle of obstacles) {
        if (!obstacle) continue;
        const obstacleRect = {
          left: obstacle.x,
          right: obstacle.x + 60,
          top: obstacle.y,
          bottom: obstacle.y + 60
        };

        if (!(playerRect.right < obstacleRect.left ||
              playerRect.left > obstacleRect.right ||
              playerRect.bottom < obstacleRect.top ||
              playerRect.top > obstacleRect.bottom)) {
          // Collision - Game Over
          cleanup();
          setMode("gameover");
          return;
        }
      }

      // Check star collisions
      setLuckyStars(prev => prev.map(star => {
        if (!star) return null;
        const starRect = {
          left: star.x,
          right: star.x + 32,
          top: star.y,
          bottom: star.y + 32
        };

        const collision = !(playerRect.right < starRect.left ||
                          playerRect.left > starRect.right ||
                          playerRect.bottom < starRect.top ||
                          playerRect.top > starRect.bottom);

        if (collision) {
          setStarsEarned(prev => prev + 2);
          onEarnStars(2);
          if (star.element.parentNode) {
            star.element.remove();
          }
          return null; // Remove collected star
        }
        return star;
      }).filter(Boolean));

      // Check win condition
      if (obstaclesSpawned >= 14 && obstacles.length === 0 && luckyStars.length === 0) {
        cleanup();
        setMode("win");
        return;
      }

      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      cleanup();
    };
  }, [mode, selectedSkin, obstaclesSpawned, starsSpawned, speedFactor]);

  return (
    <div className="fixed inset-0 z-[70] bg-black">
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={G2_BG}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* Game UI Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Character Selection */}
      {mode === "select" && (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl p-8 text-center shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-slate-800">🐟 Chọn Nhân Vật 🐟</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {skins.map(skin => (
                <button
                  key={skin.id}
                  onClick={() => setSelectedSkin(skin.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedSkin === skin.id
                      ? "border-cyan-500 bg-cyan-50"
                      : "border-gray-300 bg-white hover:border-cyan-300"
                  }`}
                >
                  <div className="text-4xl mb-2">{skin.emoji}</div>
                  <div className="text-sm font-medium">{skin.name}</div>
                </button>
              ))}
            </div>
            <button
              onClick={startGame}
              disabled={!selectedSkin}
              className={`px-8 py-4 rounded-2xl font-bold text-xl shadow-lg transition-all ${
                selectedSkin
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              🎮 Bắt Đầu Chơi
            </button>
          </div>
        </div>
      )}

      {/* Game Container */}
      {(mode === "running" || mode === "paused") && (
        <>
          <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden"
            style={{ position: "relative" }}
          />

          {/* HUD */}
          <div className="absolute top-4 left-4 z-[80] flex items-center gap-4 text-white">
            <div className="px-4 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/30">
              Stars: <span className="font-bold text-yellow-300">{starsEarned}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/30">
              Progress: <span className="font-bold">{obstaclesSpawned}/14</span>
            </div>
          </div>

          {/* Pause Overlay */}
          {mode === "paused" && (
            <div className="absolute inset-0 z-[85] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 text-center shadow-2xl">
                <h2 className="text-2xl font-bold mb-4 text-slate-800">⏸️ Tạm Dừng</h2>
                <p className="text-slate-700 mb-6">Nhấn Escape để tiếp tục</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setMode("running")}
                    className="px-6 py-3 bg-cyan-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                  >
                    ▶️ Tiếp Tục
                  </button>
                  <button
                    onClick={resetToMenu}
                    className="px-6 py-3 bg-slate-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                  >
                    🏠 Thoát
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exit Button */}
          <button
            onClick={resetToMenu}
            className="absolute top-4 right-4 z-[80] px-4 py-2 rounded-xl bg-white/80 text-slate-900 font-semibold shadow hover:bg-white"
          >
            Exit
          </button>
        </>
      )}

      {/* Game Over Screen */}
      {mode === "gameover" && (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-3xl font-bold mb-4 text-red-600">Game Over!</h2>
            <p className="text-slate-700 mb-4">Bạn đã va chạm với chướng ngại vật!</p>
            <p className="text-lg text-slate-700 mb-6">Điểm số: <span className="font-bold text-yellow-600">{starsEarned} ⭐</span></p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={startGame}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                🎮 Chơi Lại
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                🏠 Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win Screen */}
      {mode === "win" && (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-4 text-green-600">Chúc Mừng!</h2>
            <p className="text-slate-700 mb-4">Bạn đã sống sót qua tất cả chướng ngại vật!</p>
            <p className="text-lg text-slate-700 mb-6">Điểm số: <span className="font-bold text-yellow-600">{starsEarned} ⭐</span></p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={startGame}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                🎮 Chơi Lại
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                🏠 Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes runner-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.6)); }
          50% { filter: drop-shadow(0 0 16px rgba(6, 182, 212, 0.9)); }
        }
        .animate-runner-glow { animation: runner-glow 2s ease-in-out infinite; }

        @keyframes runner-swim {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-runner-swim { animation: runner-swim 1.5s ease-in-out infinite; }

        @keyframes enter {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-enter { animation: enter 0.3s ease-out; }

        @keyframes star-sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(90deg); }
          50% { transform: scale(1.4) rotate(180deg); }
          75% { transform: scale(1.2) rotate(270deg); }
        }
        .animate-star-sparkle { animation: star-sparkle 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
// Game 3: Guess the Ocean Creature (simple)
function GameGuess({ onEarnStars }: { onEarnStars: (n: number, x?: number, y?: number) => void }) {
  const pool = ["octopus", "crab", "dolphin", "turtle", "shark", "seahorse"];
  const [answer] = useState(() => pool[Math.floor(Math.random() * pool.length)]);
  const [input, setInput] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const correct = input.trim().toLowerCase() === answer;
    const rect = containerRef.current?.getBoundingClientRect();
    if (correct) onEarnStars(2, rect ? rect.left + (rect.width / 2) : undefined, rect?.top);
    setHint(correct ? `Correct! It's ${answer} 🥳` : "Not quite, try again!");
  };

  const useHint = () => {
    const reveal = answer.slice(0, Math.min(answer.length, (hint?.match(/\*/g)?.length ?? 0) + 1));
    const masked = reveal.padEnd(answer.length, "*");
    setHint(`Hint: ${masked}`);
    const rect = containerRef.current?.getBoundingClientRect();
    onEarnStars(-1, rect ? rect.left + rect.width / 2 : undefined, rect?.top); // spend 1 star with sparkle
  };

  return (
    <div ref={containerRef} className="p-5 grid gap-4 text-slate-800">
      <p className="text-slate-700">Guess the creature name. Hints reveal letters but cost 1 star in the full game.</p>
      <form onSubmit={submit} className="flex flex-col md:flex-row gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your guess..."
          className="flex-1 rounded-xl border border-slate-300 bg-white/80 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-300"
        />
        <div className="flex gap-3">
          <button type="submit" className="px-4 py-3 rounded-xl bg-emerald-400 text-slate-900 font-semibold shadow hover:brightness-105 active:scale-95">Submit</button>
          <button type="button" className="px-4 py-3 rounded-xl bg-cyan-400 text-slate-900 font-semibold shadow hover:brightness-105 active:scale-95" onClick={useHint}>Hint</button>
        </div>
      </form>
      {hint && <div className="rounded-xl bg-white/70 border border-slate-300 px-4 py-3">{hint}</div>}
      <div className="mt-2 text-sm text-slate-600">Placeholder images/URLs can be plugged here without layout changes.</div>
    </div>
  );
}


// ===== Full-screen Game 1: Match the Ocean =====
type G1Creature = { key: string; name: string; img: string; shadow: string };

const G1_CREATURES: G1Creature[] = [
  { key: "whale", name: "Whale", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/32.png?updatedAt=1759317103542", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/27.png?updatedAt=1759333631399" },
  { key: "shell", name: "Shell", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/35.png?updatedAt=1759317103452", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/30.png?updatedAt=1759333631314" },
  { key: "starfish", name: "Starfish", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/BRIEF%20GIAO%20DIE%CC%A3%CC%82N.png?updatedAt=1759335334953", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/26.png?updatedAt=1759333630758" },
  { key: "crab", name: "Crab", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/19.png?updatedAt=1759317102533", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/24.png?updatedAt=1759333631085" },
  { key: "turtle", name: "Sea turtle", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/21.png?updatedAt=1759317103380", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/22.png?updatedAt=1759333630260" },
  { key: "seahorse", name: "Seahorse", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/33.png?updatedAt=1759317101589", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/31.png?updatedAt=1759333630651" },
  { key: "squid", name: "Squid", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/36.png?updatedAt=1759317100931", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/29.png?updatedAt=1759333630361" },
  { key: "fish", name: "Fish", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/37.png?updatedAt=1759317103184", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/28.png?updatedAt=1759333631132" },
  { key: "jellyfish", name: "Jellyfish", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/BRIEF%20GIAO%20DIE%CC%A3%CC%82N%20(1).png?updatedAt=1759335300432", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/23.png?updatedAt=1759333630647" },
  { key: "dolphin", name: "Dolphin", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/25%20ma%CC%80u.png?updatedAt=1759340404978", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/25.png?updatedAt=1759335775054" },
];

function Game1Fullscreen({ onClose, onEarnStars }: { onClose: () => void; onEarnStars: (n: number, x?: number, y?: number) => void }) {
  const [placed, setPlaced] = useState<Record<string, number | null>>(() => Object.fromEntries(G1_CREATURES.map((c) => [c.key, null])));
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [infoKey, setInfoKey] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragXY, setDragXY] = useState<{ x: number; y: number } | null>(null);
  const [glowIdx, setGlowIdx] = useState<number | null>(null);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [topOrder, setTopOrder] = useState<string[]>([]);
  const [slotOrder, setSlotOrder] = useState<string[]>([]);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  // initialize shuffled orders on mount
  useEffect(() => {
    const keys = G1_CREATURES.map(c => c.key);
    const shuffle = (arr: string[]) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    setTopOrder(shuffle(keys));
    setSlotOrder(shuffle(keys));
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => { if (!dragKey) return; setDragXY({ x: e.clientX, y: e.clientY }); };
    const up = (e: PointerEvent) => {
      if (!dragKey) return;
      const x = e.clientX, y = e.clientY;
      let hit: number | null = null;
      slotRefs.current.forEach((el, idx) => { if (!el) return; const r = el.getBoundingClientRect(); if (x>=r.left && x<=r.right && y>=r.top && y<=r.bottom) hit = idx; });
      if (hit !== null && slotOrder[hit] === dragKey && placed[dragKey] === null) {
        setPlaced((p) => ({ ...p, [dragKey]: hit! }));
        setScore((s) => s + 1);
        setGlowIdx(hit);
        setTimeout(() => setGlowIdx(null), 1400);
        setInfoKey(dragKey);
        setTimeout(() => {
          const allNow = G1_CREATURES.every((c) => (c.key === dragKey) ? true : (placed[c.key] ?? null) !== null);
          if (allNow) setCompleted(true);
        }, 120);
      } else {
        // wrong drop: trigger shake on the source item
        setWrongKey(dragKey);
        setTimeout(() => setWrongKey(null), 500);
      }
      setDragKey(null); setDragXY(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    if (dragKey) { window.addEventListener("pointermove", move, { passive: true } as any); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up); }
    return () => { window.removeEventListener("pointermove", move as any); window.removeEventListener("pointerup", up as any); window.removeEventListener("pointercancel", up as any); };
  }, [dragKey, placed, slotOrder]);

  const startDrag = (key: string) => (e: React.PointerEvent) => {
    if ((placed[key] ?? null) !== null) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragKey(key);
    setDragXY({ x: e.clientX, y: e.clientY });
  };

  const finishEarly = () => setCompleted(true);
  const commitStarsAndClose = () => { onEarnStars(score); onClose(); };
  const resetGame = () => {
    const keys = G1_CREATURES.map(c => c.key);
    const shuffle = (arr: string[]) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    setTopOrder(shuffle(keys));
    setSlotOrder(shuffle(keys));
    setPlaced(Object.fromEntries(G1_CREATURES.map((c) => [c.key, null])));
    setScore(0);
    setCompleted(false);
    setInfoKey(null);
    setDragKey(null);
    setDragXY(null);
    setGlowIdx(null);
    setWrongKey(null);
  };

  return (
    <div className="fixed inset-0 z-[80]">
      <video className="absolute inset-0 w-full h-full object-cover" src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/BRIEF%20GIAO%20DIE%CC%A3%CC%82N.mp4?updatedAt=1759335373305" autoPlay muted loop playsInline preload="auto" />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex flex-col h-full text-white">
        <div className="flex items-center justify-between p-4">
          <div className="text-lg font-semibold">Match the Ocean</div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30">Stars: <span className="font-bold">{score}</span></div>
            <button onClick={finishEarly} className="px-3 py-1 rounded-xl bg-white/70 text-slate-900 font-semibold shadow active:scale-95">Finish Early</button>
            <button onClick={onClose} className="px-3 py-1 rounded-xl bg-white/70 text-slate-900 font-semibold shadow active:scale-95">Close</button>
          </div>
        </div>

        <div className="shrink-0 px-4 pb-2">
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
            {topOrder.map((k) => {
              const c = G1_CREATURES.find(cc => cc.key === k)!;
              return (
                <div key={c.key} className={`relative min-w-[96px] h-24 md:min-w-[120px] md:h-28 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md grid place-items-center select-none ${wrongKey === c.key ? 'animate-g1-shake' : ''}`}>
                  {(placed[c.key] ?? null) === null ? (
                    <img src={c.img} alt={c.name} className="max-h-[80%] max-w-[80%] cursor-grab active:cursor-grabbing drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" onPointerDown={startDrag(c.key)} draggable={false} />
                  ) : (
                    <div className="text-white/60 text-sm">Placed</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixed silhouette grid at bottom center */}
        <div className="absolute left-0 right-0 bottom-0 px-4 pb-4">
          <div className="mx-auto w-full max-w-5xl rounded-2xl bg-black/25 border border-white/30 backdrop-blur-md p-3">
            <div className="grid grid-cols-5 grid-rows-2 gap-4">
              {slotOrder.map((k, idx) => {
                const c = G1_CREATURES.find(cc => cc.key === k)!;
                return (
                  <div key={c.key} ref={(el) => (slotRefs.current[idx] = el)} className={`relative aspect-[5/4] rounded-2xl bg-white/10 border overflow-hidden ${glowIdx === idx ? 'animate-g1-glow border-cyan-300' : 'border-white/30'}`}>
                    {(placed[c.key] ?? null) === null && (
                      <img src={c.shadow} alt={`${c.name} shadow`} className="absolute inset-0 w-full h-full object-contain opacity-90 pointer-events-none" />
                    )}
                    {(placed[c.key] ?? null) !== null && (
                      <button className="absolute inset-0 grid place-items-center" onClick={() => infoKey === null && setInfoKey(c.key)}>
                        <img src={c.img} alt={c.name} className="max-h-[86%] max-w-[86%] object-contain animate-g1-float drop-shadow-[0_0_16px_rgba(255,255,255,0.8)]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {dragKey && dragXY && (
          <div className="pointer-events-none fixed z-[90]" style={{ left: dragXY.x - 48, top: dragXY.y - 48 }}>
            <img src={G1_CREATURES.find((cc) => cc.key === dragKey)!.img} alt="drag" className="w-24 h-24 object-contain drop-shadow-[0_0_14px_rgba(255,255,255,0.9)]" />
          </div>
        )}

        {completed && (
          <div className="fixed inset-0 z-[95] grid place-items-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-g1-fade" />
            <div className="relative z-10 w-[92%] max-w-md rounded-3xl border border-white/30 bg-white/80 p-6 text-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-g1-pop">
              <h3 className="text-2xl font-bold mb-2">Well done!</h3>
              <p className="mb-4">You matched {score}/10 creatures. You earned +{score} stars.</p>
              <div className="flex gap-3 justify-end">
                <button className="px-4 py-2 rounded-xl bg-white/90 hover:bg-white font-medium" onClick={commitStarsAndClose}>Return to Home</button>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold" onClick={() => { onEarnStars(score); setCompleted(false); resetGame(); }}>Play Again</button>
              </div>
            </div>
          </div>
        )}

        {infoKey && (
          <div className="fixed inset-0 z-[96] grid place-items-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-g1-fade" onClick={() => setInfoKey(null)} />
            <div className="relative z-10 w-[92%] max-w-md rounded-3xl border border-white/30 bg-white/85 p-6 text-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-g1-pop">
              {(() => { const c = G1_CREATURES.find((cc) => cc.key === infoKey)!; return (
                <div className="grid gap-4">
                  <img src={c.img} alt={c.name} className="w-48 h-48 object-contain justify-self-center drop-shadow" />
                  <h4 className="text-xl font-bold text-center">{c.name}</h4>
                  <p className="text-slate-700 text-center">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                  <button className="justify-self-center px-4 py-2 rounded-xl bg-slate-900 text-white" onClick={() => setInfoKey(null)}>Close</button>
                </div>
              ); })()}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes g1-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        .animate-g1-float { animation: g1-float 3s ease-in-out infinite }
        @keyframes g1-fade { from { opacity: 0 } to { opacity: 1 } }
        .animate-g1-fade { animation: g1-fade .25s ease-out }
        @keyframes g1-pop { from { opacity: 0; transform: translateY(8px) scale(.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .animate-g1-pop { animation: g1-pop .25s ease-out }
        @keyframes g1-glow { 0% { box-shadow: 0 0 0 rgba(59,130,246,0); } 50% { box-shadow: 0 0 30px rgba(125,211,252,0.9); } 100% { box-shadow: 0 0 0 rgba(59,130,246,0); } }
        .animate-g1-glow { animation: g1-glow .9s ease-in-out }
        @keyframes g1-shake { 0%, 100% { transform: translateX(0) } 20% { transform: translateX(-5px) } 40% { transform: translateX(5px) } 60% { transform: translateX(-4px) } 80% { transform: translateX(4px) } }
        .animate-g1-shake { animation: g1-shake .45s ease-in-out }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}export default Games;
