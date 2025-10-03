import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { OceanBackground } from "@/components/OceanBackground";
import { StarCount } from "@/components/StarCount";
import { useStars } from "@/state/StarsContext";
import { useShop } from "@/state/ShopContext";
import { Button } from "@/components/ui/button";
import { Package, X } from "lucide-react";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";
import avatarFish from "@/assets/avatar-fish.png";

interface AquariumStateItem {
  id: string;
  type: "fish" | "decoration";
  imageUrl: string;
  x: number; // Position in px
  y: number;
  scale: number;
  inAquarium: boolean;
  name: string;
}

const Aquarium = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { stars } = useStars();
  const { creaturesInTank, decorationsInTank } = useShop();
  const [loading, setLoading] = useState(true);

  // Unified state for all items
  const [aquariumState, setAquariumState] = useState<AquariumStateItem[]>([]);

  // UI state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isStorageOpen, setIsStorageOpen] = useState(false);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);

  const aquariumRef = useRef<HTMLDivElement>(null);

  // ================= MODULAR FUNCTIONS =================

  // Save state to localStorage
  const saveState = useCallback(() => {
    localStorage.setItem("aquariumState", JSON.stringify(aquariumState));
  }, [aquariumState]);

  // Load state from localStorage
  const loadState = useCallback(() => {
    const saved = localStorage.getItem("aquariumState");
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        setAquariumState(parsedState);
        return parsedState;
      } catch (error) {
        console.error("Error loading aquarium state:", error);
      }
    }
    return [];
  }, []);

  // Add item to aquarium
  const addItem = (item: AquariumStateItem, x: number = 400, y: number = 300) => {
    const newItem: AquariumStateItem = {
      ...item,
      x,
      y,
      inAquarium: true
    };

    setAquariumState(prev => {
      // Remove from storage if it exists there
      const filtered = prev.filter(i => i.id !== item.id);
      return [...filtered, newItem];
    });

    saveState();
    toast.success(`${newItem.name} added to aquarium!`);
  };

  // Remove item from aquarium (send to storage)
  const removeItem = (itemId: string) => {
    setAquariumState(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, inAquarium: false }
        : item
    ));

    const item = aquariumState.find(i => i.id === itemId);
    saveState();
    setSelectedItemId(null);
    toast.success(`${item?.name || 'Item'} sent to storage!`);
  };

  // Update item position
  const updateItemPosition = (itemId: string, x: number, y: number) => {
    setAquariumState(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, x, y }
        : item
    ));
    saveState();
  };

  // Update item scale
  const updateItemScale = (itemId: string, scale: number) => {
    setAquariumState(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, scale: Math.max(0.5, Math.min(3, scale)) }
        : item
    ));
    saveState();
  };

  // ================= INITIALIZATION =================

  // Load items from shop context and localStorage
  useEffect(() => {
    const loadAquariumItems = () => {
      // Get items from shop context
      const shopCreatures = creaturesInTank.map(id => {
        const creatureData: Record<string, { image: string }> = {
          'octopus': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/83.png' },
          'jellyfish': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/82.png' },
          'seahorse': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/85.png' },
          'clownfish': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/77.png' },
          'butterflyfish': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/78.png' },
          'fish-trio': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/81.png' },
          'blue-yellow-fish': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/79.png' },
          'blue-fish': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/80.png' },
        };
        const creatureNames: Record<string, string> = {
          'octopus': 'Mystic Octopus',
          'jellyfish': 'Crystal Jellyfish',
          'seahorse': 'Royal Seahorse',
          'clownfish': 'Clownfish',
          'butterflyfish': 'Butterfly Fish',
          'fish-trio': 'Fish Trio',
          'blue-yellow-fish': 'Blue-Yellow Fish',
          'blue-fish': 'Blue Fish',
        };
        return {
          id,
          type: "fish" as const,
          imageUrl: creatureData[id]?.image || '',
          name: creatureNames[id] || id,
          x: 400, // Center position initially
          y: 300,
          scale: 1,
          inAquarium: false // New items start in inventory
        };
      });

      const shopDecorations = decorationsInTank.map(decoration => {
        const decorationData: Record<string, { image: string }> = {
          'coral-arch': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/64.png' },
          'seaweed-cluster': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/65.png' },
          'treasure-chest': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/84.png' },
          'small-rock': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/67.png' },
          'big-rock': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/68.png' },
          'bubble-maker': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/69.png' },
          'anchor-relic': { image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/70.png' },
        };
        const decorationNames: Record<string, string> = {
          'coral-arch': 'Coral Arch',
          'seaweed-cluster': 'Seaweed Cluster',
          'treasure-chest': 'Treasure Chest',
          'small-rock': 'Small Rock',
          'big-rock': 'Big Rock',
          'bubble-maker': 'Bubble Maker',
          'anchor-relic': 'Anchor Relic',
        };
        return {
          id: decoration.id,
          type: "decoration" as const,
          imageUrl: decorationData[decoration.id]?.image || '',
          name: decorationNames[decoration.id] || decoration.id,
          x: decoration.x || 400,
          y: decoration.y || 300,
          scale: 1,
          inAquarium: false // New items start in inventory
        };
      });

      // Load saved positions from localStorage
      const savedItems = localStorage.getItem("aquariumItems");
      let savedAquariumItems: AquariumStateItem[] = [];
      if (savedItems) {
        try {
          savedAquariumItems = JSON.parse(savedItems);
        } catch (error) {
          console.error("Error loading aquarium items:", error);
        }
      }

      // Load inventory from localStorage
      const savedInventory = localStorage.getItem("aquariumInventory");
      let savedInventoryItems: AquariumStateItem[] = [];
      if (savedInventory) {
        try {
          savedInventoryItems = JSON.parse(savedInventory);
        } catch (error) {
          console.error("Error loading inventory items:", error);
        }
      }

      // Merge shop items with saved positions
      const allItems = [...shopCreatures, ...shopDecorations];
      const mergedItems = allItems.map(item => {
        const saved = savedAquariumItems.find(s => s.id === item.id);
        return saved || item;
      });

      // Filter items that are in aquarium vs inventory
      const aquariumIds = mergedItems.map(item => item.id);
      const inventoryOnlyItems = savedInventoryItems.filter(item => !aquariumIds.includes(item.id));

      setAquariumState([...mergedItems, ...inventoryOnlyItems]);
    };

    if (!loading) {
      loadAquariumItems();
    }
  }, [creaturesInTank, decorationsInTank, loading, loadState]);

  // Save items to localStorage
  const saveAquariumItems = useCallback(() => {
    localStorage.setItem("aquariumState", JSON.stringify(aquariumState));
    toast.success("Aquarium layout saved!");
  }, [aquariumState]);

  // ================= DRAG & DROP SYSTEM =================
  // DRAGGING: Only updates position (x, y) in px - NO scaling/rotation
  // SCALING: Only through floating menu buttons (+ and -)
  // CLICKING: Shows floating menu for resize/remove controls

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();

    // Set drag start position and pending selection
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setPendingSelection(itemId);
    setHasDragged(false);

    const item = aquariumState.find(i => i.id === itemId);
    if (!item || !aquariumRef.current) return;

    const rect = aquariumRef.current.getBoundingClientRect();
    const itemRect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = itemRect.left + itemRect.width / 2;
    const centerY = itemRect.top + itemRect.height / 2;

    setDragOffset({
      x: e.clientX - centerX + rect.left,
      y: e.clientY - centerY + rect.top
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!pendingSelection) return;

    const deltaX = Math.abs(e.clientX - dragStartPos.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.y);
    const threshold = 5; // 5px threshold

    // If moved beyond threshold, start dragging
    if ((deltaX > threshold || deltaY > threshold) && !hasDragged) {
      setIsDragging(true);
      setHasDragged(true);
    }

    // Handle actual dragging - POSITION ONLY (no scaling)
    if (isDragging && aquariumRef.current) {
      const rect = aquariumRef.current.getBoundingClientRect();
      const x = e.clientX - dragOffset.x - rect.left;
      const y = e.clientY - dragOffset.y - rect.top;

      // Constrain to aquarium bounds (in px)
      const constrainedX = Math.max(0, Math.min(rect.width - 100, x));
      const constrainedY = Math.max(0, Math.min(rect.height - 100, y));

      const selectedItem = aquariumState.find(item => item.id === pendingSelection);
      if (selectedItem) {
        updateItemPosition(selectedItem.id, constrainedX, constrainedY);
      }
    }
  }, [pendingSelection, dragStartPos, hasDragged, isDragging, dragOffset, aquariumState]);

  const handleMouseUp = useCallback(() => {
    if (pendingSelection && !hasDragged) {
      // It was a click, not a drag - show selection menu
      setSelectedItemId(selectedItemId === pendingSelection ? null : pendingSelection);
    }

    // Reset drag states
    setIsDragging(false);
    setHasDragged(false);
    setPendingSelection(null);
  }, [pendingSelection, hasDragged, selectedItemId]);

  // Handle resizing - ONLY through floating menu buttons (+ and -)
  // No automatic scaling based on mouse movement or wheel events
  const resizeItem = (itemId: string, delta: number) => {
    setAquariumState(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, scale: Math.max(0.5, Math.min(3, item.scale + delta)) }
          : item
      )
    );
  };

  // Add event listeners
  useEffect(() => {
    if (isDragging || pendingSelection) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, pendingSelection, handleMouseMove, handleMouseUp]);

  // ================= AUTH & LOADING =================

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("See you soon in Ocean Adventure!");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <OceanBackground />
        <div className="relative z-10 text-center">
          <img src={avatarFish} alt="Loading" className="w-32 h-32 animate-swim mx-auto mb-4" />
          <p className="text-xl text-glow">Loading your aquarium...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <OceanBackground />
      {/* Dark overlay to make aquarium video stand out */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-[5]" />
      <Navbar />
      
      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-glow animate-float">
                Your Personal Aquarium
              </h1>
              <p className="text-lg text-white/80">
                Welcome back, Ocean Explorer! 🐠
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <StarCount count={stars} showAnimation />
            </div>
          </div>

          {/* Main Aquarium Display */}
          <div
            ref={aquariumRef}
            className="glass-effect rounded-3xl border border-white/20 p-8 md:p-12 min-h-[500px] relative overflow-hidden shadow-[0_0_50px_hsl(var(--glow-cyan)/0.3)] cursor-move select-none"
          >
            {/* Aquarium Background */}
            <video
              className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.3),0_0_120px_rgba(59,130,246,0.2),inset_0_0_60px_rgba(255,255,255,0.1)] animate-pulse-slow"
              src="https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/b%E1%BB%83?updatedAt=1759523056092"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />

            {/* Decorative Elements */}
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-accent/20 blur-3xl animate-float z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-accent/20 blur-3xl animate-float z-10" />

            {/* Render Aquarium Items */}
            {aquariumState
              .filter(item => item.inAquarium)
              .map((item) => (
                <div
                  key={item.id}
                  data-id={item.id}
                  className="aquarium-item absolute z-20"
                  style={{
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    transform: `scale(${item.scale})`,
                  }}
                >
                  {/* Selection Controls - Only show when item is selected */}
                  {selectedItemId === item.id && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateItemScale(item.id, item.scale + 0.1);
                        }}
                        className="w-8 h-8 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 hover:scale-110"
                        title="Increase size"
                      >
                        ➕
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateItemScale(item.id, item.scale - 0.1);
                        }}
                        className="w-8 h-8 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 hover:scale-110"
                        title="Decrease size"
                      >
                        ➖
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="w-8 h-8 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 hover:scale-110"
                        title="Remove to storage"
                      >
                        ❌
                      </button>
                    </div>
                  )}

                  {/* Item Image */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="cursor-move select-none transition-all duration-200 hover:brightness-110"
                    onMouseDown={(e) => handleMouseDown(e, item.id)}
                    draggable={false}
                  />
                </div>
              ))}

            {/* Bubble Maker Effect */}
            {aquariumState.some(item => item.id === 'bubble-maker' && item.inAquarium) && (
              <div className="absolute inset-0 pointer-events-none z-10">
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-white/60 rounded-full animate-bubble"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      bottom: '10%',
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${3 + Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid md:grid-cols-4 gap-4">
            <Button
              onClick={() => setIsStorageOpen(true)}
              className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] bg-gradient-to-r from-purple-200/30 via-indigo-300/35 to-blue-300/40 hover:from-purple-100/40 hover:via-indigo-200/45 hover:to-blue-200/50 text-purple-50 border border-purple-200/40 backdrop-blur-sm h-20 text-lg font-semibold rounded-xl"
            >
              📦 Storage
            </Button>
            <Button
              onClick={() => navigate("/shop")}
              className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] bg-gradient-to-r from-violet-200/30 via-purple-300/35 to-fuchsia-300/40 hover:from-violet-100/40 hover:via-purple-200/45 hover:to-fuchsia-200/50 text-violet-50 border border-violet-200/40 backdrop-blur-sm h-20 text-lg font-semibold rounded-xl"
            >
              🛍️ Visit Shop
            </Button>
            <Button
              onClick={() => navigate("/social")}
              className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] bg-gradient-to-r from-emerald-200/30 via-green-300/35 to-teal-300/40 hover:from-emerald-100/40 hover:via-green-200/45 hover:to-teal-200/50 text-emerald-50 border border-emerald-200/40 backdrop-blur-sm h-20 text-lg font-semibold rounded-xl"
            >
              👥 Social Feed
            </Button>
            <Button
              onClick={() => navigate("/games")}
              className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] bg-gradient-to-r from-cyan-200/30 via-blue-300/35 to-purple-300/40 hover:from-cyan-100/40 hover:via-blue-200/45 hover:to-purple-200/50 text-cyan-50 border border-cyan-200/40 backdrop-blur-sm h-20 text-lg font-semibold rounded-xl"
            >
              🎮 Play Games
            </Button>
          </div>
        </div>
      </div>

      {/* Storage Modal */}
      {isStorageOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="relative w-[90%] max-w-4xl max-h-[80vh] bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_30px_80px_rgba(0,0,0,0.4)] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/30">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 drop-shadow-sm">📦 Storage</h2>
                <p className="text-slate-600 mt-1">Click items to place them in your aquarium</p>
              </div>
              <button
                onClick={() => setIsStorageOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(80vh-120px)] overflow-y-auto">
              {/* Fish Section */}
              {aquariumState.filter(item => item.type === 'fish' && !item.inAquarium).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-cyan-700 mb-4 flex items-center gap-2">
                    🐠 Fish
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {aquariumState
                      .filter(item => item.type === 'fish' && !item.inAquarium)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="group relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200/50 hover:border-cyan-300 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
                          onClick={() => addItem(item)}
                        >
                          <div className="aspect-square bg-white/60 rounded-lg p-3 mb-3 flex items-center justify-center">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <h4 className="text-sm font-semibold text-slate-700 text-center group-hover:text-cyan-700 transition-colors">
                            {item.name}
                          </h4>
                          <button className="mt-2 w-full px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-white text-xs rounded-lg transition-colors">
                            Place
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Decorations Section */}
              {aquariumState.filter(item => item.type === 'decoration' && !item.inAquarium).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
                    🪸 Decorations
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {aquariumState
                      .filter(item => item.type === 'decoration' && !item.inAquarium)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="group relative bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200/50 hover:border-emerald-300 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
                          onClick={() => addItem(item)}
                        >
                          <div className="aspect-square bg-white/60 rounded-lg p-3 mb-3 flex items-center justify-center">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <h4 className="text-sm font-semibold text-slate-700 text-center group-hover:text-emerald-700 transition-colors">
                            {item.name}
                          </h4>
                          <button className="mt-2 w-full px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-white text-xs rounded-lg transition-colors">
                            Place
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {aquariumState.filter(item => !item.inAquarium).length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">Storage is empty</h3>
                  <p className="text-slate-500">Remove items from your aquarium to store them here!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Aquarium;