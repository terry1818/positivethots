import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Headphones, Globe, Wrench, Smartphone, ExternalLink, Loader2, Film, Tv } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  url: string;
  image_url: string | null;
  is_featured: boolean;
  order_index: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Books: <BookOpen className="h-4 w-4" />,
  Podcasts: <Headphones className="h-4 w-4" />,
  Websites: <Globe className="h-4 w-4" />,
  Services: <Wrench className="h-4 w-4" />,
  Apps: <Smartphone className="h-4 w-4" />,
};

const categories = ["All", "Books", "Apps", "Podcasts", "Websites", "Services"];

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const loadResources = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        navigate("/auth");
        return;
      }
      const { data, error } = await supabase
        .from("recommended_resources" as any)
        .select("*")
        .order("order_index", { ascending: true });

      if (!error && data) setResources(data as unknown as Resource[]);
      setLoading(false);
    };
    loadResources();
  }, [navigate]);

  const filtered = activeCategory === "All" ? resources : resources.filter(r => r.category === activeCategory);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
        </div>
      </header>

      <main className="flex-1 container max-w-md mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">Curated recommendations for your growth</p>
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
                <CardContent className="p-4 flex gap-3">
                  <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No resources yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              We're curating the best resources for you. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((resource) => (
              <Card key={resource.id} className="overflow-hidden">
                <CardContent className="p-4 flex gap-3">
                  {resource.image_url ? (
                    <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                      <img src={resource.image_url} alt={resource.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-md flex-shrink-0 bg-muted flex items-center justify-center">
                      {categoryIcons[resource.category] || <BookOpen className="h-6 w-6 text-muted-foreground/40" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm text-foreground line-clamp-1">{resource.title}</h3>
                      {resource.is_featured && <Badge variant="default" className="text-[10px] flex-shrink-0">Featured</Badge>}
                    </div>
                    {resource.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{resource.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">
                        {categoryIcons[resource.category]}
                        <span className="ml-1">{resource.category}</span>
                      </Badge>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs flex items-center gap-1 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Resources;
