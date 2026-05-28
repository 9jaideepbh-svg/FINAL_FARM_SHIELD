import { useState, useMemo, useEffect } from "react";
import { m, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { Landmark, TrendingUp, Users, Phone } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { SchemeCard } from "@/components/schemes/SchemeCard";
import { SchemeFilters } from "@/components/schemes/SchemeFilters";
import { EligibilityChecker } from "@/components/schemes/EligibilityChecker";
import { governmentSchemes, type GovernmentScheme, type SchemeCategory } from "@/lib/schemes-data";

const stats = [
  { 
    icon: Landmark, 
    label: "Active Schemes", 
    value: "6+",
    description: "Government programs"
  },
  { 
    icon: Users, 
    label: "Beneficiaries", 
    value: "25+ Cr",
    description: "Farmers enrolled"
  },
  { 
    icon: TrendingUp, 
    label: "Total Budget", 
    value: "₹2L+ Cr",
    description: "Annual allocation"
  },
];

export default function Schemes() {
  const [selectedCategory, setSelectedCategory] = useState<SchemeCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });
  const bgGradient = useMotionTemplate`radial-gradient(800px circle at ${smoothX}px ${smoothY}px, rgba(34,197,94,0.12), transparent 80%)`;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const filteredSchemes = useMemo(() => {
    return governmentSchemes.filter(scheme => {
      const matchesCategory = selectedCategory === 'all' || scheme.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCheckEligibility = (scheme: GovernmentScheme) => {
    setSelectedScheme(scheme);
    setEligibilityOpen(true);
  };

  return (
    <Layout>
      <m.div className="pointer-events-none fixed inset-0 z-0" style={{ background: bgGradient }} />
      <div className="container py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Government Schemes</h1>
          <p className="text-muted-foreground max-w-2xl">
            Explore agricultural schemes and programs designed to support farmers. 
            Check your eligibility and apply directly through official portals.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="bg-primary/5 border-primary/10">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Helpline Banner */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Need help with applications?</p>
                <p className="text-sm text-muted-foreground">
                  Call Kisan Call Center: <strong>1800-180-1551</strong> (Toll Free)
                </p>
              </div>
            </div>
            <a 
              href="tel:1800-180-1551"
              className="shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call Now
            </a>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="mb-6">
          <SchemeFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredSchemes.length} scheme{filteredSchemes.length !== 1 ? 's' : ''}
            {selectedCategory !== 'all' && ` in ${selectedCategory.replace('-', ' ')}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Schemes Grid */}
        {filteredSchemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.map((scheme) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                onCheckEligibility={handleCheckEligibility}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-1">No schemes found</h3>
              <p className="text-sm">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </Card>
        )}

        {/* Eligibility Checker Modal */}
        <EligibilityChecker
          scheme={selectedScheme}
          open={eligibilityOpen}
          onOpenChange={setEligibilityOpen}
        />
      </div>
    </Layout>
  );
}
