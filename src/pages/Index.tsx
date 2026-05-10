import { Link } from "react-router-dom";
import { Leaf, Camera, History, ArrowRight, Shield, Zap, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { HeroGrass } from "@/components/HeroGrass";

const features = [
  {
    icon: Camera,
    title: "AI-Powered Diagnosis",
    description: "Upload a plant image and get instant disease identification with treatment recommendations.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Shield,
    title: "Expert Treatment Plans",
    description: "Receive actionable treatment recommendations and prevention tips from our AI agricultural expert.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get diagnosis results within seconds, with confidence scores and severity assessments.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Globe,
    title: "Track Your History",
    description: "Access your complete diagnosis history to monitor crop health over time.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: User,
    title: "Krishi Setu",
    description: "Connect farmers with agricultural labor instantly. Your farm's bridge to skilled workers.",
    color: "text-amber-600",
    bgColor: "bg-amber-600/10",
  },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden flex flex-col items-center justify-center" style={{ height: "clamp(400px, 70vh, 85vh)" }}>
        <HeroGrass />
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center pointer-events-none">
          <div className="mb-6 opacity-0 animate-[fadeUp_1s_ease_0.2s_forwards]">
            <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 mx-auto">
              <path d="M24 4L8 12v10c0 10.5 6.8 20.3 16 22.5 9.2-2.2 16-12 16-22.5V12L24 4z" fill="#3d6b1b" fillOpacity="0.12" stroke="#3d6b1b" strokeWidth="2"/>
              <path d="M18 24l4 4 8-8" stroke="#3d6b1b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-widest text-[#2d5a10] mb-6 opacity-0 animate-[fadeUp_1s_ease_0.4s_forwards]">
            FARM SHIELD
          </h1>
          <div className="w-12 h-1 bg-[#5a7a2e]/30 rounded-full mb-6 mx-auto opacity-0 animate-[fadeUp_1s_ease_0.6s_forwards]"></div>
          <p className="text-[#2d3c1e]/80 text-lg md:text-xl font-medium max-w-2xl mb-10 leading-relaxed opacity-0 animate-[fadeUp_1s_ease_0.8s_forwards]">
            AI-powered agricultural intelligence for Indian farmers — protecting crops, predicting risks, and cultivating smarter harvests.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto pointer-events-auto opacity-0 animate-[fadeUp_1s_ease_1s_forwards]">
            <Button size="lg" className="w-full sm:w-auto bg-[#3d6b1b] hover:bg-[#2d5a10] text-white rounded-full px-8 py-6 shadow-lg shadow-[#3d6b1b]/20" asChild>
              <Link to={user ? "/diagnosis" : "/auth?tab=signup"}>
                {user ? "Start Diagnosis" : "Get Started"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {user && (
              <Button size="lg" className="w-full sm:w-auto bg-white/40 hover:bg-white/60 text-[#2d5a10] backdrop-blur-md border border-white/40 rounded-full px-8 py-6 transition-all" asChild>
                <Link to="/history">
                  <History className="mr-2 h-4 w-4" />
                  View History
                </Link>
              </Button>
            )}
            <Button size="lg" className="w-full sm:w-auto bg-white/40 hover:bg-white/60 text-[#2d5a10] backdrop-blur-md border border-white/40 rounded-full px-8 py-6 transition-all" asChild>
              <Link to="/krishi-setu">
                <User className="mr-2 h-4 w-4" />
                Krishi Setu
              </Link>
            </Button>
          </div>
        </div>

        {/* Keyboard Hint */}
        <div className="absolute bottom-6 right-6 z-10 hidden sm:flex items-center gap-2 text-xs font-medium text-[#2d3c1e]/40 tracking-wider pointer-events-none opacity-0 animate-[fadeUp_1s_ease_1.8s_forwards]">
          <span className="flex items-center justify-center w-6 h-6 bg-white/45 border border-[#5a7a2e]/20 rounded font-semibold text-[#2d3c1e]/60">W</span>
          <span className="flex items-center justify-center w-6 h-6 bg-white/45 border border-[#5a7a2e]/20 rounded font-semibold text-[#2d3c1e]/60">A</span>
          <span className="flex items-center justify-center w-6 h-6 bg-white/45 border border-[#5a7a2e]/20 rounded font-semibold text-[#2d3c1e]/60">S</span>
          <span className="flex items-center justify-center w-6 h-6 bg-white/45 border border-[#5a7a2e]/20 rounded font-semibold text-[#2d3c1e]/60">D</span>
          <span className="ml-1">to move</span>
          <span className="flex items-center justify-center w-12 h-6 ml-1 bg-white/45 border border-[#5a7a2e]/20 rounded font-semibold text-[#2d3c1e]/60">Space</span>
          <span className="ml-1">jump</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">How Farm Shield Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Our AI-powered platform provides accurate plant disease diagnosis in seconds,
              helping you take action before it's too late.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="container px-4">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Ready to protect your crops?
                </h2>
                <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                  Join thousands of farmers using Farm Shield to diagnose plant diseases
                  and get expert treatment recommendations.
                </p>
                <div>
                  <Button size="lg" asChild>
                    <Link to={user ? "/diagnosis" : "/auth"}>
                      {user ? "Diagnose Now" : "Sign Up Free"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative h-48 md:h-auto bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Leaf className="h-24 w-24 md:h-32 md:w-32 text-primary/30" />
              </div>
            </div>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
