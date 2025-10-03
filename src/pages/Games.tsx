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


export default Games;
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

function Game2RunnerFullscreen({ onClose, onEarnStars }: { onClose: () => void; onEarnStars: (n: number, x?: number, y?: number) => void }) {
  const { stars: globalStars, unlockedSkins, unlockSkin } = useStars();
  const [mode, setMode] = useState<"select" | "running" | "paused" | "gameover" | "win">("select");
  const [selIdx, setSelIdx] = useState<number>(() => {
    // pick random free skin initially
    const free = [0,1,2];
    return free[Math.floor(Math.random() * free.length)];
  });
  const [runStars, setRunStars] = useState(0);
  const [remaining, setRemaining] = useState(14);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const lastTsRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const nextSpawnIndexRef = useRef<number>(0);
  const orderRef = useRef<number[]>([]);
  const playerRef = useRef<{ x:number; y:number; w:number; h:number; speed:number }|null>(null);
  const obstaclesRef = useRef<G2Obstacle[]>([]);
  const pickupsRef = useRef<G2Pickup[]>([]);
  const frameBump = useRef(0); // used to force rerender/debug counters
  const [, setFrame] = useState(0);
  const keysRef = useRef<Record<string,boolean>>({});
  const touchDirRef = useRef<{up:boolean;down:boolean;left:boolean;right:boolean}>({up:false,down:false,left:false,right:false});
  const creditedRef = useRef(false);
  const [isMoving, setIsMoving] = useState(false);
  const movingRef = useRef(false);
  const jumpVelocityRef = useRef(0);
  const isJumpingRef = useRef(false);
  const speedFactorRef = useRef(1);
  const playerSpeedBaseRef = useRef(0);
  const spawnCountRef = useRef(0);
  const laneToggleRef = useRef(true); // alternate lanes to reduce overlap
  const starSpawnTimerRef = useRef(0);
  const starSpawnedRef = useRef(0);
  const nextStarInRef = useRef(0);
  const modeRef = useRef(mode);
  const passedCountRef = useRef(0);

  const shuffle = (arr: number[]) => {
    const a = [...arr];
    for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  };

  // Helper: attempt to spawn next obstacle from the right with progressive speed and non-overlapping spawn area
  const trySpawnObstacle = (rect: DOMRect) => {
    if (nextSpawnIndexRef.current >= orderRef.current.length) return false;
    // Prevent spawn if another obstacle is still in the spawn zone near the right edge
    const spawnZoneX = rect.width * 0.82;
    const zoneOccupied = obstaclesRef.current.some(o => o.x > spawnZoneX && Math.abs(o.y - (rect.height*0.5)) < rect.height); // any in zone
    if (zoneOccupied) return false;

    const type = orderRef.current[nextSpawnIndexRef.current++];
    // Size: 3× larger than previous baseline, clamped
    const base = rect.height * 0.12;
    const size = Math.min(rect.height * 0.4, base * 3 * (0.95 + Math.random() * 0.1));
    const laneTop = laneToggleRef.current; laneToggleRef.current = !laneToggleRef.current;
    const bandTop = laneTop ? rect.height * 0.22 : rect.height * 0.58;
    let y = bandTop + (Math.random() * rect.height * 0.12 - rect.height * 0.06);
    const x = rect.width + size + Math.random() * 60;
    // Progressive difficulty: speed increases slightly with each spawn
    const baseSpeed = rect.width * 0.25; // px/s
    const speed = Math.min(baseSpeed * 1.9, baseSpeed * (1 + spawnCountRef.current * 0.035));
    spawnCountRef.current += 1;
    // Ensure no overlap at spawn with neighbors in spawn zone by nudging Y up to a few tries
    let tries = 0;
    while (tries < 8 && obstaclesRef.current.some(o => (o.x > rect.width * 0.9) && (y < o.y + o.h) && (y + size > o.y))) {
      // nudge to another vertical spot within the band to avoid overlap at spawn
      y += size * 0.6 * (tries % 2 === 0 ? 1 : -1);
      // clamp within screen bounds
      y = Math.max(20, Math.min(rect.height - size - 20, y));
      tries++;
    }
    obstaclesRef.current.push({ id: Date.now() + nextSpawnIndexRef.current, type, x, y, w: size, h: size, passed: false, vx: speed });
    return true;
  };

  // Helper: spawn a lucky star from the right at a random lane
  const spawnLuckyStar = (rect: DOMRect) => {
    if (starSpawnedRef.current >= 3) return;
    const x = rect.width + 200 + Math.random() * 200;
    const band = Math.random() < 0.5 ? rect.height * 0.3 : rect.height * 0.7;
    const y = band + (Math.random() * rect.height * 0.12 - rect.height * 0.06);
    const size = Math.max(56, rect.height * 0.07);
    pickupsRef.current.push({ id: Date.now() + starSpawnedRef.current, x, y, w: size, h: size, collected: false });
    starSpawnedRef.current += 1;
    // schedule next star in 3-6s
    starSpawnTimerRef.current = 0;
    nextStarInRef.current = 3 + Math.random() * 3;
  };

  const startRun = () => {
    modeRef.current = "running";
    setMode("running");
    setRunStars(0);
    creditedRef.current = false;
    // init player and entities
    const rect = containerRef.current!.getBoundingClientRect();
    // Make the sprite roughly 3× bigger than the earlier baseline
    const pw = Math.max(120, Math.min(240, rect.width * 0.12));
    const ph = pw;
    playerRef.current = { x: rect.width * 0.12, y: rect.height * 0.5, w: pw, h: ph, speed: Math.max(180, rect.width * 0.35) };
    // auto-run setup
    // Base speed factor starts at 2 (as requested)
    speedFactorRef.current = 2;
    playerSpeedBaseRef.current = Math.max(140, rect.width * 0.22);
    setIsMoving(true);
    movingRef.current = true;
    obstaclesRef.current = [];
    pickupsRef.current = [];
    // spawn order: each of 7 twice
    orderRef.current = shuffle([...Array(7).keys(), ...Array(7).keys()]);
    nextSpawnIndexRef.current = 0;
    spawnTimerRef.current = 0;
    spawnCountRef.current = 0;
    laneToggleRef.current = true;
    // spawn first obstacle immediately so gameplay starts right away
    trySpawnObstacle(rect);
    // make first obstacle visible immediately by placing it slightly inside the right edge
    if (obstaclesRef.current.length > 0) {
      const first = obstaclesRef.current[0];
      first.x = Math.min(first.x, rect.width - first.w * 0.8);
    }
    // reset lucky star timers
    starSpawnedRef.current = 0;
    starSpawnTimerRef.current = 0;
    nextStarInRef.current = 2 + Math.random() * 2; // first star between 2-4s
    passedCountRef.current = 0;
    frameBump.current = 0;
    setRemaining(orderRef.current.length);
    lastTsRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  };

  const endRun = (win: boolean) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    modeRef.current = win ? "win" : "gameover";
    setMode(win ? "win" : "gameover");
    if (!creditedRef.current) {
      creditedRef.current = true;
      onEarnStars(runStars);
    }
  };

  const loop = (ts: number) => {
    const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
    lastTsRef.current = ts;
    const el = containerRef.current;
    const player = playerRef.current;
    if (!el || !player) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    
    // Skip updates if not running, but keep loop alive
    if (mode !== 'running') {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    
    const rect = el.getBoundingClientRect();
    const baseSpeed = rect.width * 0.25; // px/s (reference only)

    // auto-run: move player to the right continuously
    if (!isMoving) { setIsMoving(true); }
    movingRef.current = true;
    // keyboard adjustments (WASD/Arrows) while preserving forward motion
    const k = keysRef.current;
    let ax = 0, ay = 0;
    if (k["arrowup"]||k["w"]) ay -= 1;
    if (k["arrowdown"]||k["s"]) ay += 1;
    if (k["arrowleft"]||k["a"]) ax -= 1;
    if (k["arrowright"]||k["d"]) ax += 1;
    const amag = Math.hypot(ax, ay) || 1;
    const lateralSpeed = playerSpeedBaseRef.current * 0.6;
    player.x += playerSpeedBaseRef.current * speedFactorRef.current * dt + (ax/amag) * lateralSpeed * dt;
    
    // Jump physics (gravity + velocity)
    if (isJumpingRef.current) {
      const gravity = 1800; // px/s²
      jumpVelocityRef.current += gravity * dt;
      player.y += jumpVelocityRef.current * dt;
      // Land on ground
      const groundY = rect.height * 0.5;
      if (player.y >= groundY) {
        player.y = groundY;
        isJumpingRef.current = false;
        jumpVelocityRef.current = 0;
      }
    } else {
      player.y += (ay/amag) * lateralSpeed * dt;
    }
    
    // bounds
    player.x = Math.max(0, Math.min(rect.width - player.w, player.x));
    player.y = Math.max(0, Math.min(rect.height - player.h, player.y));
    
    // Loop player back to start when reaching right edge
    if (player.x >= rect.width - player.w) {
      player.x = 0;
    }

    // spawn obstacles sequentially (non-overlapping at spawn), with progressive speed
    spawnTimerRef.current += dt;
    const targetInterval = 1.1 + Math.random() * 0.6; // 1.1 - 1.7s between spawns
    if (nextSpawnIndexRef.current < orderRef.current.length && spawnTimerRef.current >= targetInterval) {
      // Only spawn if spawn zone is clear
      if (trySpawnObstacle(rect)) {
        spawnTimerRef.current = 0;
      }
    }

    // Lucky stars: spawn randomly up to 3 during run
    starSpawnTimerRef.current += dt;
    if (starSpawnedRef.current < 3 && starSpawnTimerRef.current >= nextStarInRef.current) {
      spawnLuckyStar(rect);
    }

    // move obstacles and pickups
    obstaclesRef.current.forEach(o => { o.x -= (o.vx * speedFactorRef.current) * dt; });
    // pickups move a bit slower than average obstacle
    const starSpeed = rect.width * 0.22;
    pickupsRef.current.forEach(p => p.x -= starSpeed * speedFactorRef.current * dt);
    // remove offscreen
    obstaclesRef.current = obstaclesRef.current.filter(o => o.x + o.w > -20);
    pickupsRef.current = pickupsRef.current.filter(p => p.x + p.w > -20 && !p.collected);

    // scoring: passing obstacles
    obstaclesRef.current.forEach(o => {
      if (!o.passed && (o.x + o.w) < player.x) {
        o.passed = true;
        passedCountRef.current += 1;
        setRunStars(rs => rs + 1);
        // passing an obstacle increases speed slightly for progressive difficulty
        speedFactorRef.current = Math.min(5, speedFactorRef.current + 0.4);
      }
    });
    // remove obstacles that have passed the player
    obstaclesRef.current = obstaclesRef.current.filter(o => !(o.passed && (o.x + o.w) < player.x));
    const notSpawned = orderRef.current.length - nextSpawnIndexRef.current;
    const activeIncoming = obstaclesRef.current.filter(o => !o.passed).length;
    setRemaining(Math.max(0, notSpawned + activeIncoming));

    // collisions
    const px = player.x, py = player.y, pw = player.w, ph = player.h;
    for (const o of obstaclesRef.current) {
      if (px < o.x + o.w && px + pw > o.x && py < o.y + o.h && py + ph > o.y) {
        endRun(false);
        setFrame(f=>f+1);
        return;
      }
    }
    for (const s of pickupsRef.current) {
      if (!s.collected && px < s.x + s.w && px + pw > s.x && py < s.y + s.h && py + ph > s.y) {
        s.collected = true;
        setRunStars(rs => rs + 2);
        // collecting a lucky star increases speed (+0.5)
        speedFactorRef.current = Math.min(5, speedFactorRef.current + 0.4);
      }
    }

    // win check: all spawned and none left on screen
    if (nextSpawnIndexRef.current >= orderRef.current.length && obstaclesRef.current.length === 0) {
      endRun(true);
      setFrame(f=>f+1);
      return;
    }

    // request next frame and force a visual tick every iteration
    frameBump.current += 1;
    setFrame(f=>f+1);
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = e.type === 'keydown';
      if (k === 'escape') { setMode('paused'); }
      // Jump on Space key
      if (k === ' ' && e.type === 'keydown' && !isJumpingRef.current && mode === 'running') {
        isJumpingRef.current = true;
        jumpVelocityRef.current = -600; // initial upward velocity (px/s)
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const currentSkin = G2_SKINS[selIdx];
  const isUnlocked = !!unlockedSkins[currentSkin.id] || currentSkin.cost === 0;
  const debugPlayer = playerRef.current;
  const debugSpeed = speedFactorRef.current;
  const debugObstacleCount = obstaclesRef.current.length;
  const debugPickupCount = pickupsRef.current.length;

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const tryUnlock = () => {
    if (isUnlocked) return;
    const ok = unlockSkin(currentSkin.id, currentSkin.cost);
    if (!ok) toast.error("Not enough stars to unlock this skin.");
    else toast.success("Skin unlocked!");
  };

  const resetAndClose = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); onEarnStars(0); onClose(); };

  return (
    <div className="fixed inset-0 z-[90]">
      <video className="absolute inset-0 w-full h-full object-cover" src={G2_BG} autoPlay muted loop playsInline preload="auto" />
      <div className="absolute inset-0 bg-black/30" />
      <div ref={containerRef} className="relative z-10 h-full w-full overflow-hidden">

        {/* HUD */}
        <div className="absolute top-3 left-3 z-[110] flex items-center gap-2 text-white/95">
          <div className="px-3 py-1 rounded-xl bg-black/30 border border-white/30 backdrop-blur-md">Run Stars: <b>{runStars}</b></div>
          <div className="px-3 py-1 rounded-xl bg-black/30 border border-white/30 backdrop-blur-md">Your Stars: <b>{globalStars}</b></div>
          <div className="px-3 py-1 rounded-xl bg-black/30 border border-white/30 backdrop-blur-md">Left: <b>{remaining}</b></div>
        </div>
        <div className="absolute top-[72px] left-3 z-[110] text-xs text-white/80 font-mono space-y-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 backdrop-blur">
          <div>mode: {mode}</div>
          <div>frame: {frameBump.current}</div>
          <div>speedFactor: {debugSpeed.toFixed(2)}</div>
          {debugPlayer && (
            <>
              <div>player.x: {debugPlayer.x.toFixed(1)}</div>
              <div>player.y: {debugPlayer.y.toFixed(1)}</div>
            </>
          )}
          <div>obstacles: {debugObstacleCount}</div>
          <div>stars: {debugPickupCount}</div>
        </div>
        <div className="absolute top-3 right-3 z-[120] flex items-center gap-2">
          <button onClick={() => setMode(mode === 'paused' ? 'running' : 'paused')} className="px-3 py-1 rounded-xl bg-white/80 text-slate-900">{mode === 'paused' ? 'Resume' : 'Pause'}</button>
          <button onClick={resetAndClose} className="px-3 py-1 rounded-xl bg-white/80 text-slate-900">Exit</button>
        </div>

        {/* Player */}
        {mode !== 'select' && playerRef.current && (
          <div className="absolute will-change-transform" style={{ width: playerRef.current.w, height: playerRef.current.h, transform: `translate3d(${playerRef.current.x}px, ${playerRef.current.y}px, 0)` }}>
            <img
              src={currentSkin.img}
              alt={currentSkin.name}
              className={`w-full h-full object-contain drop-shadow-[0_0_16px_rgba(255,255,255,0.9)] animate-runner-glow ${isMoving ? 'animate-runner-swim' : 'animate-runner-breathe'}`}
            />
          </div>
        )}

        {/* Obstacles */}
        {mode === 'running' && obstaclesRef.current.map(o => (
          <img key={o.id} src={G2_OBS[o.type]} className="absolute animate-enter opacity-70 blur-[1px] will-change-transform" style={{ width: o.w, height: o.h, transform: `translate3d(${o.x}px, ${o.y}px, 0)` }} />
        ))}

        {/* Lucky stars */}
        {mode === 'running' && pickupsRef.current.map(s => (
          <img key={s.id} src={G2_STAR} className="absolute animate-star animate-star-glow animate-star-sparkle will-change-transform" style={{ width: s.w, height: s.h, transform: `translate3d(${s.x}px, ${s.y}px, 0)` }} />
        ))}

        {/* Touch controls removed: auto-run mode */}

        {/* Skin selector */}
        {mode === 'select' && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative w-[92%] max-w-3xl rounded-3xl border border-white/30 bg-white/80 p-6 text-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-g1-pop">
              <h3 className="text-2xl font-bold mb-2 text-center">Choose your character and let's begin.</h3>
              <div className="flex items-center justify-between gap-3">
                <button className="px-3 py-2 rounded-xl bg-white/90" onClick={() => setSelIdx((i) => (i - 1 + G2_SKINS.length) % G2_SKINS.length)}>◀</button>
                <div className="flex flex-col items-center">
                  <div className="w-56 h-56 rounded-2xl bg-white/40 border border-white/30 grid place-items-center overflow-hidden">
                    <img
                      src={currentSkin.img}
                      alt={currentSkin.name}
                      className={`${currentSkin.id === 'oyster' ? 'max-w-[80%] max-h-[80%]' : 'max-w-[100%] max-h-[100%]'} ${(currentSkin.id === 'crab' || currentSkin.id === 'jellyfish') ? 'scale-130' : (['oyster','turtle'].includes(currentSkin.id) ? '' : 'scale-130')} object-contain drop-shadow`}
                    />
                  </div>
                  <div className="mt-2 font-semibold uppercase">{currentSkin.name}</div>
                  {!isUnlocked && (
                    <div className="mt-1 text-sm">Cost: <b>{currentSkin.cost}</b> ⭐</div>
                  )}
                </div>
                <button className="px-3 py-2 rounded-xl bg-white/90" onClick={() => setSelIdx((i) => (i + 1) % G2_SKINS.length)}>▶</button>
              </div>
              {!isUnlocked ? (
                <div className="mt-4 flex justify-center gap-3">
                  <button className="px-4 py-2 rounded-xl bg-yellow-300 text-slate-900 font-semibold" onClick={tryUnlock}>Unlock</button>
                  <button className="px-4 py-2 rounded-xl bg-slate-900 text-white" onClick={() => toast("Need to unlock before playing.")}>Play</button>
                </div>
              ) : (
                <div className="mt-4 flex justify-center">
                  <button className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold" onClick={startRun}>Play</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Game over / Win */}
        {(mode === 'gameover' || mode === 'win') && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-g1-fade" />
            <div className="relative z-10 w-[92%] max-w-md rounded-3xl border border-white/30 bg-white/85 p-6 text-slate-900 shadow-[0_40px_100px_rgba(0,0,0,0.5)] animate-g1-pop">
              <h3 className="text-2xl font-bold mb-2 text-center">{mode === 'win' ? 'Congratulations!' : 'Game Over'}</h3>
              <p className="mb-4 text-center">You earned <b>+{runStars}</b> stars this run.</p>
              <div className="flex gap-3 justify-center">
                <button className="px-4 py-2 rounded-xl bg-white/90 hover:bg-white font-medium" onClick={onClose}>Return</button>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold" onClick={() => { creditedRef.current || onEarnStars(runStars); creditedRef.current = true; setMode('select'); }}>Play Again</button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes runner-glow { 0%,100% { filter: drop-shadow(0 0 10px rgba(255,255,255,0.6)) } 50% { filter: drop-shadow(0 0 18px rgba(125,211,252,1)) } }
        .animate-runner-glow { animation: runner-glow 2s ease-in-out infinite }
        @keyframes enter { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: translateX(0) } }
        .animate-enter { animation: enter .35s ease-out }
        @keyframes starPulse { 0%,100% { transform: scale(1); opacity: .9 } 50% { transform: scale(1.12); opacity: 1 } }
        .animate-star { animation: starPulse 1.2s ease-in-out infinite }
        @keyframes starGlow { 0%,100% { filter: drop-shadow(0 0 8px rgba(250,204,21,0.6)) } 50% { filter: drop-shadow(0 0 16px rgba(250,204,21,1)) } }
        .animate-star-glow { animation: starGlow 1.2s ease-in-out infinite }
        @keyframes starSparkle { 0%,100% { transform: scale(1) rotate(0deg); opacity: 0.85 } 25% { transform: scale(1.15) rotate(5deg); opacity: 1 } 50% { transform: scale(0.95) rotate(-5deg); opacity: 0.9 } 75% { transform: scale(1.1) rotate(3deg); opacity: 1 } }
        .animate-star-sparkle { animation: starSparkle 1.5s ease-in-out infinite }
        @keyframes runner-breathe { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        .animate-runner-breathe { animation: runner-breathe 2.2s ease-in-out infinite }
        @keyframes runner-swim { 0% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-2px) rotate(2deg) } 100% { transform: translateY(0) rotate(-2deg) } }
        .animate-runner-swim { animation: runner-swim .6s ease-in-out infinite }
      `}</style>
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
          <div className="h-10 w-10 rounded-xl bg-white/40 flex items-center justify-center shadow-inner">
            <span className="text-2xl">{gameKey === "game1" ? "🐠" : gameKey === "game2" ? "🪝" : "🧠"}</span>
          </div>
          <h2 className="text-2xl font-bold text-white drop-shadow-sm">{meta.title}</h2>
        </div>
        <p className="text-white/85 mb-6">{meta.description}</p>

        {/* placeholder art */}
        <div className="relative flex-1 min-h-[140px] rounded-2xl bg-white/30 border border-white/30 shadow-inner overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.6),transparent_60%)]" />
          <div className="absolute inset-0 grid place-items-center select-none text-6xl md:text-7xl opacity-80">
            {gameKey === "game1" && "🦀"}
            {gameKey === "game2" && "🐟"}
            {gameKey === "game3" && "🐙"}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              onSparkle(0, rect.left + rect.width / 2, rect.top);
              onStart();
            }}
            className="relative inline-flex items-center justify-center w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-900 font-semibold shadow-[0_10px_30px_rgba(16,185,129,0.45)] transition-transform duration-200 active:scale-95 hover:scale-[1.03] focus:scale-[1.03] focus:outline-none"
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
      "Letters gently drift like ocean currents.",
      "Letters won't overlap with each other or the word display.",
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
            className="px-4 py-2 rounded-xl bg-white/70 hover:bg-white text-slate-900 font-medium shadow"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold shadow"
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
        <div className="absolute top-4 left-4 z-[80] flex items-center gap-4 text-white">
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
          className="absolute top-4 right-4 z-[80] px-4 py-2 rounded-xl bg-white/80 text-slate-900 font-semibold shadow hover:bg-white active:scale-95"
        >
          Close
        </button>
      )}

      {/* Main game area - Only show during active gameplay */}
      {!isComplete && (
        <div ref={containerRef} className="relative z-10 h-full flex flex-col items-center justify-center text-white">

          {/* Word display */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Find the missing letters!</h2>
            <div className="text-6xl font-mono font-bold tracking-wider bg-black/30 px-8 py-4 rounded-xl border border-white/30 backdrop-blur-md">
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
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg active:scale-95 mb-4"
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
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg leading-tight">
                  Congratulations!<br/>
                  You have completed the ocean adventure.
                </h2>
                <div className="text-3xl text-cyan-200 font-semibold mb-6">🌊✨</div>
              </div>

              <div className="mb-10">
                <div className="inline-flex items-center gap-4 px-8 py-5 rounded-2xl bg-gradient-to-r from-yellow-400/90 via-orange-400/90 to-yellow-500/90 text-white font-bold text-2xl shadow-2xl backdrop-blur-sm border border-yellow-300/50 ">
                  <span className="text-4xl animate-spin">⭐</span>
                  <span className="mx-2">{wordsCompleted} Lucky Stars Earned!</span>
                  <span className="text-4xl animate-spin" style={{animationDirection: 'reverse'}}>⭐</span>
                </div>
              </div>

              <div className="flex gap-6 justify-center">
                <button
                  className="px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-600 text-white font-bold text-xl shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 "
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
                  className="px-10 py-4 rounded-2xl bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold text-xl shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
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

// (Old simplified Game 1 removed)

// Game 2: Dodge the Hunter - Complete rebuild
function GameDodge({ onEarnStars }: { onEarnStars: (n: number, x?: number, y?: number) => void }) {
  const [mode, setMode] = useState<'select' | 'playing' | 'gameOver' | 'win'>('select');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [playerX, setPlayerX] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);

  // Game objects
  const [obstacles, setObstacles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    type: number; // 0-6 for different obstacle images
    passed?: boolean;
  }>>([]);

  const [luckyStars, setLuckyStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
  }>>([]);

  // Game progression
  const [speedFactor, setSpeedFactor] = useState(1.0);
  const [obstaclesSpawned, setObstaclesSpawned] = useState(0);
  const [starsSpawned, setStarsSpawned] = useState(0);
  const [gameTime, setGameTime] = useState(0);

  // Obstacle images (7 different types × 2 = 14 total)
  const obstacleImages = [
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle1.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle2.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle3.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle4.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle5.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle6.png",
    "https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/obstacle7.png"
  ];

  // Character selection
  const selectCharacter = (character: string) => {
    setSelectedCharacter(character);
  };

  // Start game
  const startGame = () => {
    if (!selectedCharacter) return;
    setMode('playing');
    setPlayerX(50); // Center of screen
    setStarsEarned(0);
    setObstacles([]);
    setLuckyStars([]);
    setSpeedFactor(1.0);
    setObstaclesSpawned(0);
    setStarsSpawned(0);
    setGameTime(0);
  };

  // Reset to menu
  const resetToMenu = () => {
    setMode('select');
    setSelectedCharacter(null);
    setPlayerX(0);
    setStarsEarned(0);
    setObstacles([]);
    setLuckyStars([]);
    setSpeedFactor(1.0);
    setObstaclesSpawned(0);
    setStarsSpawned(0);
    setGameTime(0);
  };

  // Keyboard input for player movement
  useEffect(() => {
    if (mode !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setPlayerX(prev => Math.max(5, prev - 2)); // Smooth left movement
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setPlayerX(prev => Math.min(95, prev + 2)); // Smooth right movement
      } else if (e.key === 'Escape') {
        resetToMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  // Game loop
  useEffect(() => {
    if (mode !== 'playing') return;

    const gameLoop = () => {
      setGameTime(prev => prev + 1);

      // Spawn obstacles and stars
      if (gameTime % 120 === 0 && obstaclesSpawned < 14) { // Every 2 seconds at 60fps
        if (Math.random() < 0.8) { // 80% chance for obstacle
          const obstacleType = obstaclesSpawned % 7; // Cycle through 7 types
          const newObstacle = {
            id: Date.now() + Math.random(),
            x: Math.random() * 80 + 10, // Random X position
            y: -10, // Start above screen
            type: obstacleType
          };
          setObstacles(prev => [...prev, newObstacle]);
          setObstaclesSpawned(prev => prev + 1);
          setSpeedFactor(prev => prev * 1.05); // Increase speed by 5%
        } else if (starsSpawned < 3) { // 20% chance for star (if not maxed out)
          const newStar = {
            id: Date.now() + Math.random(),
            x: Math.random() * 80 + 10,
            y: -10
          };
          setLuckyStars(prev => [...prev, newStar]);
          setStarsSpawned(prev => prev + 1);
        }
      }

      // Update obstacles
      setObstacles(prev => prev.map(obstacle => {
        const newY = obstacle.y + 2 * speedFactor; // Fall down
        if (newY > 110 && !obstacle.passed) {
          // Passed bottom without hitting player
          setStarsEarned(prev => prev + 1);
          onEarnStars(1);
          return { ...obstacle, passed: true };
        }
        return { ...obstacle, y: newY };
      }).filter(obstacle => obstacle.y < 120)); // Remove when far below screen

      // Update lucky stars
      setLuckyStars(prev => prev.map(star => ({
        ...star,
        y: star.y + 2 * speedFactor // Fall down
      })).filter(star => star.y < 120)); // Remove when far below screen

      // Check collisions
      const playerRect = {
        left: playerX - 4,
        right: playerX + 4,
        top: 80 - 6, // Bottom area
        bottom: 80 + 6
      };

      // Check obstacle collisions
      for (const obstacle of obstacles) {
        const obstacleRect = {
          left: obstacle.x - 3,
          right: obstacle.x + 3,
          top: obstacle.y - 4,
          bottom: obstacle.y + 4
        };

        if (!(playerRect.right < obstacleRect.left ||
              playerRect.left > obstacleRect.right ||
              playerRect.bottom < obstacleRect.top ||
              playerRect.top > obstacleRect.bottom)) {
          // Collision with obstacle - Game Over
          setMode('gameOver');
          return;
        }
      }

      // Check star collisions
      setLuckyStars(prevStars => {
        return prevStars.filter(star => {
          const starRect = {
            left: star.x - 2,
            right: star.x + 2,
            top: star.y - 2,
            bottom: star.y + 2
          };

          const collision = !(playerRect.right < starRect.left ||
                            playerRect.left > starRect.right ||
                            playerRect.bottom < starRect.top ||
                            playerRect.top > starRect.bottom);

          if (collision) {
            setStarsEarned(prev => prev + 2);
            onEarnStars(2);
            return false; // Remove collected star
          }
          return true; // Keep star
        });
      });

      // Check win condition
      if (obstaclesSpawned >= 14 && obstacles.length === 0) {
        setMode('win');
        return;
      }

      requestAnimationFrame(gameLoop);
    };

    const animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [mode, gameTime, obstacles, luckyStars, obstaclesSpawned, starsSpawned, playerX, speedFactor, onEarnStars]);

  return (
    <div className="fixed inset-0 z-[70] bg-black">
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/game2.%20mp4?updatedAt=1759396573159"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* Game UI Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Character Selection */}
      {mode === 'select' && (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl p-8 text-center shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-slate-800">🐟 Chọn Nhân Vật 🐟</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => selectCharacter('fish1')}
                className={`p-4 rounded-xl border-2 transition-all ${selectedCharacter === 'fish1' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-300 bg-white'}`}
              >
                <div className="text-4xl mb-2">🐟</div>
                <div className="text-sm font-medium">Cá Xanh</div>
              </button>
              <button
                onClick={() => selectCharacter('fish2')}
                className={`p-4 rounded-xl border-2 transition-all ${selectedCharacter === 'fish2' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-300 bg-white'}`}
              >
                <div className="text-4xl mb-2">🐠</div>
                <div className="text-sm font-medium">Cá Vàng</div>
              </button>
            </div>
            <button
              onClick={startGame}
              disabled={!selectedCharacter}
              className={`px-8 py-4 rounded-2xl font-bold text-xl shadow-lg transition-all ${
                selectedCharacter
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              🎮 Bắt Đầu Chơi
            </button>
          </div>
        </div>
      )}

      {/* Game Playing */}
      {mode === 'playing' && (
        <>
          {/* HUD */}
          <div className="absolute top-4 left-4 z-[80] flex items-center gap-4 text-white">
            <div className="px-4 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/30">
              Stars: <span className="font-bold text-yellow-300">{starsEarned}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/30">
              Progress: <span className="font-bold">{obstaclesSpawned}/14</span>
            </div>
          </div>

          {/* Player */}
          <div
            className="absolute w-20 h-20 z-[75] animate-runner-glow animate-runner-swim"
            style={{
              left: `${playerX}%`,
              bottom: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-cyan-300 shadow-2xl">
              <div className="w-full h-full bg-gradient-to-br from-cyan-300 to-blue-400 flex items-center justify-center transform scale-300">
                <div className="text-4xl">{selectedCharacter === 'fish1' ? '🐟' : '🐠'}</div>
              </div>
            </div>
          </div>

          {/* Obstacles */}
          {obstacles.map(obstacle => (
            <div
              key={obstacle.id}
              className="absolute w-12 h-12 z-[70] animate-enter"
              style={{
                left: `${obstacle.x}%`,
                top: `${obstacle.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <img
                src={obstacleImages[obstacle.type]}
                alt={`Obstacle ${obstacle.type + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          ))}

          {/* Lucky Stars */}
          {luckyStars.map(star => (
            <div
              key={star.id}
              className="absolute w-8 h-8 z-[70] animate-star-sparkle"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-full h-full text-3xl animate-pulse">⭐</div>
            </div>
          ))}

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
      {mode === 'gameOver' && (
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
                onClick={resetToMenu}
                className="px-6 py-3 bg-slate-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                🏠 Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win Screen */}
      {mode === 'win' && (
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
                onClick={resetToMenu}
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
          0%, 100% { transform: translateX(-50%) scale(3); }
          50% { transform: translateX(-50%) scale(3.1); }
        }
        .animate-runner-swim { animation: runner-swim 1.5s ease-in-out infinite; }

        @keyframes enter {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        .animate-enter { animation: enter 0.3s ease-out; }

        @keyframes star-sparkle {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          25% { transform: translate(-50%, -50%) scale(1.2) rotate(90deg); }
          50% { transform: translate(-50%, -50%) scale(1.4) rotate(180deg); }
          75% { transform: translate(-50%, -50%) scale(1.2) rotate(270deg); }
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
}