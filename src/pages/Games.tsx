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
    description:
      "Move the fish, dodge hooks and nets, and collect sparkling stars.",
    gradient: "from-indigo-200/70 via-sky-200/70 to-cyan-200/70",
    accent: "shadow-cyan-400/50",
  },
  game3: {
    title: "Guess the Ocean Creature",
    description:
      "Type the creature's name. Use hints (cost stars) to reveal letters.",
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),rgba(255,255,255,0)_60%)] mix-blend-screen animate-pulse-slow" />
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
        <GameModal
          gameKey={activeGame}
          meta={GAME_META[activeGame]}
          onClose={() => setActiveGame(null)}
          onEarnStars={(n, x, y) => addStars(n, x, y)}
        />
      )}

      {/* Local keyframes for special animations */}
      <style>{`
        @keyframes float-slow { 0% { transform: translateY(20px); opacity: .0 } 20%{opacity:.3} 50% { opacity: .15 } 100% { transform: translateY(-120vh); opacity: 0 } }
        .animate-float-slow { animation: float-slow linear infinite; }

        @keyframes pulse-slow { 0%, 100% { opacity: .35 } 50% { opacity: .55 } }
        .animate-pulse-slow { animation: pulse-slow 5s ease-in-out infinite; }

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
            <span className="absolute inset-0 rounded-2xl ring-2 ring-white/60 animate-pulse-slow" />
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
      "Type the creature name.",
      "Use Hint to reveal a letter (costs 1 star).",
      "Submit to check and earn stars.",
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

// Modal: Game container with lightweight placeholder logic for preview
function GameModal({
  gameKey,
  meta,
  onClose,
  onEarnStars,
}: {
  gameKey: GameKey;
  meta: { title: string };
  onClose: () => void;
  onEarnStars: (n: number, x?: number, y?: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-[96%] max-w-4xl rounded-3xl border border-white/25 bg-gradient-to-b from-white/70 to-white/40 p-4 md:p-6 shadow-[0_40px_90px_rgba(0,0,0,0.5)] animate-scale-in">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-2xl font-bold text-slate-900">{meta.title}</h3>
          <button className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-900" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden border border-white/30 bg-white/60">
          {gameKey === "game2" && <GameDodge onEarnStars={onEarnStars} />}
          {gameKey === "game3" && <GameGuess onEarnStars={onEarnStars} />}
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

// (Old simplified Game 1 removed)

// Game 2: Dodge the Hunter (very light placeholder canvas)
function GameDodge({ onEarnStars }: { onEarnStars: (n: number, x?: number, y?: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const touchRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // canvas not mounted yet
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // context unavailable
    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    let w = (canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr)));
    let h = (canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr)));
    const scale = dpr;

    const player = { x: w * 0.12, y: h * 0.5, r: 42 * scale, vx: 0, vy: 0 };
    const keys = new Set<string>();
    const obstacles: { x: number; y: number; vx: number; passed?: boolean }[] = [];
    const stars: { x: number; y: number; vx: number }[] = [];
    let speedFactor = 1.6; // player forward + world speed multiplier
    let spawnCount = 0;
    let laneTop = true; // alternate spawn lanes (top/bottom bands)
    let starTimer = 0;
    let starSpawned = 0;
    const maxStars = 3;
    // time-based loop helpers and base speeds (px/s)
    let last = performance.now();
    let obsSpawnTimer = 0;
    let nextObsIn = 0.9 + Math.random() * 0.6;
    const playerAutoSpeed = 140 * scale;
    const baseObsSpeed = 180 * scale;

    const addObstacle = () => {
      // alternate vertical bands to reduce overlap; 3x implied by drawing height below
      const bandY = laneTop ? h * 0.28 : h * 0.68;
      laneTop = !laneTop;
      const jitter = (Math.random() * 0.12 - 0.06) * h;
      const y = Math.max(30 * scale, Math.min(h - 30 * scale, bandY + jitter));
      const vx = baseObsSpeed * (0.9 + Math.random() * 0.2) * (1 + spawnCount * 0.07);
      spawnCount += 1;
      obstacles.push({ x: w + 60 * scale, y, vx });
    };
    const addStar = () => {
      const y = Math.max(30 * scale, Math.min(h - 30 * scale, Math.random() * h));
      stars.push({ x: w + 80 * scale, y, vx: baseObsSpeed * 0.85 * (0.9 + Math.random() * 0.2) });
    };
    // initial obstacle to show action immediately
    addObstacle();

    const onResize = () => {
      const ndpr = (typeof window !== "undefined" && window.devicePixelRatio) ? window.devicePixelRatio : 1;
      w = canvas.width = Math.max(1, Math.floor(canvas.clientWidth * ndpr));
      h = canvas.height = Math.max(1, Math.floor(canvas.clientHeight * ndpr));
    };
    window.addEventListener("resize", onResize);

    const onKey = (e: KeyboardEvent) => {
      if (e.type === "keydown") keys.add(e.key.toLowerCase());
      else keys.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    const touchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchRef.current = { active: true, x: t.clientX * scale, y: t.clientY * scale };
    };
    const touchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      touchRef.current = { active: true, x: t.clientX * scale, y: t.clientY * scale };
    };
    const touchEnd = () => (touchRef.current.active = false);
    canvas.addEventListener("touchstart", touchStart);
    canvas.addEventListener("touchmove", touchMove);
    canvas.addEventListener("touchend", touchEnd);

    let tick = 0;
    const loop = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      tick++;
      ctx.clearRect(0, 0, w, h);
      // bg
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#dbeafe");
      grad.addColorStop(1, "#bbf7d0");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // auto-run forward every frame (LEFT -> RIGHT)
      player.x += playerAutoSpeed * speedFactor * dt; // base forward motion
      // keyboard adjust (WASD/Arrows) with dt
      const adj = 200 * scale * dt;
      if (keys.has("arrowup") || keys.has("w")) player.y -= adj;
      if (keys.has("arrowdown") || keys.has("s")) player.y += adj;
      if (keys.has("arrowleft") || keys.has("a")) player.x -= adj;
      if (keys.has("arrowright") || keys.has("d")) player.x += adj;
      if (touchRef.current.active) {
        player.x += (touchRef.current.x - player.x) * 0.08;
        player.y += (touchRef.current.y - player.y) * 0.08;
      }
      player.x = Math.max(player.r, Math.min(w - player.r, player.x));
      player.y = Math.max(player.r, Math.min(h - player.r, player.y));

      // spawn obstacles by timer
      obsSpawnTimer += dt;
      if (obsSpawnTimer >= nextObsIn) { addObstacle(); obsSpawnTimer = 0; nextObsIn = 0.9 + Math.random() * 0.6; }
      // spawn up to 3 stars at random timing
      starTimer += dt;
      if (starSpawned < maxStars && starTimer >= 2 + Math.random() * 2) {
        starTimer = 0;
        starSpawned += 1;
        addStar();
      }

      // update obstacles (move RIGHT -> LEFT), draw larger with glow and semi-transparency
      ctx.save();
      ctx.lineWidth = 8 * scale; // thicker
      ctx.strokeStyle = "rgba(14,165,233,0.6)"; // semi-transparent
      ctx.shadowColor = "rgba(14,165,233,0.7)";
      ctx.shadowBlur = 16 * scale;
      obstacles.forEach((o) => {
        o.x -= o.vx * speedFactor * dt;
        ctx.beginPath();
        // 3x taller hook line
        ctx.moveTo(o.x, o.y - 54 * scale);
        ctx.lineTo(o.x, o.y + 54 * scale);
        ctx.stroke();
        // mark passed for progressive difficulty
        if (!(o as any).passed && (o.x < player.x - player.r)) {
          (o as any).passed = true;
          speedFactor = Math.min(4.0, speedFactor + 0.06);
          const rect = canvas.getBoundingClientRect();
          onEarnStars(1, rect.left + (player.x / w) * rect.width, rect.top + (player.y / h) * rect.height);
        }
      });
      ctx.restore();

      // update stars (glow, 3x radius), award +2 on collect
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x -= s.vx * speedFactor * dt;
        ctx.save();
        ctx.fillStyle = "#fde047";
        ctx.shadowColor = "rgba(250,204,21,0.95)";
        ctx.shadowBlur = 18 * scale;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 18 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        const dx = s.x - player.x;
        const dy = s.y - player.y;
        if (dx * dx + dy * dy < (player.r + 18 * scale) ** 2) {
          const rect = canvas.getBoundingClientRect();
          onEarnStars(2, rect.left + (s.x / w) * rect.width, rect.top + (s.y / h) * rect.height);
          stars.splice(i, 1);
          speedFactor = Math.min(4.0, speedFactor + 0.05);
        }
      }

      // collisions (AABB approx around player circle)
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        const px1 = player.x - player.r, py1 = player.y - player.r;
        const px2 = player.x + player.r, py2 = player.y + player.r;
        const ox1 = o.x - 10 * scale, oy1 = o.y - 54 * scale, ox2 = o.x + 10 * scale, oy2 = o.y + 54 * scale;
        const overlap = px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1;
        if (overlap) {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          return; // end mini-game (Game Over)
        }
      }

      // draw player with soft glow and bobbing
      ctx.save();
      ctx.shadowColor = "rgba(125,211,252,0.9)";
      ctx.shadowBlur = 24 * scale;
      const bob = Math.sin(tick / 10) * 2 * scale;
      ctx.beginPath();
      ctx.fillStyle = "#0ea5e9";
      ctx.arc(player.x, player.y + bob, player.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(player.x + 8 * scale, player.y - 6 * scale + bob, 3.5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // remove off-screen items
      for (let i = obstacles.length - 1; i >= 0; i--) if (obstacles[i].x < -60 * scale) obstacles.splice(i, 1);
      for (let i = stars.length - 1; i >= 0; i--) if (stars[i].x < -40 * scale) stars.splice(i, 1);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("touchstart", touchStart);
      canvas.removeEventListener("touchmove", touchMove);
      canvas.removeEventListener("touchend", touchEnd);
    };
  }, [onEarnStars]);

  return (
    <div className="w-full h-[360px] md:h-[420px]">
      <canvas ref={canvasRef} className="w-full h-full touch-none" />
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
                  <img src={c.img} alt={c.name} className="w-40 h-40 object-contain justify-self-center drop-shadow" />
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