import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShopifyProduct, storefrontApiRequest, PRODUCTS_QUERY, COLLECTIONS_QUERY, COLLECTION_PRODUCTS_QUERY } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { CartDrawer } from "@/components/CartDrawer";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Plus, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandedEmptyState } from "@/components/BrandedEmptyState";

interface ShopifyCollection {
  node: { id: string; title: string; handle: string };
}

const Shop = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);

  const fetchCollections = async () => {
    try {
      const data = await storefrontApiRequest(COLLECTIONS_QUERY, { first: 20 });
      if (data?.data?.collections?.edges) {
        setCollections(data.data.collections.edges);
      }
    } catch {
      // Collections are optional — don't block on failure
    }
  };

  const fetchProducts = async (collectionHandle?: string | null) => {
    setLoading(true);
    setError(false);
    try {
      if (collectionHandle) {
        const data = await storefrontApiRequest(COLLECTION_PRODUCTS_QUERY, { handle: collectionHandle, first: 50 });
        setProducts(data?.data?.collection?.products?.edges || []);
      } else {
        const data = await storefrontApiRequest(PRODUCTS_QUERY, { first: 50 });
        setProducts(data?.data?.products?.edges || []);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
    fetchProducts();
  }, []);

  const handleCollectionChange = (handle: string | null) => {
    setActiveCollection(handle);
    fetchProducts(handle);
  };

  const handleAddToCart = async (product: ShopifyProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success("Added to cart", { position: "top-center" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" showText={false} />
          <div className="flex items-center gap-2">
            <CartDrawer />
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Curated products for your journey</p>
        </div>

        {/* Collection filters */}
        {collections.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
            <Button
              variant={activeCollection === null ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0"
              onClick={() => handleCollectionChange(null)}
            >
              All
            </Button>
            {collections.map((col) => (
              <Button
                key={col.node.id}
                variant={activeCollection === col.node.handle ? "default" : "outline"}
                size="sm"
                className="flex-shrink-0"
                onClick={() => handleCollectionChange(col.node.handle)}
              >
                {col.node.title}
              </Button>
            ))}
          </div>
        )}

        {error ? (
          <div className="flex items-center justify-center py-12">
            <BrandedEmptyState
              mascot="confused"
              headline="Store is taking a break"
              description="We're having trouble reaching the store. Check your connection and try again."
              ctaLabel="Try Again"
              onCtaClick={() => fetchProducts(activeCollection)}
            />
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <BrandedEmptyState
              mascot="heart"
              headline="The shop is being stocked! 🛍️"
              description="We're curating amazing products for you. Check back soon!"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((product) => {
              const price = product.node.priceRange.minVariantPrice;
              const image = product.node.images.edges[0]?.node;
              return (
                <Card
                  key={product.node.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/product/${product.node.handle}`)}
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {image ? (
                      <img
                        src={image.url}
                        alt={image.altText || product.node.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                      {product.node.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-sm">
                        {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={isCartLoading}
                        onClick={(e) => handleAddToCart(product, e)}
                      >
                        {isCartLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Shop;
