import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Star, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  title: string;
  author: string;
  description: string | null;
  category: string;
  url: string;
  image_url: string;
  price: string;
  rating: number;
  tag: string;
  is_featured: boolean;
  order_index: number;
}

const makeProduct = (
  id: string,
  title: string,
  author: string,
  asin: string,
  price: string,
  rating: number,
  tag: string,
  category: string,
  order_index: number
): Product => ({
  id,
  title,
  author,
  description: null,
  category,
  url: `https://www.amazon.com/dp/${asin}?tag=positivethots-20`,
  image_url: `https://m.media-amazon.com/images/P/${asin}.jpg`,
  price,
  rating,
  tag,
  is_featured: tag === "Top Pick" || tag === "Essential",
  order_index,
});

const FALLBACK_PRODUCTS: Product[] = [
  makeProduct("b1", "The Ethical Slut (3rd Edition)", "Janet W. Hardy & Dossie Easton", "1587613379", "$16.99", 4.5, "Essential", "books", 1),
  makeProduct("b2", "Polysecure", "Jessica Fern", "1944934987", "$16.95", 4.7, "Top Pick", "books", 2),
  makeProduct("b3", "The Polysecure Workbook", "Jessica Fern", "1990869041", "$21.95", 4.6, "Workbook", "books", 3),
  makeProduct("b4", "More Than Two (2nd Edition)", "Eve Rickert", "0991399706", "$19.95", 4.4, "Guide", "books", 4),
  makeProduct("b5", "Stepping Off the Relationship Escalator", "Amy Gahran", "0998647306", "$17.99", 4.6, "Stories", "books", 5),
  makeProduct("b6", "Designer Relationships", "Mark A. Michaels & Patricia Johnson", "1627781471", "$14.95", 4.3, "Design", "books", 6),
  makeProduct("b7", "The Smart Girl's Guide to Polyamory", "Dedeker Winston", "1510712089", "$15.95", 4.5, "Modern", "books", 7),
  makeProduct("b8", "Opening Up", "Tristan Taormino", "157344295X", "$15.00", 4.4, "Classic", "books", 8),
  makeProduct("b9", "Nonviolent Communication", "Marshall B. Rosenberg", "189200528X", "$16.95", 4.7, "Communication", "books", 9),
  makeProduct("b10", "Attached", "Amir Levine & Rachel Heller", "1585429139", "$15.99", 4.6, "Science", "books", 10),
  makeProduct("c1", "BestSelf Intimacy Deck", "BestSelf Co.", "B08KBNZS9P", "$24.99", 4.5, "Top Pick", "connection", 1),
  makeProduct("c2", "The Couples Game That's Actually Fun", "DSS Games", "B09PMQRSPF", "$24.99", 4.7, "Game Night", "connection", 2),
  makeProduct("c3", "BETTER TOGETHER Conversation Cards", "Better Together", "B08948WMF9", "$15.99", 4.6, "Conversation", "connection", 3),
  makeProduct("c4", "Why Don't We — Spice IT UP", "Why Don't We", "B093BCC4VP", "$19.99", 4.5, "Spicy", "connection", 4),
  makeProduct("c5", "The Ultimate Date Night Game", "Zeitgeist", "0593435729", "$12.99", 4.4, "Classic", "connection", 5),
  makeProduct("c6", "InDeep Couples Game", "InDeep", "B0DT2JYR59", "$19.99", 4.5, "New", "connection", 6),
  makeProduct("c7", "TableTopics Couples Edition", "TableTopics", "B0018PJMLA", "$25.00", 4.5, "Original", "connection", 7),
  makeProduct("c8", "We're Not Really Strangers Couples Edition", "WNRS", "B0BJHQVMFJ", "$24.99", 4.6, "Viral", "connection", 8),
  makeProduct("s1", "Self-Care & Gratitude Journal (90-Day)", "Love Yourself Softly", "B0G3PMTKB8", "$12.99", 4.6, "Top Pick", "selfcare", 1),
  makeProduct("s2", "Find Your Own Magic Mental Health Journal", "FYMJ", "6199142705", "$16.99", 4.5, "12-Month", "selfcare", 2),
  makeProduct("s3", "The Five Minute Journal", "Intelligent Change", "0991846206", "$29.99", 4.7, "Classic", "selfcare", 3),
  makeProduct("s4", "Calm the Chaos Journal", "Daisy Waugh", "B0CVD4J3PR", "$14.99", 4.4, "Anxiety", "selfcare", 4),
  makeProduct("s5", "Mindfulness Cards", "Rohan Gunatillake", "1786489880", "$14.49", 4.5, "Mindfulness", "selfcare", 5),
  makeProduct("s6", "Self-Love Workbook for Women", "Megan Logan", "1647397294", "$11.99", 4.5, "Self-Love", "selfcare", 6),
];

const CATEGORY_MAP: Record<string, string> = {
  "All": "All",
  "Books & Education": "books",
  "Intimacy & Connection": "connection",
  "Self-Care & Wellness": "selfcare",
};

const categories = Object.keys(CATEGORY_MAP);

const StarRating = ({ rating }: { rating: number }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < full
              ? "fill-yellow-400 text-yellow-400"
              : i === full && half
              ? "fill-yellow-400/50 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating}</span>
    </div>
  );
};

const Resources = () => {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        navigate("/auth");
        return;
      }
      try {
        const { data, error } = await supabase
          .from("recommended_resources" as any)
          .select("*")
          .order("order_index", { ascending: true });
        if (!error && data && (data as any[]).length > 0) {
          // Map DB rows to Product shape if DB is available
          const mapped = (data as any[]).map((r: any) => ({
            ...r,
            author: r.author || "",
            price: r.price || "",
            rating: r.rating || 0,
            tag: r.tag || "",
          }));
          setProducts(mapped);
        }
      } catch {
        // fallback already set
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const filtered =
    activeCategory === "All"
      ? products
      : products.filter((p) => p.category === CATEGORY_MAP[activeCategory]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" showText={false} />
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curated picks for your growth journey
          </p>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
          <TabsList className="w-full overflow-x-auto flex justify-start gap-1 h-auto p-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs px-3 py-1.5 flex-shrink-0">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No resources yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((product) => (
              <a
                key={product.id}
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-48 bg-white flex items-center justify-center p-4">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-medium text-sm text-foreground line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="flex gap-1 flex-shrink-0">
                        {product.is_featured && (
                          <Badge variant="default" className="text-[10px]">Featured</Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">{product.tag}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{product.author}</p>
                    <StarRating rating={product.rating} />
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-semibold text-primary">{product.price}</span>
                      <span className="text-xs text-primary flex items-center gap-1">
                        View on Amazon <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/60 text-center mt-8 px-4">
          As an Amazon Associate, Positive Thots earns from qualifying purchases. Prices may vary.
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Resources;
