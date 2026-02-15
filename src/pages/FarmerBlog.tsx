import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Newspaper, Loader2, RefreshCw, Clock, MapPin, Tag,
  Sparkles, AlertCircle, Zap, Lightbulb, TrendingUp,
  Leaf, CloudSun, Building2, Users, ChevronRight,
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

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  innovation: { label: "Innovation", icon: <Sparkles className="h-3.5 w-3.5" />, color: "bg-purple-100 text-purple-800 border-purple-200" },
  scheme: { label: "Govt Scheme", icon: <Building2 className="h-3.5 w-3.5" />, color: "bg-blue-100 text-blue-800 border-blue-200" },
  success_story: { label: "Farmer Story", icon: <Users className="h-3.5 w-3.5" />, color: "bg-green-100 text-green-800 border-green-200" },
  market: { label: "Market", icon: <TrendingUp className="h-3.5 w-3.5" />, color: "bg-orange-100 text-orange-800 border-orange-200" },
  weather: { label: "Weather", icon: <CloudSun className="h-3.5 w-3.5" />, color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  organic: { label: "Organic", icon: <Leaf className="h-3.5 w-3.5" />, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  policy: { label: "Policy", icon: <Lightbulb className="h-3.5 w-3.5" />, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

const categoryFilters = [
  { id: "all", label: "All News" },
  { id: "innovation", label: "Innovation" },
  { id: "scheme", label: "Schemes" },
  { id: "success_story", label: "Farmer Stories" },
  { id: "market", label: "Market" },
  { id: "weather", label: "Weather" },
  { id: "organic", label: "Organic" },
  { id: "policy", label: "Policy" },
];

export default function FarmerBlog() {
  const [blogData, setBlogData] = useState<BlogData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();

  const fetchBlog = useCallback(async (category?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("farmer-blog", {
        body: { category: category || selectedCategory },
      });
      if (error) throw error;
      setBlogData(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      toast({ title: "Failed to load news", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, toast]);

  useEffect(() => {
    fetchBlog();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBlog();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchBlog]);

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

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-6 px-4">
        {/* Newspaper Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Newspaper className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Kisan Times</h1>
          </div>
          <p className="text-muted-foreground text-sm">Your Daily Agriculture Newspaper • Powered by AI</p>
          <Separator className="mt-3" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {blogData?.edition_date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => fetchBlog()} disabled={isLoading}>
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Headline */}
        {blogData?.headline && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 text-center">
            <p className="text-lg font-bold text-primary">{blogData.headline}</p>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {categoryFilters.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(cat.id)}
              className="whitespace-nowrap text-xs"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating today's edition...</p>
            <p className="text-xs text-muted-foreground">Curating latest agricultural news with AI</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Breaking News */}
            {breakingArticle && (
              <Card className="border-2 border-red-300 bg-red-50 cursor-pointer" onClick={() => setExpandedArticle(expandedArticle === breakingArticle.id ? null : breakingArticle.id)}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-600 text-white animate-pulse">
                      <Zap className="h-3 w-3 mr-1" /> BREAKING
                    </Badge>
                    <span className="text-xs text-muted-foreground">{breakingArticle.published_time}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2">{breakingArticle.image_emoji} {breakingArticle.title}</h2>
                  <p className="text-sm text-muted-foreground">{breakingArticle.summary}</p>
                  {expandedArticle === breakingArticle.id && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm leading-relaxed whitespace-pre-line">{breakingArticle.content}</p>
                      <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{breakingArticle.region}</span>
                        <span>Source: {breakingArticle.source}</span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {breakingArticle.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                      </div>
                    </div>
                  )}
                  {expandedArticle !== breakingArticle.id && (
                    <p className="text-xs text-primary mt-2 flex items-center gap-1">Read more <ChevronRight className="h-3 w-3" /></p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regularArticles.map(article => {
                const catConfig = categoryConfig[article.category] || categoryConfig.innovation;
                const isExpanded = expandedArticle === article.id;

                return (
                  <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setExpandedArticle(isExpanded ? null : article.id)}>
                    <CardContent className="pt-5">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={`text-[10px] gap-1 ${catConfig.color}`}>
                          {catConfig.icon} {catConfig.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{article.published_time}</span>
                      </div>
                      <h3 className="font-bold text-sm mb-1.5">{article.image_emoji} {article.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm leading-relaxed whitespace-pre-line">{article.content}</p>
                          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{article.region}</span>
                            <span>Source: {article.source}</span>
                          </div>
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {article.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                          </div>
                        </div>
                      )}

                      {!isExpanded && (
                        <p className="text-xs text-primary mt-2 flex items-center gap-1">Read more <ChevronRight className="h-3 w-3" /></p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-10">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No articles found for this category</p>
                <Button variant="outline" className="mt-3" onClick={() => handleCategoryChange("all")}>View All News</Button>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">Auto-refreshes every minute • Last updated: {lastRefresh.toLocaleTimeString("en-IN")}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
