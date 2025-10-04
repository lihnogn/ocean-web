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
      "Dive into ocean currents! Complete each word to earn Lucky Stars!",
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
              <span className="text-xl ocean-dark-text/90">Stars:</span>
              <span className="text-2xl font-bold ocean-dark-text drop-shadow-sm">{stars}</span>
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
const G2_BG = "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/game2.%20mp4?updatedAt=1759396573159";
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

// Game 2: Dodge the Hunter - Complete Implementation
function Game2RunnerFullscreen({ onClose, onEarnStars }: { onClose: () => void; onEarnStars: (n: number, x?: number, y?: number) => void }) {
  const { stars: globalStars, addStars: addStarsGlobal } = useStars();
  const [mode, setMode] = useState<'select' | 'playing' | 'gameover' | 'win'>('select');
  const [selectedSkin, setSelectedSkin] = useState<string | null>(null);
  const [sessionStars, setSessionStars] = useState(0);
  const [unlockedSkins, setUnlockedSkins] = useState<Set<string>>(new Set(['crab', 'shrimp', 'oyster']));
  const [selectedSkinIndex, setSelectedSkinIndex] = useState<number>(0); // carousel index
  const [gameTransition, setGameTransition] = useState<'fade-in' | 'fade-out' | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // ===== ASSETS (exact URLs) =====
  const BG_VIDEO = 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/BG2.mp4?updatedAt=1759345792705';

  const SKINS = [
    { id: 'crab', name: 'CRAB', img: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/43.png?updatedAt=1759350573972', cost: 0 },
    { id: 'shrimp', name: 'SHRIMP', img: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/51.png?updatedAt=1759343441290', cost: 0 },
    { id: 'oyster', name: 'OYSTER', img: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/48.png?updatedAt=1759343440403', cost: 0 },
    { id: 'urchin', name: 'URCHIN', img: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/44.png?updatedAt=1759350574040', cost: 2 },
    { id: 'turtle', name: 'TURTLE SEA', img: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/50.png?updatedAt=1759343440752', cost: 2 },
    { id: 'puffer', name: 'PUFFER FISH', img: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/46.png?updatedAt=1759343441009', cost: 3 },
    { id: 'seahorse', name: 'SEAHORSE', img: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/42.png?updatedAt=1759343441030', cost: 4 },
    { id: 'zebrafish', name: 'ZEBRAFISH', img: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/47.png?updatedAt=1759343440536', cost: 4 },
    { id: 'butterflyfish', name: 'BUTTERFLYFISH', img: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/49.png?updatedAt=1759343440550', cost: 4 },
    { id: 'jellyfish', name: 'JELLYFISH', img: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/45.png?updatedAt=1759350574039', cost: 7 },
  ];

  const OBSTACLE_IMAGES = [
    'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/53.png?updatedAt=1759344290562',
    'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/58.png?updatedAt=1759344290530',
    'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/54.png?updatedAt=1759344290411',
    'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/52.png?updatedAt=1759344290355',
    'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/57.png?updatedAt=1759344290306',
    'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/56.png?updatedAt=1759344290254',
    'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/55.png?updatedAt=1759344290166',
  ];

  const STAR_IMG = 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/34.png?updatedAt=1759317102787';

  // ===== GAME STATE =====
  const gameStateRef = useRef<{
    mode: 'select' | 'playing' | 'gameover' | 'win';
    frame: number;
    player: { x: number; y: number; width: number; height: number; img: HTMLImageElement };
    obstacles: Array<{ x: number; y: number; width: number; height: number; speed: number; img: HTMLImageElement; id: number }>;
    stars: Array<{ x: number; y: number; width: number; height: number; speed: number; img: HTMLImageElement; id: number }>;
    score: number;
    totalItems: number;
    speedFactor: number;
    lastSpawnFrame: number;
    spawnInterval: number;
    moveLeft: boolean;
    moveRight: boolean;
  } | null>(null);

  const keysRef = useRef<Set<string>>(new Set());

  // ===== EXIT HANDLER =====
  const exitGame = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const gameState = gameStateRef.current;
    if (gameState && (gameState.mode === 'win' || gameState.mode === 'gameover')) {
      onEarnStars(sessionStars);
      console.log(`Awarding ${sessionStars} stars to player`);
    }

    onClose();
  };

  // ===== UNLOCK SKIN (ATOMIC) =====
  const unlockSkin = (skinId: string, cost: number) => {
    if (globalStars >= cost) {
      // Atomic operation: deduct stars and unlock
      addStarsGlobal(-cost);
      setUnlockedSkins(prev => new Set([...prev, skinId]));
      toast.success(`Unlocked ${SKINS.find(s => s.id === skinId)?.name}!`);
    } else {
      toast.error('Not enough stars!');
    }
  };

  // ===== START GAME =====
  const startGame = () => {
    if (!selectedSkin || !unlockedSkins.has(selectedSkin)) return;

    // Start fade out transition
    setGameTransition('fade-out');
    setTimeout(() => {
      setMode('playing');
      console.log('Mode set to playing');
      setSessionStars(0);
      setGameTransition('fade-in');

      // Remove fade in after animation completes
      setTimeout(() => {
        setGameTransition(null);
      }, 500);
    }, 300);

    // Initialize game state
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const skin = SKINS.find(s => s.id === selectedSkin)!;
      const playerImg = new Image();
      playerImg.onload = () => {
        console.log('Player image loaded successfully');
      };
      playerImg.onerror = () => {
        console.error('Failed to load player image:', skin.img);
      };
      playerImg.src = skin.img;

      gameStateRef.current = {
        mode: 'playing',
        frame: 0,
        player: {
          x: rect.width / 2,
          y: rect.height - 150,
          width: 100,
          height: 100,
          img: playerImg
        },
        obstacles: [],
        stars: [],
        score: 0,
        totalItems: 0,
        speedFactor: 1,
        lastSpawnFrame: 0,
        spawnInterval: 80,
        moveLeft: false,
        moveRight: false
      };

      console.log('Game state initialized:', gameStateRef.current);
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    console.log('Starting game loop...');
    rafRef.current = requestAnimationFrame(gameLoop);
  };

  // ===== GAME LOOP =====
  const gameLoop = (timestamp: number) => {
    console.log('🎮 GAMELOOP CALLED - timestamp:', timestamp);

    const canvas = canvasRef.current!;
    console.log('Canvas ref exists:', !!canvas);

    if (!canvas) {
      console.error('Canvas ref is null!');
      return;
    }

    const ctx = canvas.getContext('2d');
    console.log('Canvas context:', ctx);

    if (!ctx) {
      console.error('Failed to get 2D context!');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    console.log('Canvas dimensions:', canvas.width, canvas.height, 'rect:', rect.width, rect.height);

    const gameState = gameStateRef.current!;
    if (!gameState) {
      console.error('Game state is null in gameLoop!');
      return;
    }

    console.log('Game loop running, frame:', gameState.frame, 'obstacles:', gameState.obstacles.length, 'stars:', gameState.stars.length);

    // Update frame
    gameState.frame++;

    // Handle input
    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) gameState.moveLeft = true;
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) gameState.moveRight = true;

    // Move player
    if (gameState.moveLeft) gameState.player.x -= 8;
    if (gameState.moveRight) gameState.player.x += 8;
    gameState.moveLeft = false;
    gameState.moveRight = false;

    // Clamp player position
    gameState.player.x = Math.max(0, Math.min(rect.width - gameState.player.width, gameState.player.x));

    // Spawn logic (every 80-120 frames)
    if (gameState.frame - gameState.lastSpawnFrame >= gameState.spawnInterval && gameState.totalItems < 17) {
      const shouldSpawnObstacle = Math.random() < 0.82; // 82% chance for obstacle, 18% for star

      if (shouldSpawnObstacle) {
        // Spawn obstacle
        const obstacleImg = new Image();
        obstacleImg.onload = () => console.log('Obstacle image loaded:', obstacleImg.src);
        obstacleImg.onerror = () => console.error('Failed to load obstacle image:', obstacleImg.src);
        obstacleImg.src = OBSTACLE_IMAGES[Math.floor(Math.random() * OBSTACLE_IMAGES.length)];
        gameState.obstacles.push({
          x: Math.random() * (rect.width - 100) + 50,
          y: -100,
          width: 60,
          height: 60,
          speed: 4 + 0.05 * gameState.totalItems,
          img: obstacleImg,
          id: Date.now() + Math.random()
        });
        gameState.totalItems++;
      } else if (gameState.stars.length < 3) {
        // Spawn star
        const starImg = new Image();
        starImg.onload = () => console.log('Star image loaded:', starImg.src);
        starImg.onerror = () => console.error('Failed to load star image:', starImg.src);
        starImg.src = STAR_IMG;
        gameState.stars.push({
          x: Math.random() * (rect.width - 100) + 50,
          y: -100,
          width: 32,
          height: 32,
          speed: 3.5,
          img: starImg,
          id: Date.now() + Math.random()
        });
        gameState.totalItems++;
      }

      gameState.lastSpawnFrame = gameState.frame;
      gameState.spawnInterval = 80 + Math.random() * 40; // 80-120 frames
    }

    // Update obstacles
    gameState.obstacles = gameState.obstacles.filter(obs => {
      obs.y += obs.speed * gameState.speedFactor;
      if (obs.y > rect.height + 100) {
        gameState.score += 1; // dodged
        setSessionStars(s => s + 1);
        return false;
      }
      return true;
    });

    // Update stars
    gameState.stars = gameState.stars.filter(star => {
      star.y += star.speed * gameState.speedFactor;
      if (star.y > rect.height + 100) return false;
      return true;
    });

    // Collision detection
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
      const obs = gameState.obstacles[i];
      if (isColliding(gameState.player, obs)) {
        gameState.mode = 'gameover';
        return;
      }
    }

    for (let i = gameState.stars.length - 1; i >= 0; i--) {
      const star = gameState.stars[i];
      if (isColliding(gameState.player, star)) {
        gameState.stars.splice(i, 1);
        gameState.score += 2;
        setSessionStars(s => s + 2);
      }
    }

    // Draw
    ctx.clearRect(0, 0, rect.width, rect.height);
    // Background handled by CSS video

    console.log('Drawing player at:', gameState.player.x, gameState.player.y, 'image loaded:', gameState.player.img.complete);

    // Draw a test background to see if canvas is working
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw player
    if (gameState.player.img.complete) {
      ctx.drawImage(gameState.player.img, gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);
    } else {
      console.warn('Player image not loaded yet');
      // Draw a placeholder rectangle for debugging
      ctx.fillStyle = 'cyan';
      ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);
    }

    // Draw obstacles
    gameState.obstacles.forEach(obs => {
      if (obs.img.complete) {
        ctx.drawImage(obs.img, obs.x, obs.y, obs.width, obs.height);
      } else {
        console.warn('Obstacle image not loaded:', obs.id);
        ctx.fillStyle = 'red';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      }
    });

    // Draw stars
    gameState.stars.forEach(star => {
      if (star.img.complete) {
        ctx.drawImage(star.img, star.x, star.y, star.width, star.height);
      } else {
        console.warn('Star image not loaded:', star.id);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(star.x, star.y, star.width, star.height);
      }
    });

    // Check win condition
    if (gameState.totalItems >= 17 && gameState.obstacles.length === 0 && gameState.stars.length === 0) {
      gameState.mode = 'win';
      return;
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  };

  // Collision detection function
  const isColliding = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) => {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  };

  // ===== CONTROLS =====
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
        e.preventDefault();
        console.log('Key pressed:', e.key, 'type:', e.type);
        if (e.type === 'keydown') {
          if (e.key === 'ArrowLeft' || e.key === 'a') {
            gameStateRef.current!.moveLeft = true;
            console.log('Move left set to true');
          }
          if (e.key === 'ArrowRight' || e.key === 'd') {
            gameStateRef.current!.moveRight = true;
            console.log('Move right set to true');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, []);

  return (
    <div id="game2-root" className="fixed inset-0 z-[70]">
      {/* Background Video */}
      <video className="absolute inset-0 w-full h-full object-cover" src={BG_VIDEO} autoPlay muted loop playsInline preload="auto" />

      {/* Character Selection (Carousel Style) */}
      {mode === 'select' && (
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Background Video */}
          <video className="absolute inset-0 w-full h-full object-cover" src={BG_VIDEO} autoPlay muted loop playsInline preload="auto" />
          <div className="absolute inset-0 bg-black/50" />

          {/* Top UI - Stars & Exit */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2 backdrop-blur-md">
            <span className="text-yellow-300 text-2xl">⭐</span>
            <span className="ocean-dark-text font-bold text-lg">{globalStars}</span>
          </div>
          <button
            onClick={exitGame}
            className="absolute top-4 right-4 z-20 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
          >
            <span className="text-blue-600 text-xl font-bold">✕</span>
          </button>

          {/* Main Carousel */}
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
            <h2 className="text-4xl md:text-5xl font-bold ocean-dark-text mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
              Choose Your Character
            </h2>

            {/* Carousel Container */}
            <div className="relative flex items-center justify-center gap-8 mb-12">
              {/* Left Arrow */}
              <button
                onClick={() => setSelectedSkinIndex((i) => (i - 1 + SKINS.length) % SKINS.length)}
                className="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all text-blue-600 text-3xl"
              >
                ‹
              </button>

              {/* Center Character Display */}
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse scale-150"></div>

                {/* Character Image */}
                <img
                  src={SKINS[selectedSkinIndex].img}
                  alt={SKINS[selectedSkinIndex].name}
                  className={`relative w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-[0_0_30px_rgba(0,255,255,0.6)] transition-all duration-500 ${
                    selectedSkin === SKINS[selectedSkinIndex].id ? 'animate-pulse scale-105' : 'scale-100'
                  }`}
                />

                {/* Lock Overlay for Locked Characters */}
                {!unlockedSkins.has(SKINS[selectedSkinIndex].id) && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <span className="ocean-dark-text text-4xl">🔒</span>
                  </div>
                )}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => setSelectedSkinIndex((i) => (i + 1) % SKINS.length)}
                className="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all text-blue-600 text-3xl"
              >
                ›
              </button>
            </div>

            {/* Character Info */}
            <div className="text-center mb-8 max-w-md">
              <h3 className="text-3xl md:text-4xl font-bold ocean-dark-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-4">
                {SKINS[selectedSkinIndex].name}
              </h3>

              {/* Cost Display */}
              {SKINS[selectedSkinIndex].cost > 0 && (
                <p className="text-yellow-300 text-xl mb-6">
                  {SKINS[selectedSkinIndex].cost} ⭐
                </p>
              )}

              {/* Action Button */}
              {unlockedSkins.has(SKINS[selectedSkinIndex].id) ? (
                <button
                  onClick={() => setSelectedSkin(SKINS[selectedSkinIndex].id)}
                  className={`px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-all text-xl ${
                    selectedSkin === SKINS[selectedSkinIndex].id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 ocean-dark-text animate-pulse'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 ocean-dark-text hover:shadow-cyan-500/50'
                  }`}
                >
                  Select
                </button>
              ) : (
                <button
                  onClick={() => unlockSkin(SKINS[selectedSkinIndex].id, SKINS[selectedSkinIndex].cost)}
                  className="px-8 py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all text-xl bg-gradient-to-r from-yellow-200/30 via-orange-300/35 to-amber-300/40 hover:from-yellow-100/40 hover:via-orange-200/45 hover:to-amber-200/50 text-amber-50 border border-yellow-200/40 backdrop-blur-sm"
                >
                  Buy ({SKINS[selectedSkinIndex].cost}⭐)
                </button>
              )}
            </div>

            {/* Bottom Buttons */}
            <div className="flex gap-6">
              <button
                onClick={startGame}
                disabled={!selectedSkin}
                className={`px-10 py-4 text-xl font-bold rounded-2xl shadow-xl transition-all ${
                  selectedSkin
                    ? 'bg-gradient-to-r from-cyan-200/30 via-blue-300/35 to-purple-300/40 hover:from-cyan-100/40 hover:via-blue-200/45 hover:to-purple-200/50 text-cyan-50 border border-cyan-200/40 backdrop-blur-sm hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] animate-pulse'
                    : 'bg-slate-500/30 text-slate-300 cursor-not-allowed border border-slate-400/30 backdrop-blur-sm'
                }`}
              >
                Play Game
              </button>
              <button
                onClick={exitGame}
                className="px-10 py-4 text-xl font-bold rounded-2xl shadow-xl transition-all bg-gradient-to-r from-slate-200/30 via-gray-300/25 to-zinc-300/30 hover:from-slate-100/40 hover:via-gray-200/35 hover:to-zinc-200/40 text-slate-600 border border-slate-200/40 backdrop-blur-sm hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      {mode === 'playing' && (
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full z-10"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.1)', // Semi-transparent background for debugging
              border: '2px solid red' // Red border for debugging
            }}
          />
          <div className="absolute top-4 left-4 ocean-dark-text text-lg font-bold">Stars: {sessionStars}</div>
          <button onClick={exitGame} className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-200/30 via-gray-300/25 to-zinc-300/30 hover:from-slate-100/40 hover:via-gray-200/35 hover:to-zinc-200/40 text-slate-600 border border-slate-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]">Exit</button>

          {/* Fade transition overlay */}
          {gameTransition && (
            <div className={`absolute inset-0 z-20 transition-opacity duration-500 ${
              gameTransition === 'fade-in' ? 'bg-black/80' : 'bg-black/0'
            } ${gameTransition === 'fade-out' ? 'bg-black/80' : 'bg-black/0'}`} />
          )}
        </>
      )}

      {/* Game Over */}
      {mode === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="bg-white p-8 rounded-2xl text-center">
            <div className="text-3xl mb-4">Game Over</div>
            <div>You earned {sessionStars} stars</div>
            <div className="mt-4 flex gap-4">
              <button onClick={() => setMode('select')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-200/30 via-blue-300/35 to-purple-300/40 hover:from-cyan-100/40 hover:via-blue-200/45 hover:to-purple-200/50 text-cyan-50 border border-cyan-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]">Play Again</button>
              <button onClick={exitGame} className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-200/30 via-gray-300/25 to-zinc-300/30 hover:from-slate-100/40 hover:via-gray-200/35 hover:to-zinc-200/40 text-slate-600 border border-slate-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]">Exit</button>
            </div>
          </div>
        </div>
      )}

      {/* Win */}
      {mode === 'win' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="bg-white p-8 rounded-2xl text-center">
            <div className="text-3xl mb-4">Congratulations!</div>
            <div>You earned {sessionStars} stars</div>
            <div className="mt-4 flex gap-4">
              <button onClick={() => setMode('select')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-200/30 via-blue-300/35 to-purple-300/40 hover:from-cyan-100/40 hover:via-blue-200/45 hover:to-purple-200/50 text-cyan-50 border border-cyan-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]">Play Again</button>
              <button onClick={exitGame} className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-200/30 via-gray-300/25 to-zinc-300/30 hover:from-slate-100/40 hover:via-gray-200/35 hover:to-zinc-200/40 text-slate-600 border border-slate-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]">Exit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}// UI: Game card
function GameCard({
  gameKey,
  meta,
  onStart,
  onSparkle,
}: {
  gameKey: GameKey;
  meta: { title: string; description: string; gradient: string; accent: string };
  onStart: () => void;
  onSparkle: (n: number, x?: number, y?: number) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleHoverSparkle = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    onSparkle(0, e.clientX, e.clientY); // just visual sparkles without adding stars
  };

  return (
    <div
      ref={cardRef}
      className={`group relative rounded-3xl p-6 md:p-7 border border-white/25 backdrop-blur-md bg-gradient-to-br transform-gpu transition-all duration-300 md:hover:-translate-y-1 md:hover:scale-[1.02] active:scale-[0.99] ${
        meta.gradient
      } shadow-[0_20px_60px_rgba(0,0,0,0.25)] ${meta.accent} overflow-hidden`}
      onMouseMove={handleHoverSparkle}
    >
      {/* glow & particles */}
      <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_40%)]" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-16 w-16 rounded-xl bg-white/40 flex items-center justify-center shadow-inner">
            {gameKey === "game1" && <img src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/lgg1?updatedAt=1759532429487" alt="Game 1 Icon" className="w-24 h-24 object-contain" />}
            {gameKey === "game2" && <img src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/lgg2?updatedAt=1759520737598" alt="Game 2 Icon" className="w-24 h-24 object-contain" />}
            {gameKey === "game3" && <img src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/lgg3?updatedAt=1759520737410" alt="Game 3 Icon" className="w-24 h-24 object-contain" />}
          </div>
          <h2 className="text-2xl font-bold ocean-dark-text drop-shadow-sm">{meta.title}</h2>
        </div>
        <p className="ocean-dark-text/85 mb-6">{meta.description}</p>

        {/* placeholder art */}
        <div className="relative flex-1 min-h-[140px] rounded-2xl bg-white/30 border border-white/30 shadow-inner overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.6),transparent_60%)]" />
          {gameKey === "game1" && (
            <video
              className="w-full h-full object-cover rounded-xl"
              src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/vidg1?updatedAt=1759520180332"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          )}
          {gameKey === "game2" && (
            <video
              className="w-full h-full object-cover rounded-xl"
              src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/vidg2?updatedAt=1759520181622"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          )}
          {gameKey === "game3" && (
            <video
              className="w-full h-full object-cover rounded-xl"
              src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/vidg3?updatedAt=1759520180647"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              onSparkle(0, rect.left + rect.width / 2, rect.top);
              onStart();
            }}
            className="relative inline-flex items-center justify-center w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-200/30 via-blue-300/35 to-purple-300/40 hover:from-cyan-100/40 hover:via-blue-200/45 hover:to-purple-200/50 text-cyan-50 border border-cyan-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
          >
            <span className="relative z-10">Start</span>
            <span className="absolute inset-0 rounded-2xl ring-2 ring-white/60 -slow" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: Tutorial
function TutorialModal({
  gameKey,
  meta,
  onStart,
  onClose,
}: {
  gameKey: GameKey;
  meta: { title: string; description: string };
  onStart: () => void;
  onClose: () => void;
}) {
  const controls = useMemo(() => {
    if (gameKey === "game1")
      return [
        "Drag creatures to matching silhouettes.",
        "Drop correctly to earn stars.",
        "Touch: press and hold then move.",
      ];
    if (gameKey === "game2")
      return [
        "Auto-run: your character runs left→right automatically.",
        "Avoid obstacles coming from the right; collect Lucky Stars (+2).",
        "Speed increases as you pass obstacles or collect stars.",
        "Exit is always available in the top-right.",
      ];
    return [
      "Explore 15 different ocean-themed words.",
      "Each word has 1-2 missing letters.",
      "Click the floating letter treasures to complete words.",
      "Complete each word to earn 1 Lucky Star!",
    ];
  }, [gameKey]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-[92%] max-w-xl rounded-3xl border border-white/25 bg-gradient-to-b from-white/60 to-white/30 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] animate-scale-in">
        <h3 className="text-2xl font-bold mb-2 text-slate-900 drop-shadow">{meta.title}</h3>
        <p className="text-slate-700 mb-4">{meta.description}</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-800 mb-6">
          {controls.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
        <div className="flex gap-3 justify-end">
          <button
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-200/30 via-gray-300/25 to-zinc-300/30 hover:from-slate-100/40 hover:via-gray-200/35 hover:to-zinc-200/40 text-slate-600 border border-slate-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-200/30 via-blue-300/35 to-purple-300/40 hover:from-cyan-100/40 hover:via-blue-200/45 hover:to-purple-200/50 text-cyan-50 border border-cyan-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
            onClick={onStart}
          >
            Start Game
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        .animate-fade-in { animation: fade-in .25s ease-out; }
        @keyframes scale-in { from { opacity: 0; transform: translateY(8px) scale(.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .animate-scale-in { animation: scale-in .25s ease-out; }
      `}</style>
    </div>
  );
}

// ===== Ocean Word Hunt Game =====
function OceanWordHunt({ onClose, onEarnStars }: { onClose: () => void; onEarnStars: (n: number, x?: number, y?: number) => void }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [visibleWord, setVisibleWord] = useState<string>("");
  const [missingLetters, setMissingLetters] = useState<string[]>([]);
  const [floatingLetters, setFloatingLetters] = useState<Array<{letter: string, x: number, y: number, id: string}>>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [mascotReaction, setMascotReaction] = useState<'happy' | 'sad' | null>(null);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const ORIGINAL_WORDS = ["OCEAN", "WAVE", "SHELL", "CORAL", "FISH", "WHALE", "TURTLE", "DOLPHIN", "SHARK", "PEARL", "SEAWEED", "ISLAND", "BOAT", "STARFISH", "CRAB"];

  // Shuffle words for random order (only once per game session)
  const shuffleArray = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const OCEAN_LETTERS: Record<string, string> = {
    "A": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/7.png?updatedAt=1759403594254",
    "B": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/8.png?updatedAt=1759403594750",
    "C": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/9.png?updatedAt=1759403594723",
    "D": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/10.png?updatedAt=1759403594721",
    "E": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/11.png?updatedAt=1759403594521",
    "F": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/12.png?updatedAt=1759403594597",
    "G": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/13.png?updatedAt=1759403594675",
    "H": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/14.png?updatedAt=1759403594493",
    "I": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/15.png?updatedAt=1759403594573",
    "J": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/16.png?updatedAt=1759403594648",
    "K": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/17.png?updatedAt=1759403594346",
    "L": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/18.png?updatedAt=1759403594701",
    "M": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/19.png?updatedAt=1759403594685",
    "N": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/20.png?updatedAt=1759403594694",
    "O": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/21.png?updatedAt=1759403594706",
    "P": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/22.png?updatedAt=1759403594857",
    "Q": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/23.png?updatedAt=1759403594716",
    "R": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/24.png?updatedAt=1759403594736",
    "S": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/25.png?updatedAt=1759403594774",
    "T": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/26.png?updatedAt=1759403594693",
    "U": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/27.png?updatedAt=1759403594761",
    "V": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/28.png?updatedAt=1759403594749",
    "W": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/29.png?updatedAt=1759403594775",
    "X": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/30.png?updatedAt=1759403594660",
    "Y": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/31.png?updatedAt=1759403594667",
    "Z": "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/ABC/32.png?updatedAt=1759403594662"
  };

  // Generate visible word with hidden letters
  const generateVisibleWord = (word: string) => {
    const wordLength = word.length;
    let hiddenCount = wordLength <= 3 ? 1 : Math.random() < 0.6 ? 1 : 2;

    const positionsToHide = [];
    while (positionsToHide.length < hiddenCount) {
      const pos = Math.floor(Math.random() * wordLength);
      if (!positionsToHide.includes(pos)) {
        positionsToHide.push(pos);
      }
    }

    const missing = positionsToHide.map(pos => word[pos]);
    const visible = word.split('').map((letter, i) =>
      positionsToHide.includes(i) ? '_' : letter
    ).join('');

    return { visible, missing };
  };

  // Generate floating letters (unique, non-overlapping with collision detection)
  const generateFloatingLetters = (missing: string[], word: string) => {
    const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    // Ensure UNIQUE letters only - no duplicates in the same round
    const usedLetters = new Set(missing); // Start with missing letters
    const availableLetters = allLetters.filter(letter => !usedLetters.has(letter));

    // Add correct letters first
    const letters = [...missing];

    // Add unique decoy letters (no duplicates)
    const decoyCount = Math.min(10, availableLetters.length); // Limit decoys to keep it manageable
    const selectedDecoys = [];

    // Shuffle available letters to randomize selection
    for (let i = availableLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableLetters[i], availableLetters[j]] = [availableLetters[j], availableLetters[i]];
    }

    // Take the first decoyCount letters (guaranteed unique)
    for (let i = 0; i < decoyCount && i < availableLetters.length; i++) {
      selectedDecoys.push(availableLetters[i]);
    }

    letters.push(...selectedDecoys);

    // Final shuffle of all letters
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    // COLLISION-BASED PLACEMENT SYSTEM
    // Each letter gets a unique position with minimum spacing

    const letterSize = 120; // 120px for better spacing
    const minSpacing = 120; // 120px minimum distance between letter centers
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Central zone: middle 30% of screen (reserved for word + UI)
    const centralZone = {
      x: screenWidth * 0.35, // Start at 35% from left (centered 30%)
      y: screenHeight * 0.35, // Start at 35% from top (centered 30%)
      width: screenWidth * 0.3, // 30% of screen width
      height: screenHeight * 0.3 // 30% of screen height
    };

    // Mascot areas to avoid
    const mascotAreas = [
      { x: 0, y: screenHeight / 2 - 100, width: 200, height: 200 }, // Left mascot
      { x: screenWidth - 200, y: screenHeight / 2 - 100, width: 200, height: 200 } // Right mascot
    ];

    const checkCollision = (x: number, y: number, existingPositions: Array<{x: number, y: number}>) => {
      // Check central zone exclusion (30% middle area)
      if (x + letterSize > centralZone.x && x < centralZone.x + centralZone.width &&
          y + letterSize > centralZone.y && y < centralZone.y + centralZone.height) {
        return true; // Collision with central zone
      }

      // Check mascot areas
      for (const mascot of mascotAreas) {
        if (x + letterSize > mascot.x && x < mascot.x + mascot.width &&
            y + letterSize > mascot.y && y < mascot.y + mascot.height) {
          return true; // Collision with mascot
        }
      }

      // STRICT NO-OVERLAP: Check bounding box collision with existing letters
      // Reject if any overlap OR distance < 120px (bounding box collision detection)
      for (const pos of existingPositions) {
        // Check for bounding box overlap
        const overlap = !(x + letterSize <= pos.x || x >= pos.x + letterSize ||
                         y + letterSize <= pos.y || y >= pos.y + letterSize);
        if (overlap) {
          return true; // Bounding box overlap detected
        }

        // Also check minimum distance (120px between centers)
        const dx = Math.abs(x + letterSize/2 - (pos.x + letterSize/2));
        const dy = Math.abs(y + letterSize/2 - (pos.y + letterSize/2));
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minSpacing) {
          return true; // Too close to existing letter
        }
      }

      return false; // No collision
    };

    const floating = [];
    const maxAttempts = 20; // Max 20 retries per letter (strict no-overlap rule)

    for (const letter of letters) {
      let x, y, attempts = 0;
      let placed = false;

      // Try to find a valid position with strict collision checking
      while (!placed && attempts < maxAttempts) {
        // Generate random position within safe bounds
        x = Math.random() * (screenWidth - letterSize - 100) + 50;  // 50px margins
        y = Math.random() * (screenHeight - letterSize - 300) + 150; // Account for HUD and bottom

        // Check if this position is collision-free
        if (!checkCollision(x, y, floating.map(f => ({ x: f.x, y: f.y })))) {
          placed = true;
        }
        attempts++;
      }

      // If letter found a valid position, add it; otherwise skip it (reduce letter count)
      if (placed) {
        floating.push({
          letter,
          x,
          y,
          id: `${letter}-${Date.now()}-${Math.random()}`
        });
      } else {
        console.warn(`Could not find collision-free spot for letter ${letter} after ${maxAttempts} attempts. Skipping this letter.`);
        // Letter is skipped - round will have fewer letters if needed
      }
    }

    // CRITICAL: Ensure all missing letters are placed (required for gameplay)
    // If any missing letters were skipped, force place them in safe corners
    for (const missingLetter of missing) {
      if (!floating.some(f => f.letter === missingLetter)) {
        console.warn(`CRITICAL: Missing letter ${missingLetter} was skipped! Forcing placement.`);
        // Force place in a guaranteed safe corner
        const safeX = screenWidth - letterSize - 100;
        const safeY = screenHeight - letterSize - 150;
        floating.push({
          letter: missingLetter,
          x: safeX,
          y: safeY,
          id: `${missingLetter}-forced-${Date.now()}`
        });
      }
    }

    return floating;
  };

  // Setup next word
  const setupWord = () => {
    if (currentWordIndex >= shuffledWords.length) {
      setIsComplete(true);
      return;
    }

    const word = shuffledWords[currentWordIndex];
    const { visible, missing } = generateVisibleWord(word);
    const floating = generateFloatingLetters(missing, word);

    setVisibleWord(visible);
    setMissingLetters(missing);
    setFloatingLetters(floating);
  };

  // Handle letter click
  const handleLetterClick = (clickedLetter: string, id: string) => {
    if (missingLetters.includes(clickedLetter)) {
      // Correct letter
      const word = shuffledWords[currentWordIndex];
      const newVisible = visibleWord.split('').map((char, i) =>
        char === '_' && word[i] === clickedLetter ? clickedLetter : char
      ).join('');

      setVisibleWord(newVisible);
      setScore(prev => prev + 1);

      // Show happy mascot
      setMascotReaction('happy');
      setTimeout(() => setMascotReaction(null), 2500);

      // Remove the letter from floating
      setFloatingLetters(prev => prev.filter(l => l.id !== id));

      // Remove from missing letters
      setMissingLetters(prev => prev.filter(l => l !== clickedLetter));

      // Check if word is complete
      if (!newVisible.includes('_')) {
        const newWordsCompleted = wordsCompleted + 1;

        // Check if this is the 15th word (final completion)
        if (currentWordIndex === 14) { // 0-based index, so 14 is the 15th word
          // FINAL WORD COMPLETED - End game immediately
          setWordsCompleted(newWordsCompleted);
          onEarnStars(1); // Award the final star
          setTimeout(() => {
            setIsComplete(true);
          }, 1500); // Brief delay to show completion
        } else {
          // Normal word completion - continue to next word
          setWordsCompleted(newWordsCompleted);
          // Earn 1 Lucky Star per completed word
          onEarnStars(1);
          setTimeout(() => {
            setCurrentWordIndex(prev => prev + 1);
            setupWord();
          }, 1500);
        }
      }
    } else {
      // Wrong letter
      setScore(prev => Math.max(0, prev - 1));
      // Show sad mascot
      setMascotReaction('sad');
      setTimeout(() => setMascotReaction(null), 2500);
      // Animate wrong letter (shake and disappear)
      setFloatingLetters(prev => prev.filter(l => l.id !== id));
    }
  };

  // Skip to next word
  const skipWord = () => {
    setCurrentWordIndex(prev => prev + 1);
    setupWord();
  };

  // Reset game for new session
  const resetGame = () => {
    const shuffled = shuffleArray(ORIGINAL_WORDS);
    setShuffledWords(shuffled);
    setCurrentWordIndex(0);
    setScore(0);
    setWordsCompleted(0);
    setIsComplete(false);
    setMascotReaction(null);
    setVisibleWord("");
    setMissingLetters([]);
    setFloatingLetters([]);
  };

  // Initialize shuffled words and first word
  useEffect(() => {
    // Shuffle words once per game session
    const shuffled = shuffleArray(ORIGINAL_WORDS);
    setShuffledWords(shuffled);
    setCurrentWordIndex(0);
    setScore(0);
    setWordsCompleted(0);
    setIsComplete(false);
  }, []);

  // Setup word when shuffledWords is ready
  useEffect(() => {
    if (shuffledWords.length > 0 && currentWordIndex < shuffledWords.length) {
      setupWord();
    }
  }, [shuffledWords, currentWordIndex]);

  return (
    <div className="fixed inset-0 z-[70]">
      <video className="absolute inset-0 w-full h-full object-cover" src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/game3.%20mp4?updatedAt=1759409518855" autoPlay muted loop playsInline preload="auto" />
      <div className="absolute inset-0 bg-black/30" />

      {/* Mascot Reaction Overlay - Only show during active gameplay */}
      {!isComplete && mascotReaction && (
        <div className="fixed z-[80] pointer-events-none" style={{
          top: '50%',
          [mascotReaction === 'happy' ? 'left' : 'right']: '20px',
          transform: 'translateY(-50%)'
        }}>
          <img
            src={mascotReaction === 'happy'
              ? "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/MC%20VUI?updatedAt=1759478885545"
              : "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/MC%20BU%E1%BB%92N?updatedAt=1759478885397"
            }
            alt={mascotReaction === 'happy' ? 'Happy Mascot' : 'Sad Mascot'}
            className="w-96 h-96 object-contain"
            style={{
              animation: 'mascotZoom 2.5s ease-in-out'
            }}
          />
        </div>
      )}

      {/* HUD - Only show during active gameplay */}
      {!isComplete && (
        <div className="absolute top-4 left-4 z-[80] flex items-center gap-4 ocean-dark-text">
          <div className="px-3 py-1 rounded-xl bg-black/30 border border-white/30 backdrop-blur-md">
            Score: <span className="font-bold">{score}</span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-black/30 border border-white/30 backdrop-blur-md">
            Words: <span className="font-bold">{currentWordIndex + 1}/15</span>
          </div>
        </div>
      )}

      {/* Close button - Only show during active gameplay */}
      {!isComplete && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[80] px-4 py-2 rounded-xl bg-gradient-to-r from-slate-200/30 via-gray-300/25 to-zinc-300/30 hover:from-slate-100/40 hover:via-gray-200/35 hover:to-zinc-200/40 text-slate-600 border border-slate-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
        >
          Close
        </button>
      )}

      {/* Main game area - Only show during active gameplay */}
      {!isComplete && (
        <div ref={containerRef} className="relative z-10 h-full flex flex-col items-center justify-center ocean-dark-text">

          {/* Word display */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Find the missing letters!</h2>
            <div className="text-6xl font-mono font-bold tracking-wider bg-black/30 px-8 py-4 rounded-xl border border-white/30 backdrop-blur-md text-primary">
              {visibleWord.split('').map((char, i) => (
                <span key={i} className="inline-block mx-1">
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Skip button */}
          <button
            onClick={skipWord}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-200/30 via-purple-300/35 to-fuchsia-300/40 hover:from-violet-100/40 hover:via-purple-200/45 hover:to-fuchsia-200/50 text-violet-50 border border-violet-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
          >
            Skip Word
          </button>
        </div>
      )}

      {/* Floating letters - Only show during active gameplay */}
      {!isComplete && floatingLetters.map(({letter, x, y, id}) => (
        <button
          key={id}
          onClick={() => handleLetterClick(letter, id)}
          className="fixed w-32 h-32 transition-transform hover:scale-110 active:scale-95 z-[75]"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            animation: `oceanCurrentDrift ${2.5 + Math.random() * 1.5}s ease-in-out infinite`, // Slower, more gentle than before
            animationDelay: `${Math.random() * 3}s`
          }}
        >
          <img
            src={OCEAN_LETTERS[letter]}
            alt={letter}
            className="w-full h-full object-contain drop-shadow-lg animate-ocean-glow"
          />
        </button>
      ))}

      {/* Completion screen */}
      {isComplete && (
        <div className="fixed inset-0 z-[85] bg-gradient-to-br from-cyan-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-md">
          {/* Celebration animation - enhanced */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Rising bubbles - more intense */}
            {[...Array(20)].map((_, i) => (
              <div
                key={`bubble-${i}`}
                className="absolute rounded-full bg-cyan-300/40 border-2 border-cyan-200/60 animate-celebration-bubble"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  bottom: `-30px`,
                  width: `${25 + Math.random() * 35}px`,
                  height: `${25 + Math.random() * 35}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2.5 + Math.random() * 2}s`
                }}
              />
            ))}

            {/* Enhanced sparkle effects */}
            {[...Array(35)].map((_, i) => (
              <div
                key={`sparkle-${i}`}
                className="absolute w-3 h-3 bg-yellow-200 rounded-full animate-celebration-sparkle shadow-lg"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1.5}s`,
                  animationDuration: `${1.5 + Math.random() * 1}s`
                }}
              />
            ))}

            {/* Wave glow effect */}
            <div className="absolute inset-0 animate-wave-glow">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-blue-400/15 to-cyan-400/10 blur-3xl "></div>
            </div>
          </div>


          <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
            {/* Video background for celebration */}
            <video className="absolute inset-0 w-full h-full object-cover rounded-3xl" src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/game3.%20mp4?updatedAt=1759409518855" autoPlay muted loop playsInline preload="auto" />
            <div className="absolute inset-0 bg-black/60 rounded-3xl" />
            <div className="relative z-10 w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-3xl border-2 border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-10 text-center animate-scale-in">
              <div className="mb-8">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 ocean-dark-text drop-shadow-lg leading-tight">
                  Congratulations!<br/>
                  You have completed the ocean adventure.
                </h2>
                <div className="text-3xl text-cyan-200 font-semibold mb-6">🌊✨</div>
              </div>

              <div className="mb-10">
                <div className="inline-flex items-center gap-4 px-8 py-5 rounded-2xl bg-gradient-to-r from-yellow-200/80 via-yellow-300/85 to-yellow-400/90 ocean-dark-text font-bold text-2xl shadow-2xl backdrop-blur-sm border border-yellow-200/50 hover:shadow-[0_0_20px_rgba(255,193,7,0.4)] transition-all duration-300 hover:scale-105 animate-pulse" style={{boxShadow: '0 0 15px rgba(255, 193, 7, 0.3), 0 0 30px rgba(255, 193, 7, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)'}}>
                  <span className="text-4xl animate-spin">⭐</span>
                  <span className="mx-2">{wordsCompleted} Lucky Stars Earned!</span>
                  <span className="text-4xl animate-spin" style={{animationDirection: 'reverse'}}>⭐</span>
                </div>
              </div>

              <div className="flex gap-6 justify-center">
                <button
                  className="px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-200/30 via-blue-300/35 to-purple-300/40 hover:from-cyan-100/40 hover:via-blue-200/45 hover:to-purple-200/50 text-cyan-50 border border-cyan-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
                  onClick={() => {
                    resetGame();
                    setTimeout(() => {
                      if (shuffledWords.length > 0) {
                        setupWord();
                      }
                    }, 100);
                  }}
                >
                  Play Again
                </button>
                <button
                  className="px-10 py-4 rounded-2xl bg-gradient-to-r from-slate-200/30 via-gray-300/25 to-zinc-300/30 hover:from-slate-100/40 hover:via-gray-200/35 hover:to-zinc-200/40 text-slate-600 border border-slate-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
                  onClick={onClose}
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        .animate-fade-in { animation: fade-in .25s ease-out; }
        @keyframes scale-in { from { opacity: 0; transform: translateY(8px) scale(.96) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .animate-scale-in { animation: scale-in .25s ease-out; }

        /* Mascot reactions */
        @keyframes mascotZoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        /* Celebration animations */
        @keyframes mascot-celebration {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          50% { transform: scale(1.2) rotate(0deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }
        .animate-mascot-celebration { animation: mascot-celebration 2s ease-in-out infinite; }

        @keyframes mascot-bounce {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          25% { transform: translate(-50%, -50%) scale(1.05) translateY(-10px); }
          50% { transform: translate(-50%, -50%) scale(1.1) translateY(-20px); }
          75% { transform: translate(-50%, -50%) scale(1.05) translateY(-10px); }
        }
        .animate-mascot-bounce { animation: mascot-bounce 2s ease-in-out infinite; }

        @keyframes celebration-bubble {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(1.2); opacity: 0; }
        }
        .animate-celebration-bubble { animation: celebration-bubble linear infinite; }

        @keyframes celebration-sparkle {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(180deg); opacity: 1; }
        }
        .animate-celebration-sparkle { animation: celebration-sparkle ease-in-out infinite; }

        @keyframes wave-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .animate-wave-glow { animation: wave-glow 3s ease-in-out infinite; }

        /* Floating letter animations - gentle seaweed/bubble drift */
        @keyframes oceanCurrentDrift {
          0% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateX(3px) translateY(-2px) rotate(0.5deg);
          }
          50% {
            transform: translateX(-2px) translateY(-1px) rotate(-0.3deg);
          }
          75% {
            transform: translateX(1px) translateY(3px) rotate(0.2deg);
          }
          100% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
          }
        }

        /* Ocean glow effect for floating letters - subtle cyan pulsing */
        @keyframes oceanGlow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(103, 232, 249, 0.3)) drop-shadow(0 0 16px rgba(103, 232, 249, 0.1));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(103, 232, 249, 0.5)) drop-shadow(0 0 24px rgba(103, 232, 249, 0.2));
          }
        }
        .animate-ocean-glow {
          animation: oceanGlow 4s ease-in-out infinite;
        }

        /* Firework animation */
        @keyframes firework {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
            display: none;
          }
        }

        .animate-firework {
          animation: firework 2s ease-out infinite;
        }
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
          <button type="submit" className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-200/30 via-green-300/35 to-teal-300/40 hover:from-emerald-100/40 hover:via-green-200/45 hover:to-teal-200/50 text-emerald-50 border border-emerald-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]">Submit</button>
          <button type="button" className="px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-200/30 via-blue-300/35 to-purple-300/40 hover:from-cyan-100/40 hover:via-blue-200/45 hover:to-purple-200/50 text-cyan-50 border border-cyan-200/40 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]" onClick={useHint}>Hint</button>
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
  { key: "fish", name: "Angelfish", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/37.png?updatedAt=1759317103184", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/28.png?updatedAt=1759333631132" },
  { key: "jellyfish", name: "Jellyfish", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/BRIEF%20GIAO%20DIE%CC%A3%CC%82N%20(1).png?updatedAt=1759335300432", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/23.png?updatedAt=1759333630647" },
  { key: "dolphin", name: "Dolphin", img: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/25%20ma%CC%80u.png?updatedAt=1759340404978", shadow: "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/25.png?updatedAt=1759335775054" },
];

const G1_CREATURE_DESCRIPTIONS: Record<string, string> = {
  whale: "A blue whale's heart is the size of a car, but when it dives, it beats only twice a minute—like it's super chill. Baby whales chug 200 liters of milk every day, basically living on milkshakes. Their poop is bright orange and floats, which sounds gross but helps the planet. And their songs? Louder than your Wi-Fi signal!",
  shell: "Seashells are like ocean houses for snails and clams, and they keep growing as the animal gets bigger—no moving trucks needed. Each shell is one-of-a-kind, and some even make pearls. And that 'ocean sound' you hear when you hold a shell? Sorry, it's just your own blood echoing.",
  starfish: "Starfish aren't really fish—they don't even have blood or fins. Instead, they use seawater as their 'fuel.' Lose an arm? No problem, they just grow another, sometimes even a whole new body. Oh, and they eat by throwing their stomachs out of their mouths—imagine doing that at a pizza party.",
  crab: "Crabs walk sideways like they're doing a silly dance, but actually, they can move in any direction. Some are tiny, others are huge coconut-smashers. When they outgrow their shells, they're naked for a while—basically 'crab in pajamas.' Some even decorate themselves with seaweed, like underwater fashion models.",
  turtle: "Sea turtles have been around since dinosaur times and can live for more than 100 years—basically the grandparents of the ocean. Baby turtles race to the sea using the moon as their GPS, but sometimes get lost and head to a parking lot instead. And no, they can't hide in their shells like cartoons, but they do travel across entire oceans just to come back home and lay eggs.",
  seahorse: "Seahorses are such poor swimmers that if there were a contest for 'the slowest in the ocean,' they would almost always win. Yet they've thrived for millions of years – the ultimate example of 'slow living in the sea.'",
  squid: "Squids have three hearts. Two pump blood to the gills, and one pumps it to the rest of the body. Which means when they get heartbroken, it hurts three times as much.",
  jellyfish: "Jellyfish have no brain, no heart, no bones… and yet they've been around for over 500 million years – way longer than dinosaurs. Kind of like, 'no brain, no heart, no problems.'",
  fish: "Angelfish in the wild can actually 'change gender'! If a dominant male is missing from the group, a female can transform into a male to take on the leading role. This mechanism helps the school of fish maintain reproductive balance.",
  dolphin: "Dolphins sometimes 'store' air bubbles just to play with them like balloons underwater. They also enjoy teasing sea turtles, much like mischievous kids in a classroom.",
};

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
      <video className="absolute inset-0 w-full h-full object-cover" src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/game1.%20mp4?updatedAt=1759396550237" autoPlay muted loop playsInline preload="auto" />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex flex-col h-full ocean-dark-text">
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
                    <img src={c.img} alt={c.name} className="w-full h-full object-contain cursor-grab active:cursor-grabbing drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" onPointerDown={startDrag(c.key)} draggable={false} />
                  ) : (
                    <div className="ocean-dark-text/60 text-sm">Placed</div>
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
          <div className="fixed inset-0 z-[85] bg-gradient-to-br from-cyan-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-md">
            {/* Celebration animation - enhanced */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Rising bubbles - more intense */}
              {[...Array(20)].map((_, i) => (
                <div
                  key={`bubble-${i}`}
                  className="absolute rounded-full bg-cyan-300/40 border-2 border-cyan-200/60 animate-celebration-bubble"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    bottom: `-30px`,
                    width: `${25 + Math.random() * 35}px`,
                    height: `${25 + Math.random() * 35}px`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2.5 + Math.random() * 2}s`
                  }}
                />
              ))}

              {/* Enhanced sparkle effects */}
              {[...Array(35)].map((_, i) => (
                <div
                  key={`sparkle-${i}`}
                  className="absolute w-3 h-3 bg-yellow-200 rounded-full animate-celebration-sparkle shadow-lg"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 1.5}s`,
                    animationDuration: `${1.5 + Math.random() * 1}s`
                  }}
                />
              ))}

              {/* Wave glow effect */}
              <div className="absolute inset-0 animate-wave-glow">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-blue-400/15 to-cyan-400/10 blur-3xl "></div>
              </div>
            </div>


            <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
              {/* Video background for celebration */}
              <video className="absolute inset-0 w-full h-full object-cover rounded-3xl" src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/game1.%20mp4?updatedAt=1759396550237" autoPlay muted loop playsInline preload="auto" />
              <div className="absolute inset-0 bg-black/60 rounded-3xl" />
              <div className="relative z-10 w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-3xl border-2 border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-10 text-center animate-scale-in">
                <div className="mb-8">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 ocean-dark-text drop-shadow-lg leading-tight">
                    Well done!<br/>
                    You matched all creatures!
                  </h2>
                  <div className="text-3xl text-cyan-200 font-semibold mb-6">🐠✨</div>
                </div>

                <div className="mb-10">
                  <div className="inline-flex items-center gap-4 px-8 py-5 rounded-2xl bg-gradient-to-r from-yellow-200/80 via-yellow-300/85 to-yellow-400/90 ocean-dark-text font-bold text-2xl shadow-2xl backdrop-blur-sm border border-yellow-200/50 hover:shadow-[0_0_20px_rgba(255,193,7,0.4)] transition-all duration-300 hover:scale-105 animate-pulse" style={{boxShadow: '0 0 15px rgba(255, 193, 7, 0.3), 0 0 30px rgba(255, 193, 7, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)'}}>
                    <span className="text-4xl animate-spin">⭐</span>
                    <span className="mx-2">{score} Lucky Stars Earned!</span>
                    <span className="text-4xl animate-spin" style={{animationDirection: 'reverse'}}>⭐</span>
                  </div>
                </div>

                <div className="flex gap-6 justify-center">
                  <button
                    className="px-10 py-4 rounded-2xl bg-gradient-to-r from-yellow-200/10 via-yellow-300/12 to-yellow-400/15 hover:from-yellow-100/20 hover:via-yellow-200/25 hover:to-yellow-300/30 ocean-dark-text border border-yellow-200/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,193,7,0.6)]"
                    onClick={() => { onEarnStars(score); setCompleted(false); resetGame(); }}
                  >
                    Play Again
                  </button>
                  <button
                    className="px-10 py-4 rounded-2xl bg-gradient-to-r from-yellow-200/10 via-yellow-300/12 to-yellow-400/15 hover:from-yellow-100/20 hover:via-yellow-200/25 hover:to-yellow-300/30 ocean-dark-text border border-yellow-200/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,193,7,0.6)]"
                    onClick={commitStarsAndClose}
                  >
                    Exit
                  </button>
                </div>
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
                  <h4 className="text-xl font-bold text-center">{infoKey === "fish" ? "Angelfish" : c.name}</h4>
                  <p className="text-slate-700 text-center">{G1_CREATURE_DESCRIPTIONS[infoKey!] || "Description not found."}</p>
                  <button className="justify-self-center px-4 py-2 rounded-xl bg-slate-900 ocean-dark-text" onClick={() => setInfoKey(null)}>Close</button>
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
