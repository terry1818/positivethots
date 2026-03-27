import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { BookOpen, Heart, Sparkles, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FeaturedSpotlight } from "@/components/resources/FeaturedSpotlight";
import { CategorySection } from "@/components/resources/CategorySection";
import type { Resource } from "@/components/resources/ResourceCard";

/* ── helpers ── */

const makeProduct = (
  id: string, title: string, author: string, asin: string,
  price: string, rating: number, tag: string, category: string, order_index: number
): Resource => ({
  id, title, author, description: null, category, tag,
  url: `https://www.amazon.com/dp/${asin}?tag=positivethots-20`,
  image_url: `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${asin}&Format=_SL250_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=positivethots-20`,
  price, rating,
  is_featured: tag === "Top Pick" || tag === "Essential",
  order_index,
});

const FALLBACK: Resource[] = [
  makeProduct("b1","The Ethical Slut (3rd Edition)","Janet W. Hardy & Dossie Easton","1587613379","$16.99",4.5,"Essential","books",1),
  makeProduct("b2","Polysecure","Jessica Fern","1944934987","$16.95",4.7,"Top Pick","books",2),
  makeProduct("b3","The Polysecure Workbook","Jessica Fern","1990869041","$21.95",4.6,"Workbook","books",3),
  makeProduct("b4","More Than Two (2nd Edition)","Eve Rickert","0991399706","$19.95",4.4,"Guide","books",4),
  makeProduct("b5","Stepping Off the Relationship Escalator","Amy Gahran","0998647306","$17.99",4.6,"Stories","books",5),
  makeProduct("b6","Designer Relationships","Mark A. Michaels & Patricia Johnson","1627781471","$14.95",4.3,"Design","books",6),
  makeProduct("b7","The Smart Girl's Guide to Polyamory","Dedeker Winston","1510712089","$15.95",4.5,"Modern","books",7),
  makeProduct("b8","Opening Up","Tristan Taormino","157344295X","$15.00",4.4,"Classic","books",8),
  makeProduct("b9","Nonviolent Communication","Marshall B. Rosenberg","189200528X","$16.95",4.7,"Communication","books",9),
  makeProduct("b10","Attached","Amir Levine & Rachel Heller","1585429139","$15.99",4.6,"Science","books",10),
  makeProduct("c1","BestSelf Intimacy Deck","BestSelf Co.","B08KBNZS9P","$24.99",4.5,"Top Pick","connection",1),
  makeProduct("c2","The Couples Game That's Actually Fun","DSS Games","B09PMQRSPF","$24.99",4.7,"Game Night","connection",2),
  makeProduct("c3","BETTER TOGETHER Conversation Cards","Better Together","B08948WMF9","$15.99",4.6,"Conversation","connection",3),
  makeProduct("c4","Why Don't We — Spice IT UP","Why Don't We","B093BCC4VP","$19.99",4.5,"Spicy","connection",4),
  makeProduct("c5","The Ultimate Date Night Game","Zeitgeist","0593435729","$12.99",4.4,"Classic","connection",5),
  makeProduct("c6","InDeep Couples Game","InDeep","B0DT2JYR59","$19.99",4.5,"New","connection",6),
  makeProduct("c7","TableTopics Couples Edition","TableTopics","B0018PJMLA","$25.00",4.5,"Original","connection",7),
  makeProduct("c8","We're Not Really Strangers Couples Edition","WNRS","B0BJHQVMFJ","$24.99",4.6,"Viral","connection",8),
  makeProduct("s1","Self-Care & Gratitude Journal (90-Day)","Love Yourself Softly","B0G3PMTKB8","$12.99",4.6,"Top Pick","selfcare",1),
  makeProduct("s2","Find Your Own Magic Mental Health Journal","FYMJ","6199142705","$16.99",4.5,"12-Month","selfcare",2),
  makeProduct("s3","The Five Minute Journal","Intelligent Change","0991846206","$29.99",4.7,"Classic","selfcare",3),
  makeProduct("s4","Calm the Chaos Journal","Daisy Waugh","B0CVD4J3PR","$14.99",4.4,"Anxiety","selfcare",4),
  makeProduct("s5","Mindfulness Cards","Rohan Gunatillake","1786489880","$14.49",4.5,"Mindfulness","selfcare",5),
  makeProduct("s6","Self-Love Workbook for Women","Megan Logan","1647397294","$11.99",4.5,"Self-Love","selfcare",6),
];

const CATEGORIES = [
  { key: "All", label: "All", icon: null },
  { key: "books", label: "Books & Education", icon: <BookOpen className="w-4 h-4" /> },
  { key: "connection", label: "Intimacy & Connection", icon: <Heart className="w-4 h-4" /> },
  { key: "selfcare", label: "Self-Care & Wellness", icon: <Sparkles className="w-4 h-4" /> },
] as const;

/* ── page ── */

const Resources = () => {
  const [activeTab, setActiveTab] = useState("All");
  const navigate = useNavigate();

  const { data: products = FALLBACK, isLoading } = useQuery({
    queryKey: ["recommended-resources"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { navigate("/auth"); return FALLBACK; }
      const { data, error } = await supabase
        .from("recommended_resources")
        .select("*")
        .order("order_index", { ascending: true });
      if (error || !data || data.length === 0) return FALLBACK;
      return (data as any[]).map((r: any) => ({
        ...r,
        author: r.author || "",
        price: r.price || "",
        rating: r.rating || 0,
        tag: r.tag || "",
      })) as Resource[];
    },
    staleTime: 1000 * 60 * 10,
  });

  const sorted = useMemo(() =>
    [...products].sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return a.order_index - b.order_index;
    }), [products]);

  const featured = useMemo(() => sorted.filter((p) => p.is_featured), [sorted]);

  const filtered = useMemo(() =>
    activeTab === "All" ? sorted : sorted.filter((p) => p.category === activeTab),
    [sorted, activeTab]);

  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) counts[p.category] = (counts[p.category] || 0) + 1;
    return counts;
  }, [products]);

  const categoryOrder = ["books", "connection", "selfcare"];
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, Resource[]> = {};
    for (const cat of categoryOrder) groups[cat] = [];
    for (const p of sorted) {
      if (groups[p.category]) groups[p.category].push(p);
    }
    return groups;
  }, [sorted]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Hero */}
      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Curated Tools for Your ENM Journey
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mt-2">
          Hand-picked books, games, and wellness tools to strengthen your relationships.
        </p>
      </div>

      {/* Sticky tabs */}
      <div className="sticky top-16 z-30 bg-gray-950/95 backdrop-blur-sm py-3 border-b border-gray-800/50">
        <div className="flex justify-center gap-2 overflow-x-auto px-4 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.key;
            const count = cat.key === "All" ? products.length : (countByCategory[cat.key] || 0);
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800/60 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                {cat.icon}
                {cat.label}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800/50 rounded-xl overflow-hidden">
                <Skeleton className="h-48 w-full bg-gray-800" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4 bg-gray-800" />
                  <Skeleton className="h-4 w-1/2 bg-gray-800" />
                  <Skeleton className="h-3 w-full bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Featured spotlight — always visible */}
            <FeaturedSpotlight resources={featured} />

            {/* Products */}
            {activeTab === "All" ? (
              categoryOrder.map((cat) => {
                const items = groupedByCategory[cat];
                if (!items || items.length === 0) return null;
                return <CategorySection key={cat} category={cat} resources={items} showHeader />;
              })
            ) : (
              <CategorySection category={activeTab} resources={filtered} showHeader={false} />
            )}
          </>
        )}

        {/* Disclosure */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 text-center max-w-2xl mx-auto mt-12 mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-gray-300">Affiliate Disclosure</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Positive Thots is a participant in the Amazon Services LLC Associates Program, an affiliate
            advertising program designed to provide a means for us to earn fees by linking to Amazon.com
            and affiliated sites. We only recommend products we believe in and that align with our mission
            of education-first, consent-forward relationships. Purchasing through our links supports the
            app at no extra cost to you.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Resources;
