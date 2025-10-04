import { Navbar } from "@/components/Navbar";
import { OceanBackground } from "@/components/OceanBackground";
import { StarCount } from "@/components/StarCount";
import { useStars } from "@/state/StarsContext";
import { useShop } from "@/state/ShopContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ShoppingCart, Fish, Palette } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  image: string;
  type: 'creature' | 'decoration';
}

const seaCreatures: ShopItem[] = [
  { id: 'octopus', name: 'Octopus', cost: 5, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/83.png', type: 'creature' },
  { id: 'jellyfish', name: 'Jellyfish', cost: 4, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/82.png', type: 'creature' },
  { id: 'seahorse', name: 'Seahorse', cost: 3, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/85.png', type: 'creature' },
  { id: 'clownfish', name: 'Clownfish', cost: 2, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/77.png', type: 'creature' },
  { id: 'butterflyfish', name: 'Butterflyfish', cost: 3, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/78.png', type: 'creature' },
  { id: 'fish-trio', name: 'Fish Trio', cost: 4, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/81.png', type: 'creature' },
  { id: 'blue-yellow-fish', name: 'Blue-Yellow Fish', cost: 3, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/79.png', type: 'creature' },
  { id: 'blue-fish', name: 'Blue Fish', cost: 2, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/80.png', type: 'creature' },
];

const decorations: ShopItem[] = [
  { id: 'coral-arch', name: 'Coral Arch', cost: 3, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/64.png', type: 'decoration' },
  { id: 'seaweed-cluster', name: 'Seaweed Cluster', cost: 2, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/65.png', type: 'decoration' },
  { id: 'treasure-chest', name: 'Treasure Chest', cost: 5, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/84.png', type: 'decoration' },
  { id: 'small-rock', name: 'Small Rock', cost: 2, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/67.png', type: 'decoration' },
  { id: 'big-rock', name: 'Big Rock', cost: 3, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/68.png', type: 'decoration' },
  { id: 'bubble-maker', name: 'Bubble Maker', cost: 4, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/69.png', type: 'decoration' },
  { id: 'anchor-relic', name: 'Anchor Relic', cost: 3, image: 'https://ik.imagekit.io/1mbxrb4zp/WEB%20OCEAN/SHOP/70.png', type: 'decoration' },
];

const Shop = () => {
  const navigate = useNavigate();
  const { stars, spendStars } = useStars();
  const {
    hasCreature,
    hasDecoration,
    buyCreature,
    buyDecoration,
    addCreatureToTank,
    addDecorationToTank,
    creaturesInTank,
    decorationsInTank
  } = useShop();

  const handleBuyItem = (item: ShopItem) => {
    if (stars < item.cost) {
      toast.error("Not enough stars to buy this item");
      return;
    }

    const success = spendStars(item.cost);
    if (!success) {
      toast.error("Failed to purchase item");
      return;
    }

    if (item.type === 'creature') {
      buyCreature(item.id, item.cost);
      toast.success(`Purchased ${item.name}! ✨`);
    } else {
      buyDecoration(item.id, item.cost);
      toast.success(`Purchased ${item.name}! ✨`);
    }

    // Play sparkle sound effect (placeholder - would need audio file)
    // const audio = new Audio('/sparkle.mp3');
    // audio.play();
  };

  const handleAddCreature = (item: ShopItem) => {
    if (!hasCreature(item.id)) return;

    if (creaturesInTank.includes(item.id)) {
      toast.info(`${item.name} is already in your tank!`);
      return;
    }

    addCreatureToTank(item.id);
    toast.success(`Added ${item.name} to your aquarium! 🐠`);

    // Navigate to aquarium to see the creature
    setTimeout(() => navigate('/aquarium'), 1000);
  };

  const handlePlaceDecoration = (item: ShopItem) => {
    if (!hasDecoration(item.id)) return;

    // For now, place at random position. In a real implementation, this would be interactive
    const x = Math.random() * 80 + 10; // 10-90% of width
    const y = Math.random() * 60 + 20; // 20-80% of height

    addDecorationToTank(item.id, x, y);
    toast.success(`Placed ${item.name} in your aquarium! 🏝️`);

    // Navigate to aquarium to see the decoration
    setTimeout(() => navigate('/aquarium'), 1000);
  };

  const ShopCard = ({ item }: { item: ShopItem }) => {
    const isPurchased = item.type === 'creature' ? hasCreature(item.id) : hasDecoration(item.id);
    const isInTank = item.type === 'creature'
      ? creaturesInTank.includes(item.id)
      : decorationsInTank.some(d => d.id === item.id);

    return (
      <Card className="group relative overflow-hidden glass-effect border border-amber-200/30 hover:border-amber-300/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--glow-cyan)/0.3)] backdrop-blur-md">
        <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.4),rgba(59,130,246,0.3),rgba(147,51,234,0.2)_50%)]" />
        <CardContent className="p-4 relative z-10 bg-gradient-to-b from-amber-50/5 via-transparent to-yellow-50/5">
          <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-white/90 backdrop-blur-sm">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
            />
          </div>

          <h3 className="font-semibold ocean-dark-text mb-2 text-center">{item.name}</h3>

          <div className="flex items-center justify-center gap-1 mb-3">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold ocean-dark-text">{item.cost}</span>
          </div>

          <Button
            onClick={() => {
              if (!isPurchased) {
                handleBuyItem(item);
              } else if (item.type === 'creature') {
                handleAddCreature(item);
              } else {
                handlePlaceDecoration(item);
              }
            }}
            className={`w-full relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] ${
              !isPurchased
                ? 'bg-gradient-to-r from-cyan-200/25 via-blue-300/30 to-purple-300/35 hover:from-cyan-100/35 hover:via-blue-200/40 hover:to-purple-200/45 text-cyan-50 border border-cyan-200/40 backdrop-blur-sm'
                : item.type === 'creature'
                  ? isInTank
                    ? 'bg-gradient-to-r from-emerald-300/40 via-green-400/30 to-teal-400/40 hover:from-emerald-200/50 hover:via-green-300/40 hover:to-teal-300/50 ocean-dark-text/90 border border-emerald-300/30 backdrop-blur-sm'
                    : 'bg-gradient-to-r from-sky-300/40 via-cyan-400/30 to-blue-400/40 hover:from-sky-200/50 hover:via-cyan-300/40 hover:to-blue-300/50 ocean-dark-text/90 border border-sky-300/30 backdrop-blur-sm'
                  : decorationsInTank.some(d => d.id === item.id)
                    ? 'bg-gradient-to-r from-emerald-300/40 via-green-400/30 to-teal-400/40 hover:from-emerald-200/50 hover:via-green-300/40 hover:to-teal-300/50 ocean-dark-text/90 border border-emerald-300/30 backdrop-blur-sm'
                    : 'bg-gradient-to-r from-violet-300/40 via-purple-400/30 to-fuchsia-400/40 hover:from-violet-200/50 hover:via-purple-300/40 hover:to-fuchsia-300/50 ocean-dark-text/90 border border-violet-300/30 backdrop-blur-sm'
            }`}
            disabled={isInTank}
          >
            {!isPurchased ? (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy (⭐{item.cost})
              </>
            ) : item.type === 'creature' ? (
              isInTank ? (
                'Already Added'
              ) : (
                <>
                  <Fish className="w-4 h-4 mr-2" />
                  Add to Tank
                </>
              )
            ) : decorationsInTank.some(d => d.id === item.id) ? (
              'Already Placed'
            ) : (
              <>
                <Palette className="w-4 h-4 mr-2" />
                Place in Tank
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen relative">
      <OceanBackground />
      <Navbar />

      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <h1 className="text-4xl md:text-5xl font-bold text-glow text-center animate-float">
              Ocean Shop
            </h1>
            <StarCount count={stars} showAnimation />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="creatures" className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass-effect border border-white/20 mb-8 relative backdrop-blur-md">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2),rgba(59,130,246,0.15),rgba(147,51,234,0.1)_60%)] rounded-lg" />
              <TabsTrigger
                value="creatures"
                className="relative z-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-300/40 data-[state=active]:via-blue-400/30 data-[state=active]:to-purple-400/40 data-[state=active]:text-cyan-100 data-[state=active]:border data-[state=active]:border-cyan-300/30 transition-all duration-300 backdrop-blur-sm"
              >
                🐠 Sea Creatures
              </TabsTrigger>
              <TabsTrigger
                value="decorations"
                className="relative z-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-300/40 data-[state=active]:via-purple-400/30 data-[state=active]:to-fuchsia-400/40 data-[state=active]:text-purple-100 data-[state=active]:border data-[state=active]:border-violet-300/30 transition-all duration-300 backdrop-blur-sm"
              >
                🏝️ Decorations
              </TabsTrigger>
            </TabsList>

            {/* Sea Creatures Tab */}
            <TabsContent value="creatures" className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-lg ocean-dark-text/80">
                  Discover amazing sea creatures to add to your aquarium!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {seaCreatures.map((creature) => (
                  <ShopCard key={creature.id} item={creature} />
                ))}
              </div>
            </TabsContent>

            {/* Decorations Tab */}
            <TabsContent value="decorations" className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-lg ocean-dark-text/80">
                  Beautify your aquarium with stunning decorations!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {decorations.map((decoration) => (
                  <ShopCard key={decoration.id} item={decoration} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Shop;
