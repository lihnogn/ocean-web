import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  image: string;
  type: 'creature' | 'decoration';
}

interface ShopContextValue {
  purchasedCreatures: Record<string, boolean>;
  purchasedDecorations: Record<string, boolean>;
  buyCreature: (id: string, cost: number) => boolean;
  buyDecoration: (id: string, cost: number) => boolean;
  hasCreature: (id: string) => boolean;
  hasDecoration: (id: string) => boolean;
  creaturesInTank: string[];
  decorationsInTank: Array<{id: string, x: number, y: number}>;
  addCreatureToTank: (id: string) => void;
  addDecorationToTank: (id: string, x: number, y: number) => void;
  removeDecorationFromTank: (id: string) => void;
}

const ShopContext = createContext<ShopContextValue | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [purchasedCreatures, setPurchasedCreatures] = useState<Record<string, boolean>>({});
  const [purchasedDecorations, setPurchasedDecorations] = useState<Record<string, boolean>>({});
  const [creaturesInTank, setCreaturesInTank] = useState<string[]>([]);
  const [decorationsInTank, setDecorationsInTank] = useState<Array<{id: string, x: number, y: number}>>([]);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const creaturesRaw = localStorage.getItem("ocean_purchased_creatures");
      if (creaturesRaw) {
        setPurchasedCreatures(JSON.parse(creaturesRaw));
      }

      const decorationsRaw = localStorage.getItem("ocean_purchased_decorations");
      if (decorationsRaw) {
        setPurchasedDecorations(JSON.parse(decorationsRaw));
      }

      const creaturesInTankRaw = localStorage.getItem("ocean_creatures_in_tank");
      if (creaturesInTankRaw) {
        setCreaturesInTank(JSON.parse(creaturesInTankRaw));
      }

      const decorationsInTankRaw = localStorage.getItem("ocean_decorations_in_tank");
      if (decorationsInTankRaw) {
        setDecorationsInTank(JSON.parse(decorationsInTankRaw));
      }
    } catch (error) {
      console.error("Error loading shop data:", error);
    }
  }, []);

  const buyCreature = (id: string, cost: number) => {
    if (purchasedCreatures[id]) return true; // Already purchased

    const next = { ...purchasedCreatures, [id]: true };
    setPurchasedCreatures(next);
    try {
      localStorage.setItem("ocean_purchased_creatures", JSON.stringify(next));
    } catch {}
    return true;
  };

  const buyDecoration = (id: string, cost: number) => {
    if (purchasedDecorations[id]) return true; // Already purchased

    const next = { ...purchasedDecorations, [id]: true };
    setPurchasedDecorations(next);
    try {
      localStorage.setItem("ocean_purchased_decorations", JSON.stringify(next));
    } catch {}
    return true;
  };

  const hasCreature = (id: string) => purchasedCreatures[id] || false;
  const hasDecoration = (id: string) => purchasedDecorations[id] || false;

  const addCreatureToTank = (id: string) => {
    if (!hasCreature(id) || creaturesInTank.includes(id)) return;

    const next = [...creaturesInTank, id];
    setCreaturesInTank(next);
    try {
      localStorage.setItem("ocean_creatures_in_tank", JSON.stringify(next));
    } catch {}
  };

  const addDecorationToTank = (id: string, x: number, y: number) => {
    if (!hasDecoration(id)) return;

    // Remove existing placement if any
    const filtered = decorationsInTank.filter(d => d.id !== id);
    const next = [...filtered, { id, x, y }];
    setDecorationsInTank(next);
    try {
      localStorage.setItem("ocean_decorations_in_tank", JSON.stringify(next));
    } catch {}
  };

  const removeDecorationFromTank = (id: string) => {
    const next = decorationsInTank.filter(d => d.id !== id);
    setDecorationsInTank(next);
    try {
      localStorage.setItem("ocean_decorations_in_tank", JSON.stringify(next));
    } catch {}
  };

  const value = useMemo<ShopContextValue>(() => ({
    purchasedCreatures,
    purchasedDecorations,
    buyCreature,
    buyDecoration,
    hasCreature,
    hasDecoration,
    creaturesInTank,
    decorationsInTank,
    addCreatureToTank,
    addDecorationToTank,
    removeDecorationFromTank,
  }), [purchasedCreatures, purchasedDecorations, creaturesInTank, decorationsInTank]);

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
};
