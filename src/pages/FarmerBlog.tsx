import { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Newspaper, Loader2, RefreshCw, MapPin, Tag,
  Sparkles, Zap, Lightbulb, TrendingUp,
  Leaf, CloudSun, Building2, Users, ChevronRight, ChevronDown,
  BookOpen, Globe,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source: string;
  region: string;
  image_emoji: string;
  published_time: string;
  tags: string[];
  is_breaking: boolean;
}

interface BlogData {
  edition_date: string;
  headline: string;
  articles: Article[];
}

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; gradient: string; bg: string }> = {
  innovation: { label: "Innovation", icon: <Sparkles className="h-4 w-4" />, gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
  scheme: { label: "Govt Scheme", icon: <Building2 className="h-4 w-4" />, gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  success_story: { label: "Farmer Story", icon: <Users className="h-4 w-4" />, gradient: "from-emerald-500 to-green-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  market: { label: "Market", icon: <TrendingUp className="h-4 w-4" />, gradient: "from-orange-500 to-amber-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  weather: { label: "Weather", icon: <CloudSun className="h-4 w-4" />, gradient: "from-sky-500 to-cyan-600", bg: "bg-sky-50 dark:bg-sky-950/30" },
  organic: { label: "Organic", icon: <Leaf className="h-4 w-4" />, gradient: "from-green-500 to-emerald-600", bg: "bg-green-50 dark:bg-green-950/30" },
  policy: { label: "Policy", icon: <Lightbulb className="h-4 w-4" />, gradient: "from-yellow-500 to-orange-500", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
};

const categoryFilters = [
  { id: "all", label: "All News", icon: <Globe className="h-4 w-4" /> },
  { id: "innovation", label: "Innovation", icon: <Sparkles className="h-4 w-4" /> },
  { id: "scheme", label: "Schemes", icon: <Building2 className="h-4 w-4" /> },
  { id: "success_story", label: "Stories", icon: <Users className="h-4 w-4" /> },
  { id: "market", label: "Market", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "weather", label: "Weather", icon: <CloudSun className="h-4 w-4" /> },
  { id: "organic", label: "Organic", icon: <Leaf className="h-4 w-4" /> },
  { id: "policy", label: "Policy", icon: <Lightbulb className="h-4 w-4" /> },
];

const placeholderData: BlogData = {
  edition_date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
  headline: "Today's Agriculture Headlines — Loading latest news...",
  articles: [
    { id: "p1", title: "PM-Kisan 17th Installment Released for 9.5 Crore Farmers", summary: "The government has released the latest installment of PM-Kisan Samman Nidhi benefiting crores of farmers across India.", content: "", category: "scheme", source: "Ministry of Agriculture", region: "All India", image_emoji: "🏛️", published_time: "Just now", tags: ["PM-Kisan", "Subsidy"], is_breaking: true },
    { id: "p2", title: "Drone Technology Revolutionizes Pesticide Spraying in Punjab", summary: "Farmers in Punjab adopt drone-based spraying reducing chemical usage by 30% and saving labor costs.", content: "", category: "innovation", source: "ICAR", region: "Punjab", image_emoji: "🤖", published_time: "1 hour ago", tags: ["Drones", "AgriTech"], is_breaking: false },
    { id: "p3", title: "Organic Farmer from Kerala Earns ₹15 Lakh from 2 Acres", summary: "A success story of integrated organic farming combining spices, vegetables and poultry.", content: "", category: "success_story", source: "Krishi Jagran", region: "Kerala", image_emoji: "🌾", published_time: "2 hours ago", tags: ["Organic", "Success"], is_breaking: false },
    { id: "p4", title: "Tomato Prices Surge 40% Across Major Mandis", summary: "Supply shortage due to unseasonal rains pushes tomato prices up significantly in wholesale markets.", content: "", category: "market", source: "Agmarknet", region: "All India", image_emoji: "📈", published_time: "3 hours ago", tags: ["Prices", "Tomato"], is_breaking: false },
    { id: "p5", title: "IMD Forecasts Above Normal Monsoon for 2026", summary: "Indian Meteorological Department predicts good rainfall season, boosting kharif crop prospects.", content: "", category: "weather", source: "IMD", region: "All India", image_emoji: "🌧️", published_time: "4 hours ago", tags: ["Monsoon", "Weather"], is_breaking: false },
    { id: "p6", title: "Government Raises MSP for Kharif Crops by 5-7%", summary: "Cabinet approves higher minimum support prices for paddy, pulses, and oilseeds for the upcoming season.", content: "", category: "policy", source: "PIB", region: "All India", image_emoji: "📋", published_time: "5 hours ago", tags: ["MSP", "Policy"], is_breaking: false },
  ],
};

export default function FarmerBlog() {
  const [blogData, setBlogData] = useState<BlogData>(placeholderData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFresh, setIsFetchingFresh] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const { toast } = useToast();
  const cacheRef = useRef<Record<string, BlogData>>({});
  const hasFetchedRef = useRef(false);

  const fetchBlog = useCallback(async (category?: string, isBackground = false) => {
    const cat = category || selectedCategory;
    
    if (cacheRef.current[cat]) {
      setBlogData(cacheRef.current[cat]);
      return;
    }

    if (!isBackground) setIsLoading(true);
    else setIsFetchingFresh(true);

    try {
      const { data, error } = await supabase.functions.invoke("farmer-blog", {
        body: { category: cat },
      });
      if (error) throw error;
      setBlogData(data);
      cacheRef.current[cat] = data;
    } catch (err: any) {
      if (!isBackground) {
        toast({ title: "Failed to load news", description: err.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
      setIsFetchingFresh(false);
    }
  }, [selectedCategory, toast]);

  // Fetch fresh data in background on first mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchBlog("all", true);
    }
  }, []);

  const handleRefresh = () => {
    cacheRef.current = {};
    fetchBlog(selectedCategory);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setExpandedArticle(null);
    fetchBlog(cat);
  };

  const filteredArticles = blogData?.articles?.filter(a =>
    selectedCategory === "all" || a.category === selectedCategory
  ) || [];

  const breakingArticle = filteredArticles.find(a => a.is_breaking);
  const regularArticles = filteredArticles.filter(a => !a.is_breaking);

  // Split into featured (first 2) and rest
  const featuredArticles = regularArticles.slice(0, 2);
  const restArticles = regularArticles.slice(2);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-b border-border/50">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgzNCwxMzksMzQsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
          <div className="container max-w-6xl mx-auto py-8 px-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Newspaper className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">Kisan Times</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Your Daily Agriculture Newspaper • AI Powered
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl shadow-sm hover:shadow-md transition-all"
                onClick={handleRefresh}
                disabled={isLoading}
              >
              <RefreshCw className={`h-4 w-4 ${isLoading || isFetchingFresh ? "animate-spin" : ""}`} />
              {isFetchingFresh ? "Updating..." : "Refresh"}
            </Button>
          </div>

          {/* Headline Banner */}
          {blogData?.headline && (
            <div className="mt-6 bg-card/80 backdrop-blur-sm rounded-2xl p-5 border border-border/50 shadow-sm">
              <p className="text-lg font-bold text-foreground leading-snug">{blogData.headline}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">{blogData.edition_date}</p>
                {isFetchingFresh && <span className="text-xs text-primary animate-pulse">• Loading fresh content...</span>}
              </div>
            </div>
          )}

          </div>
        </div>

        <div className="container max-w-6xl mx-auto py-6 px-4">
          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4">
            {categoryFilters.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                    : "bg-card text-muted-foreground hover:bg-accent/50 border border-border/50 hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {
            <div className="space-y-6">
              {/* Breaking News */}
              {breakingArticle && (
                <BreakingCard
                  article={breakingArticle}
                  isExpanded={expandedArticle === breakingArticle.id}
                  onToggle={() => setExpandedArticle(expandedArticle === breakingArticle.id ? null : breakingArticle.id)}
                />
              )}

              {/* Featured Cards - Large */}
              {featuredArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {featuredArticles.map(article => (
                    <FeaturedCard
                      key={article.id}
                      article={article}
                      isExpanded={expandedArticle === article.id}
                      onToggle={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                    />
                  ))}
                </div>
              )}

              {/* Rest of Articles */}
              {restArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restArticles.map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isExpanded={expandedArticle === article.id}
                      onToggle={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                    />
                  ))}
                </div>
              )}

              {filteredArticles.length === 0 && (
                <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Newspaper className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground">No articles found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try a different category</p>
                  <Button variant="outline" className="mt-4 rounded-xl" onClick={() => handleCategoryChange("all")}>View All News</Button>
                </div>
              )}
            </div>
          }
        </div>
      </div>
    </Layout>
  );
}

/* ───────── Sub-components ───────── */

function BreakingCard({ article, isExpanded, onToggle }: { article: Article; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white p-6 cursor-pointer shadow-xl shadow-red-500/20 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm animate-pulse">
            <Zap className="h-3 w-3 mr-1" /> BREAKING
          </Badge>
          <span className="text-xs text-white/70">{article.published_time}</span>
        </div>
        <h2 className="text-2xl font-extrabold mb-2 leading-tight">{article.image_emoji} {article.title}</h2>
        <p className="text-white/80 text-sm leading-relaxed">{article.summary}</p>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm leading-relaxed whitespace-pre-line text-white/90">{article.content}</p>
            <div className="flex items-center gap-3 mt-4 text-xs text-white/60">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{article.region}</span>
              <span>Source: {article.source}</span>
            </div>
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {article.tags.map(t => <Badge key={t} className="bg-white/15 text-white border-white/20 text-[10px]">{t}</Badge>)}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 mt-3 text-xs text-white/70 font-medium">
          {isExpanded ? "Show less" : "Read full story"} {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
}

function FeaturedCard({ article, isExpanded, onToggle }: { article: Article; isExpanded: boolean; onToggle: () => void }) {
  const catConfig = categoryConfig[article.category] || categoryConfig.innovation;

  return (
    <div
      onClick={onToggle}
      className={`group rounded-2xl overflow-hidden border border-border/50 bg-card cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${catConfig.bg}`}
    >
      {/* Colored top strip */}
      <div className={`h-1.5 bg-gradient-to-r ${catConfig.gradient}`} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r ${catConfig.gradient} text-white text-xs font-medium`}>
            {catConfig.icon} {catConfig.label}
          </div>
          <span className="text-xs text-muted-foreground">{article.published_time}</span>
        </div>
        <div className="text-4xl mb-3">{article.image_emoji}</div>
        <h3 className="text-lg font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">{article.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{article.summary}</p>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{article.content}</p>
            <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{article.region}</span>
              <span>Source: {article.source}</span>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {article.tags.map(t => <Badge key={t} variant="outline" className="text-[10px] rounded-lg">{t}</Badge>)}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary">
          {isExpanded ? "Show less" : "Read more"} {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({ article, isExpanded, onToggle }: { article: Article; isExpanded: boolean; onToggle: () => void }) {
  const catConfig = categoryConfig[article.category] || categoryConfig.innovation;

  return (
    <div
      onClick={onToggle}
      className="group rounded-2xl border border-border/50 bg-card p-5 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${catConfig.gradient} text-white text-[10px] font-medium`}>
          {catConfig.icon} {catConfig.label}
        </div>
        <span className="text-[10px] text-muted-foreground">{article.published_time}</span>
      </div>
      <div className="text-2xl mb-2">{article.image_emoji}</div>
      <h3 className="font-bold text-sm text-foreground mb-1.5 leading-snug group-hover:text-primary transition-colors">{article.title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{article.summary}</p>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{article.content}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{article.region}</span>
            <span>{article.source}</span>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {article.tags.map(t => <Badge key={t} variant="outline" className="text-[10px] rounded-lg">{t}</Badge>)}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 mt-2 text-xs font-medium text-primary">
        {isExpanded ? "Less" : "Read more"} {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </div>
    </div>
  );
}
