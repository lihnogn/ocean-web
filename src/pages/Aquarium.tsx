import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { OceanBackground } from "@/components/OceanBackground";
import { StarCount } from "@/components/StarCount";
import { useStars } from "@/state/StarsContext";
import { useShop } from "@/state/ShopContext";
import { Button } from "@/components/ui/button";
import { Package, X, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";
import { TablesInsert } from "@/integrations/supabase/types";
import avatarFish from "@/assets/avatar-fish.png";

interface Position {
  x: number;
  y: number;
}

interface AquariumStateItem {
  id: string;
  type: "fish" | "decoration";
  imageUrl: string;
  x: number; // Position in px (center point)
  y: number;
  scale: number;
  fromWarehouse: boolean;
  name: string;
}

interface SwimmingState {
  currentX: number;
  currentY: number;
  velocityX: number;
  baseSpeed: number;
  currentSpeed: number;
  direction: 'left' | 'right'; // Patrol direction
  isFlipped: boolean; // Horizontal flip state
  patrolY: number; // Fixed Y position for patrol
  lastSpeedChange: number;
  lastBobChange: number;
  bobOffset: number; // Small up/down movement
}

// Animation configurations for different animals - gentle wave-like drifting
const ANIMAL_ANIMATIONS: Record<string, { className: string; duration: string; transform: string }> = {
  // Fish now use JavaScript swimming system instead of CSS animations
  // Decorations can still use simple animations if needed
};

// AquariumItem Component - handles individual item rendering and interaction
const AquariumItem: React.FC<{
  item: AquariumStateItem;
  isSelected: boolean;
  onSelect: () => void;
  onPositionUpdate: (x: number, y: number) => void;
  onScaleUpdate: (scale: number) => void;
  onRemove: () => void;
  isDragging?: boolean;
}> = ({ item, isSelected, onSelect, onPositionUpdate, onScaleUpdate, onRemove, isDragging = false }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [originalPosition, setOriginalPosition] = useState<Position>({ x: 0, y: 0 });

  // Swimming state for fish
  const swimmingRef = useRef<SwimmingState | null>(null);
  const [swimmingPosition, setSwimmingPosition] = useState<Position>({ x: item.x, y: item.y });
  const [isFlipped, setIsFlipped] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Chỉ xử lý chuột trái (button 0)
    if (e.button !== 0) return;

    e.preventDefault();
    setIsDragActive(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOriginalPosition({ x: item.x, y: item.y });

    // Stop swimming when dragging starts
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  }, [item.x, item.y]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragActive) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const newX = originalPosition.x + deltaX;
    const newY = originalPosition.y + deltaY;

    // Giới hạn trong vùng hiển thị
    const rect = itemRef.current?.parentElement?.getBoundingClientRect();
    if (rect) {
      const constrainedX = Math.max(50, Math.min(rect.width - 50, newX));
      const constrainedY = Math.max(50, Math.min(rect.height - 50, newY));

      // Chỉ cập nhật vị trí, KHÔNG ảnh hưởng scale
      onPositionUpdate(constrainedX, constrainedY);
      setSwimmingPosition({ x: constrainedX, y: constrainedY });
    }
  }, [isDragActive, dragStart, originalPosition, onPositionUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragActive(false);

    // Resume swimming after drag ends
    if (item.type === 'fish') {
      initializeSwimming();
    }
  }, [item.type]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.max(0.5, Math.min(2, item.scale + delta));

    onScaleUpdate(newScale);
  }, [item.scale, onScaleUpdate]);

  // Initialize swimming state for fish
  const initializeSwimming = useCallback(() => {
    if (item.type !== 'fish') return;

    // Random base speed between 0.5-1.5 pixels per frame
    const baseSpeed = 0.5 + Math.random() * 1.0;

    swimmingRef.current = {
      currentX: item.x,
      currentY: item.y,
      velocityX: baseSpeed,
      baseSpeed: baseSpeed,
      currentSpeed: baseSpeed,
      direction: Math.random() > 0.5 ? 'left' : 'right',
      isFlipped: false,
      patrolY: item.y,
      lastSpeedChange: Date.now(),
      lastBobChange: Date.now(),
      bobOffset: 0
    };

    setSwimmingPosition({ x: item.x, y: item.y });
    setIsFlipped(false);
  }, [item.x, item.y, item.type]);

  // Swimming animation loop - horizontal patrol pattern
  const swim = useCallback(() => {
    if (!swimmingRef.current || item.type !== 'fish') return;

    const swimming = swimmingRef.current;
    const rect = itemRef.current?.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const now = Date.now();
    const bounds = { width: rect.width, height: rect.height };

    // Update horizontal position based on direction
    swimming.currentX += swimming.direction === 'left' ? -swimming.currentSpeed : swimming.currentSpeed;

    // Check for boundary collision and flip direction
    if (swimming.direction === 'left' && swimming.currentX <= 60) {
      // Hit left edge, flip to right
      swimming.currentX = 60;
      swimming.direction = 'right';
      swimming.isFlipped = true;
      setIsFlipped(true);
    } else if (swimming.direction === 'right' && swimming.currentX >= bounds.width - 60) {
      // Hit right edge, flip to left
      swimming.currentX = bounds.width - 60;
      swimming.direction = 'left';
      swimming.isFlipped = false;
      setIsFlipped(false);
    }

    // Add slight bobbing motion for realism
    if (now - swimming.lastBobChange > 2000 + Math.random() * 3000) {
      swimming.bobOffset = (Math.random() - 0.5) * 8;
      swimming.lastBobChange = now;
    }

    // Smooth bob transition
    swimming.patrolY += (item.y + swimming.bobOffset - swimming.patrolY) * 0.02;
    swimming.currentY = swimming.patrolY;

    // Occasionally vary speed slightly for natural movement
    if (now - swimming.lastSpeedChange > 5000 + Math.random() * 8000) {
      const speedVariation = 0.8 + Math.random() * 0.4;
      swimming.currentSpeed = swimming.baseSpeed * speedVariation;
      swimming.lastSpeedChange = now;
    }

    setSwimmingPosition({ x: swimming.currentX, y: swimming.currentY });
    animationRef.current = requestAnimationFrame(swim);
  }, [item.type, item.y]);

  // Start swimming when component mounts or item changes
  useEffect(() => {
    if (item.type === 'fish' && !isDragging && !isDragActive) {
      initializeSwimming();
      animationRef.current = requestAnimationFrame(swim);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [item.type, item.x, item.y, isDragging, isDragActive, initializeSwimming, swim]);

  useEffect(() => {
    if (isDragActive) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragActive, handleMouseMove, handleMouseUp]);

  // Update swimming position when item position changes externally
  useEffect(() => {
    if (!isDragActive && !isDragging) {
      setSwimmingPosition({ x: item.x, y: item.y });
    }
  }, [item.x, item.y, isDragActive, isDragging]);

  return (
    <div
      ref={itemRef}
      className={`absolute z-20 cursor-move select-none ${isSelected ? 'z-30' : ''}`}
      style={{
        left: `${swimmingPosition.x}px`,
        top: `${swimmingPosition.y}px`,
        transform: `translate(-50%, -50%) scale(${item.scale}) scaleX(${isFlipped ? -1 : 1})`,
      }}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
      onWheel={handleWheel}
    >
      {/* Selection glow effect */}
      {isSelected && (
        <div className="absolute inset-0 -m-4 rounded-full bg-cyan-400/30 blur-xl animate-pulse" />
      )}

      {/* Selection Controls - Only show when item is selected */}
      {isSelected && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex gap-2 z-40">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newScale = Math.max(0.3, item.scale - 0.1);
              onScaleUpdate(newScale);
            }}
            className="w-8 h-8 bg-blue-500 hover:bg-blue-400 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 hover:scale-110"
            title="Decrease Size"
          >
            −
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newScale = Math.min(3.0, item.scale + 0.1);
              onScaleUpdate(newScale);
            }}
            className="w-8 h-8 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 hover:scale-110"
            title="Increase Size"
          >
            +
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="w-8 h-8 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 hover:scale-110"
            title="Remove to Warehouse"
          >
            ❌
          </button>
        </div>
      )}

      {/* Item Image with appropriate animation */}
      <img
        src={item.imageUrl}
        alt={item.name}
        className={`select-none transition-all duration-200 hover:brightness-110 pointer-events-none ${
          item.type === 'fish'
            ? 'drop-shadow-lg animate-fin-flutter'
            : ''
        }`}
        style={item.type === 'fish' ? {
          filter: 'drop-shadow(0 0 8px rgba(103, 232, 249, 0.2)) drop-shadow(0 0 16px rgba(103, 232, 249, 0.1))'
        } : {}}
        draggable={false}
      />
    </div>
  );
};

// WarehouseItem Component - for items in warehouse with drag-and-drop
const WarehouseItem: React.FC<{
  item: AquariumStateItem;
  onDragStart: (item: AquariumStateItem) => void;
}> = ({ item, onDragStart }) => {
  const handleDragStart = useCallback((e: React.DragEvent) => {
    // Store the dragged item data
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(item);
  }, [item, onDragStart]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-grab active:cursor-grabbing"
    >
      <div className="aspect-square bg-white/60 rounded-lg p-3 mb-3 flex items-center justify-center">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <h4 className="text-sm font-semibold text-slate-700 text-center group-hover:text-slate-900 transition-colors">
        {item.name}
      </h4>
      <div className="mt-2 w-full px-3 py-1 bg-slate-500 hover:bg-slate-400 text-white text-xs rounded-lg transition-colors text-center">
        Drag to Aquarium
      </div>
    </div>
  );
};

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
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<AquariumStateItem | null>(null);

  const aquariumRef = useRef<HTMLDivElement>(null);

  // ================= MODULAR FUNCTIONS =================

  // Save state to Supabase database
  const saveState = useCallback(async () => {
    if (!user) return;

    try {
      const aquariumItems = aquariumState.filter(item => !item.fromWarehouse);
      const warehouseItems = aquariumState.filter(item => item.fromWarehouse);

      const { error } = await supabase
        .from('user_aquarium')
        .upsert({
          user_id: user.id,
          aquarium_items: aquariumItems,
          warehouse_items: warehouseItems,
        } as unknown as TablesInsert<'user_aquarium'>);

      if (error) {
        console.error("Error saving aquarium state:", error);
      } else {
        console.log("Aquarium state saved to database for user:", user.id, aquariumItems.length, "aquarium items,", warehouseItems.length, "warehouse items");
      }
    } catch (error) {
      console.error("Error saving aquarium state:", error);
    }
  }, [aquariumState, user]);

  // Load state from Supabase database
  const loadState = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_aquarium')
        .select('aquarium_items, warehouse_items')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error loading aquarium state:", error);
        return [];
      }

      if (data) {
        const aquariumItems = (data.aquarium_items as unknown as AquariumStateItem[]) || [];
        const warehouseItems = (data.warehouse_items as unknown as AquariumStateItem[]) || [];
        const allItems = [...aquariumItems, ...warehouseItems];
        console.log("Loaded aquarium state from database for user:", user.id, allItems.length, "total items");
        return allItems;
      }
    } catch (error) {
      console.error("Error loading aquarium state:", error);
    }
    return [];
  }, [user]);

  // Add item to aquarium
  const addItemToAquarium = (item: AquariumStateItem, x: number = 400, y: number = 300) => {
    console.log(`Adding ${item.name} to aquarium at position:`, x, y);

    const newItem: AquariumStateItem = {
      ...item,
      x,
      y,
      fromWarehouse: false
    };

    setAquariumState(prev => {
      // Remove from warehouse if it exists there
      const filtered = prev.filter(i => i.id !== item.id);
      const updated = [...filtered, newItem];

      console.log(`Aquarium now has ${updated.filter(i => !i.fromWarehouse).length} items in aquarium`);
      return updated;
    });

    saveState();
    toast.success(`${newItem.name} added to aquarium!`);
  };

  // Remove item from aquarium (send to warehouse)
  const removeItemFromAquarium = (itemId: string) => {
    console.log(`Removing ${itemId} from aquarium`);

    setAquariumState(prev => {
      const updated = prev.map(item =>
        item.id === itemId
          ? { ...item, fromWarehouse: true }
          : item
      );

      const itemInAquarium = updated.filter(i => !i.fromWarehouse).length;
      const itemInWarehouse = updated.filter(i => i.fromWarehouse).length;

      console.log(`After removal: ${itemInAquarium} in aquarium, ${itemInWarehouse} in warehouse`);
      return updated;
    });

    const item = aquariumState.find(i => i.id === itemId);
    saveState();
    setSelectedItemId(null);
    toast.success(`${item?.name || 'Item'} sent to warehouse!`);
  };

  // Update item position (center-based)
  const updateItemPosition = (itemId: string, x: number, y: number) => {
    console.log(`Updating position for ${itemId}:`, x, y);
    setAquariumState(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, x, y }
        : item
    ));
    saveState();
  };

  // Update item scale
  const updateItemScale = (itemId: string, scale: number) => {
    console.log(`Updating scale for ${itemId}:`, scale);
    setAquariumState(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, scale: Math.max(0.5, Math.min(3, scale)) }
        : item
    ));
    saveState();
  };

  // Validate and fix state to ensure no items are lost
  const validateAndFixState = useCallback((currentState: AquariumStateItem[]) => {
    const shopCreaturesIds = creaturesInTank;
    const shopDecorationsIds = decorationsInTank.map(d => d.id);

    const allShopItemIds = [...shopCreaturesIds, ...shopDecorationsIds];

    // Check if any shop items are missing from state
    const missingItems = allShopItemIds.filter(id => !currentState.some(item => item.id === id));

    if (missingItems.length > 0) {
      console.warn("Found missing shop items, adding them back:", missingItems);

      const newItems = missingItems.map(id => {
        if (shopCreaturesIds.includes(id)) {
          // It's a creature
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
            x: 400,
            y: 300,
            scale: 1,
            fromWarehouse: false
          };
        } else {
          // It's a decoration
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
            id,
            type: "decoration" as const,
            imageUrl: decorationData[id]?.image || '',
            name: decorationNames[id] || id,
            x: 400,
            y: 300,
            scale: 1,
            fromWarehouse: false
          };
        }
      });

      const fixedState = [...currentState, ...newItems];
      console.log("Fixed state with missing items:", fixedState.length, "total items");
      return fixedState;
    }

    return currentState;
  }, [creaturesInTank, decorationsInTank]);

  // ================= DRAG AND DROP HANDLERS =================

  // Handle drag start from warehouse
  const handleWarehouseDragStart = useCallback((item: AquariumStateItem) => {
    setDraggedItem(item);
    setDraggedItemId(item.id);
  }, []);

  // Handle drop on aquarium
  const handleAquariumDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedItem) return;

    const rect = aquariumRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate drop position relative to aquarium
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Constrain to aquarium bounds
    const constrainedX = Math.max(50, Math.min(rect.width - 50, x));
    const constrainedY = Math.max(50, Math.min(rect.height - 50, y));

    addItemToAquarium(draggedItem, constrainedX, constrainedY);
    setDraggedItem(null);
    setDraggedItemId(null);
    setIsWarehouseOpen(false);
  }, [draggedItem, addItemToAquarium]);

  // Handle drag over aquarium
  const handleAquariumDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // ================= INITIALIZATION =================

  // Load items from shop context and localStorage
  useEffect(() => {
    const loadAquariumItems = async () => {
      console.log("Loading aquarium items...");

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
          x: 400, // Default center position
          y: 300,
          scale: 1,
          fromWarehouse: true // New items start in warehouse
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
          fromWarehouse: true // New items start in warehouse
        };
      });

      // Load saved state from Supabase database
      const savedState = await loadState();

      if (savedState && savedState.length > 0) {
        console.log("Found saved state, merging with shop items...");

        // Create a map of shop items for quick lookup
        const allShopItems = [...shopCreatures, ...shopDecorations];
        const shopItemsMap = new Map(allShopItems.map(item => [item.id, item]));

        // Merge saved state with shop items, preserving saved positions/scales/states
        const mergedItems = savedState.map(savedItem => {
          const shopItem = shopItemsMap.get(savedItem.id);
          if (shopItem) {
            // Item exists in shop, use saved position/scale/state but shop image/name
            return {
              ...shopItem,
              x: savedItem.x,
              y: savedItem.y,
              scale: savedItem.scale,
              fromWarehouse: savedItem.fromWarehouse
            };
          } else {
            // Item not in shop anymore, keep as-is
            return savedItem;
          }
        });

        setAquariumState(mergedItems);
        console.log("Successfully merged saved state with shop items");
      } else {
        console.log("No saved state found, using shop items only");
        setAquariumState([...shopCreatures, ...shopDecorations]);
      }
    };

    if (!loading) {
      loadAquariumItems();
    }
  }, [creaturesInTank, decorationsInTank, loading, loadState]);

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-[5]" />
      <Navbar />
      
      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-glow animate-float">
                Your Aquarium
              </h1>
              <p className="text-lg text-white/80">
                Welcome back, Ocean Explorer! 🐠
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <StarCount count={stars} showAnimation />
              
              {/* Warehouse Button */}
              <Button
                onClick={() => setIsWarehouseOpen(true)}
                className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] bg-gradient-to-r from-orange-200/30 via-amber-300/35 to-yellow-300/40 hover:from-orange-100/40 hover:via-amber-200/45 hover:to-yellow-200/50 text-orange-50 border border-orange-200/40 backdrop-blur-sm h-12 px-6 text-lg font-semibold rounded-xl"
              >
                <Warehouse className="w-5 h-5 mr-2" />
                Warehouse
              </Button>
            </div>
          </div>

          {/* Main Aquarium Display */}
          <div
            ref={aquariumRef}
            className="glass-effect rounded-3xl border border-white/20 p-8 md:p-12 min-h-[600px] relative overflow-hidden shadow-[0_0_50px_hsl(var(--glow-cyan)/0.3)]"
            onDrop={handleAquariumDrop}
            onDragOver={handleAquariumDragOver}
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

            {/* Render Aquarium Items using AquariumItem component */}
            {aquariumState
              .filter(item => !item.fromWarehouse)
              .map((item) => (
                <AquariumItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItemId === item.id}
                  onSelect={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                  onPositionUpdate={(x, y) => updateItemPosition(item.id, x, y)}
                  onScaleUpdate={(scale) => updateItemScale(item.id, scale)}
                  onRemove={() => removeItemFromAquarium(item.id)}
                  isDragging={draggedItemId === item.id}
                />
              ))}

            {/* Bubble Maker Effect */}
            {aquariumState.some(item => item.id === 'bubble-maker' && !item.fromWarehouse) && (
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
              onClick={() => navigate("/shop")}
              className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] bg-gradient-to-r from-violet-200/30 via-purple-300/35 to-fuchsia-300/40 hover:from-violet-100/40 hover:via-purple-200/45 hover:to-purple-200/50 text-violet-50 border border-violet-200/40 backdrop-blur-sm h-20 text-lg font-semibold rounded-xl"
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
            <Button
              onClick={() => navigate("/")}
              className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] bg-gradient-to-r from-slate-200/30 via-gray-300/35 to-zinc-300/40 hover:from-slate-100/40 hover:via-gray-200/45 hover:to-zinc-200/50 text-slate-50 border border-slate-200/40 backdrop-blur-sm h-20 text-lg font-semibold rounded-xl"
            >
              🏠 Home
            </Button>
          </div>
        </div>
      </div>

      {/* Warehouse Modal */}
      {isWarehouseOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="relative w-[90%] max-w-5xl max-h-[85vh] bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_30px_80px_rgba(0,0,0,0.4)] overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-white/30">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 drop-shadow-sm flex items-center gap-2">
                  <Warehouse className="w-6 h-6" />
                  Warehouse
                </h2>
                <p className="text-slate-600 mt-1">Drag items to place them in your aquarium</p>
              </div>
              <button
                onClick={() => setIsWarehouseOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">
              {/* Fish Section */}
              {aquariumState.filter(item => item.type === 'fish' && item.fromWarehouse).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-cyan-700 mb-4 flex items-center gap-2">
                    🐠 Fish
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {aquariumState
                      .filter(item => item.type === 'fish' && item.fromWarehouse)
                      .map((item) => (
                        <WarehouseItem
                          key={item.id}
                          item={item}
                          onDragStart={handleWarehouseDragStart}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Decorations Section */}
              {aquariumState.filter(item => item.type === 'decoration' && item.fromWarehouse).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
                    🪸 Decorations
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {aquariumState
                      .filter(item => item.type === 'decoration' && item.fromWarehouse)
                      .map((item) => (
                        <WarehouseItem
                          key={item.id}
                          item={item}
                          onDragStart={handleWarehouseDragStart}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {aquariumState.filter(item => item.fromWarehouse).length === 0 && (
                <div className="text-center py-16">
                  <Package className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-slate-600 mb-2">Warehouse is empty</h3>
                  <p className="text-slate-500">Remove items from your aquarium to see them here!</p>
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
