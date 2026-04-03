import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { BookOpen, Heart, Sparkles, ShieldCheck, Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FeaturedSpotlight } from "@/components/resources/FeaturedSpotlight";
import { CategorySection } from "@/components/resources/CategorySection";
import type { Resource } from "@/components/resources/ResourceCard";

/* ── helpers ── */

const LOCAL_IMAGE_OVERRIDES: Record<string, string> = {
  B08948WMF9: "https://m.media-amazon.com/images/I/71ZlBiC3HNL._SL500_.jpg",
  B093BCC4VP: "https://m.media-amazon.com/images/I/71kc-aiTJtL._SL500_.jpg",
  B0DT2JYR59: "https://m.media-amazon.com/images/I/51Tne9x5-JL._SL500_.jpg",
  B0018PJMLA: "https://m.media-amazon.com/images/I/71CZXaXCeXL._SL500_.jpg",
  B000FN69PC: "https://m.media-amazon.com/images/I/71CZXaXCeXL._SL500_.jpg",
  B0BJHQVMFJ: "https://m.media-amazon.com/images/I/61gaYxYk9SL._SL500_.jpg",
  B0B7V56B7H: "https://m.media-amazon.com/images/I/61gaYxYk9SL._SL500_.jpg",
  "6199142705": "https://m.media-amazon.com/images/I/718906kDpxL._SL500_.jpg",
  "0991846206": "https://m.media-amazon.com/images/I/81q7+Fi0i9L._SL500_.jpg",
  B0CVD4J3PR: "https://m.media-amazon.com/images/I/81PMKdMinbL._SL500_.jpg",
  "1452169950": "https://m.media-amazon.com/images/I/81PMKdMinbL._SL500_.jpg",
};

const PRODUCT_URL_OVERRIDES: Record<string, string> = {
  B0BJHQVMFJ: "https://www.amazon.com/dp/B0B7V56B7H?tag=forsale18od-20",
  B0B7V56B7H: "https://www.amazon.com/dp/B0B7V56B7H?tag=forsale18od-20",
  B0018PJMLA: "https://www.amazon.com/dp/B000FN69PC?tag=forsale18od-20",
  B000FN69PC: "https://www.amazon.com/dp/B000FN69PC?tag=forsale18od-20",
  B0CVD4J3PR: "https://www.amazon.com/dp/1452169950?tag=forsale18od-20",
  "1452169950": "https://www.amazon.com/dp/1452169950?tag=forsale18od-20",
};

const RESOURCE_TITLE_OVERRIDES: Record<string, Partial<Resource>> = {
  "BETTER TOGETHER Conversation Cards": {
    image_url: LOCAL_IMAGE_OVERRIDES.B08948WMF9,
  },
  "Why Don't We — Spice IT UP": {
    image_url: LOCAL_IMAGE_OVERRIDES.B093BCC4VP,
  },
  "InDeep Couples Game": {
    image_url: LOCAL_IMAGE_OVERRIDES.B0DT2JYR59,
  },
  "The Five Minute Journal": {
    image_url: LOCAL_IMAGE_OVERRIDES["0991846206"],
  },
  "Find Your Own Magic Mental Health Journal": {
    image_url: LOCAL_IMAGE_OVERRIDES["6199142705"],
  },
  "We're Not Really Strangers Couples Edition": {
    image_url: LOCAL_IMAGE_OVERRIDES.B0B7V56B7H,
    url: PRODUCT_URL_OVERRIDES.B0B7V56B7H,
  },
  "We're Not Really Strangers — Couples Edition": {
    image_url: LOCAL_IMAGE_OVERRIDES.B0B7V56B7H,
    url: PRODUCT_URL_OVERRIDES.B0B7V56B7H,
  },
  "TableTopics Couples Edition": {
    image_url: LOCAL_IMAGE_OVERRIDES.B000FN69PC,
    url: PRODUCT_URL_OVERRIDES.B000FN69PC,
  },
  "Calm the Chaos Journal": {
    image_url: LOCAL_IMAGE_OVERRIDES["1452169950"],
    url: PRODUCT_URL_OVERRIDES["1452169950"],
    author: "Nicola Ries Taggart",
  },
};

const buildAmazonImageUrl = (asin: string) => LOCAL_IMAGE_OVERRIDES[asin] || `/resource-images/${asin}.jpg`;
const buildAmazonProductUrl = (asin: string) => PRODUCT_URL_OVERRIDES[asin] || `https://www.amazon.com/dp/${asin}?tag=forsale18od-20`;

const extractAsin = (value?: string | null) => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    const asinFromQuery = parsed.searchParams.get("ASIN");
    if (asinFromQuery) return asinFromQuery;
    const dpMatch = parsed.pathname.match(/\/dp\/([A-Z0-9]{10}|\d{10}[A-Z]?)/i);
    if (dpMatch?.[1]) return dpMatch[1];
    const imageMatch = parsed.pathname.match(/\/images\/P\/([^./?]+)/i);
    if (imageMatch?.[1]) return imageMatch[1];
  } catch {
  }

  const rawMatch = value.match(/([A-Z0-9]{10}|\d{10}[A-Z]?)/i);
  if (rawMatch?.[1]) return rawMatch[1];

  return null;
};

const normalizeAmazonImageUrl = (imageUrl: string | null | undefined, productUrl?: string | null) => {
  const asin = extractAsin(imageUrl) || extractAsin(productUrl);
  if (asin) return buildAmazonImageUrl(asin);
  return imageUrl || null;
};

const makeProduct = (
  id: string, title: string, author: string, asin: string,
  price: string, rating: number, tag: string, category: string, order_index: number
): Resource => ({
  id, title, author, description: null, category, tag,
  url: buildAmazonProductUrl(asin),
  image_url: buildAmazonImageUrl(asin),
  price, rating,
  is_featured: tag === "Top Pick" || tag === "Essential",
  order_index,
});

const FALLBACK: Resource[] = [
  makeProduct("b1","The Ethical Slut (3rd Edition)","Janet W. Hardy & Dossie Easton","1587613379","$16.99",4.5,"Essential","books",1),
  makeProduct("b2","Polysecure","Jessica Fern","1944934987","$16.95",4.7,"Top Pick","books",2),
  makeProduct("b3","The Polysecure Workbook","Jessica Fern","1990869041","$21.95",4.6,"Workbook","books",3),
  makeProduct("b4","More Than Two (2nd Edition)","Eve Rickert","0991399706","$19.95",4.4,"Guide","books",4),
  makeProduct("b5","Rewriting the Rules","Meg-John Barker","0415517818","$16.99",4.4,"Modern","books",5),
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
  makeProduct("c7","TableTopics Couples Edition","TableTopics","B000FN69PC","$25.00",4.5,"Original","connection",7),
  makeProduct("c8","We're Not Really Strangers Couples Edition","WNRS","B0B7V56B7H","$24.99",4.6,"Viral","connection",8),
  makeProduct("s1","Self-Care & Gratitude Journal (90-Day)","Love Yourself Softly","B0G3PMTKB8","$12.99",4.6,"Top Pick","selfcare",1),
  makeProduct("s2","Find Your Own Magic Mental Health Journal","FYMJ","6199142705","$16.99",4.5,"12-Month","selfcare",2),
  makeProduct("s3","The Five Minute Journal","Intelligent Change","0991846206","$29.99",4.7,"Classic","selfcare",3),
  makeProduct("s4","Calm the Chaos Journal","Nicola Ries Taggart","1452169950","$14.99",4.4,"Anxiety","selfcare",4),
  makeProduct("s5","Mindfulness Cards","Rohan Gunatillake","1786489880","$14.49",4.5,"Mindfulness","selfcare",5),
  makeProduct("s6","Self-Love Workbook for Women","Megan Logan","1647397294","$11.99",4.5,"Self-Love","selfcare",6),
];

const FALLBACK_BY_ASIN = Object.fromEntries(
  FALLBACK.map((resource) => {
    const asin = extractAsin(resource.url) ?? resource.id;
    return [asin, resource];
  })
) as Record<string, Resource>;

const CATEGORIES = [
  { key: "All", label: "All", icon: null },
  { key: "books", label: "Books & Education", icon: <BookOpen className="w-4 h-4" /> },
  { key: "connection", label: "Intimacy & Connection", icon: <Heart className="w-4 h-4" /> },
  { key: "selfcare", label: "Self-Care & Wellness", icon: <Sparkles className="w-4 h-4" /> },
  { key: "advocacy", label: "Advocacy & Action", icon: <Megaphone className="w-4 h-4" /> },
] as const;

/* ── page ── */

const Resources = () => {
  const [activeTab, setActiveTab] = useState("All");
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get("tab");

  // Set initial tab from URL param
  useState(() => {
    if (tabParam && CATEGORIES.some(c => c.key === tabParam)) {
      setActiveTab(tabParam);
    }
  });

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
      return (data as any[]).map((r: any) => {
        const asin = extractAsin(r.url) || extractAsin(r.image_url);
        const fallback = FALLBACK_BY_ASIN[asin || ""];
        const titleOverride = RESOURCE_TITLE_OVERRIDES[r.title] || RESOURCE_TITLE_OVERRIDES[fallback?.title || ""];

        return {
          ...fallback,
          ...r,
          ...titleOverride,
          url: titleOverride?.url || (asin ? buildAmazonProductUrl(asin) : r.url),
          image_url: titleOverride?.image_url || (asin ? buildAmazonImageUrl(asin) : normalizeAmazonImageUrl(r.image_url, r.url)),
          author: r.author || fallback?.author || "",
          price: r.price || fallback?.price || "",
          rating: r.rating || fallback?.rating || 0,
          tag: r.tag || fallback?.tag || "",
        } as Resource;
      });
    },
    staleTime: 60 * 60 * 1000, // 1 hour — very static content
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

  const categoryOrder = ["books", "connection", "selfcare", "advocacy"];
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
      <div className="text-center pb-4 px-4" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px) + 1rem, 2rem)' }}>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Curated Tools for Your ENM Journey
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mt-2">
          Hand-picked books, games, and wellness tools to strengthen your relationships.
        </p>
      </div>

      {/* Sticky tabs */}
      <div className="sticky z-40 w-full border-b border-gray-800/60" style={{ top: 'env(safe-area-inset-top)', backgroundColor: '#030712', boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide">
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
