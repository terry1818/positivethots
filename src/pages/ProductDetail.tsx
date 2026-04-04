import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, ShoppingBag, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ShopifyProduct["node"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
        if (data?.data?.product) setProduct(data.data.product);
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };
    if (handle) fetch();
  }, [handle]);

  const selectedVariant = product?.variants.edges[selectedVariantIdx]?.node;

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;
    const shopifyProduct: ShopifyProduct = { node: product };
    await addItem({
      product: shopifyProduct,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    toast.success("Added to cart", { position: "top-center" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CartDrawer />
          </div>
        </header>
        <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Product not found</p>
        <Button onClick={() => navigate("/shop")}>Back to Shop</Button>
      </div>
    );
  }

  const images = product.images.edges;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CartDrawer />
        </div>
      </header>

      <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4">
        {/* Image gallery */}
        <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-3">
          {images[activeImage]?.node ? (
            <img
              src={images[activeImage].node.url}
              alt={images[activeImage].node.altText || product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  idx === activeImage ? "border-primary" : "border-transparent"
                }`}
              >
                <img src={img.node.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Info */}
        <h1 className="text-xl font-bold text-foreground mb-1">{product.title}</h1>
        <Badge variant="secondary" className="mb-3">
          {selectedVariant?.price.currencyCode} {parseFloat(selectedVariant?.price.amount || "0").toFixed(2)}
        </Badge>

        {product.description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{product.description}</p>
        )}

        {/* Variant selection */}
        {product.options.length > 0 && product.options[0].name !== "Title" && (
          <div className="mb-4">
            {product.options.map((option) => (
              <div key={option.name} className="mb-3">
                <p className="text-sm font-medium text-foreground mb-2">{option.name}</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.edges.map((v, idx) => {
                    const opt = v.node.selectedOptions.find(o => o.name === option.name);
                    if (!opt) return null;
                    return (
                      <Button
                        key={v.node.id}
                        variant={idx === selectedVariantIdx ? "default" : "outline"}
                        size="sm"
                        disabled={!v.node.availableForSale}
                        onClick={() => setSelectedVariantIdx(idx)}
                      >
                        {opt.value}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quantity */}
        <div className="flex items-center gap-3 mb-6">
          <p className="text-sm font-medium text-foreground">Quantity</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Add to cart */}
        <Button
          className="w-full"
          size="lg"
          disabled={isCartLoading || !selectedVariant?.availableForSale}
          onClick={handleAddToCart}
        >
          {isCartLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ShoppingBag className="h-4 w-4 mr-2" />
          )}
          {selectedVariant?.availableForSale ? "Add to Cart" : "Sold Out"}
        </Button>
      </div>
    </div>
  );
};

export default ProductDetail;
