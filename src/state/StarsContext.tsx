import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

interface StarsContextValue {
  stars: number;
  setStars: (n: number) => void;
  addStars: (n: number) => void;
  initialized: boolean;
  unlockedSkins: Record<string, boolean>;
  unlockSkin: (id: string, cost: number) => boolean;
  spendStars: (cost: number) => boolean;
}

const StarsContext = createContext<StarsContextValue | undefined>(undefined);

export const StarsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stars, setStarsInternal] = useState<number>(0);
  const [initialized, setInitialized] = useState(false);
  const [unlockedSkins, setUnlockedSkins] = useState<Record<string, boolean>>({});

  // Initialize from localStorage; if missing, default to 1 for new users
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ocean_stars");
      const n = raw != null ? parseInt(raw, 10) : NaN;
      if (Number.isFinite(n)) {
        setStarsInternal(n);
      } else {
        setStarsInternal(1);
        localStorage.setItem("ocean_stars", String(1));
      }
      const skinsRaw = localStorage.getItem("ocean_unlocked_skins");
      let initial: Record<string, boolean> = {};
      if (skinsRaw) {
        try { initial = JSON.parse(skinsRaw) || {}; } catch { initial = {}; }
      }
      // Ensure default free skins are unlocked
      const free = ["crab", "shrimp", "oyster"];
      free.forEach(k => { initial[k] = true; });
      setUnlockedSkins(initial);
      localStorage.setItem("ocean_unlocked_skins", JSON.stringify(initial));
    } catch {
      setStarsInternal(1);
    } finally {
      setInitialized(true);
    }
  }, []);

  const setStars = (n: number) => {
    setStarsInternal(n);
    try { localStorage.setItem("ocean_stars", String(n)); } catch {}
  };

  const addStars = (n: number) => {
    if (!n) return;
    setStarsInternal(prev => {
      const next = Math.max(0, prev + n);
      try { localStorage.setItem("ocean_stars", String(next)); } catch {}
      return next;
    });
  };

  const spendStars = (cost: number) => {
    if (cost <= 0) return true;
    let ok = false;
    setStarsInternal(prev => {
      if (prev >= cost) {
        ok = true;
        const next = prev - cost;
        try { localStorage.setItem("ocean_stars", String(next)); } catch {}
        return next;
      }
      ok = false;
      return prev;
    });
    return ok;
  };

  const unlockSkin = (id: string, cost: number) => {
    if (unlockedSkins[id]) return true;
    if (!spendStars(cost)) return false;
    setUnlockedSkins(prev => {
      const next = { ...prev, [id]: true };
      try { localStorage.setItem("ocean_unlocked_skins", JSON.stringify(next)); } catch {}
      return next;
    });
    return true;
  };

  const value = useMemo<StarsContextValue>(() => ({ stars, setStars, addStars, initialized, unlockedSkins, unlockSkin, spendStars }), [stars, initialized, unlockedSkins]);

  return (
    <StarsContext.Provider value={value}>
      {children}
    </StarsContext.Provider>
  );
};

export const useStars = () => {
  const ctx = useContext(StarsContext);
  if (!ctx) throw new Error("useStars must be used within StarsProvider");
  return ctx;
};
