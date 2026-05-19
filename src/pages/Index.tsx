import { Link } from "react-router-dom";
import { Star, ArrowRight, Camera, Shield, Zap, Globe, User, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { useUser } from "@clerk/clerk-react";
import GlassSurface from "@/components/GlassSurface";
import BorderGlow from "@/components/BorderGlow";

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
  const { user } = useUser();

  return (
    <Layout>
      {/* Hero Section */}
      <section 
        className="relative w-full min-h-[100dvh] flex flex-col items-center pt-28 md:pt-32 pb-12 px-4 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-bg.png')" }}
      >
        
      {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 max-w-5xl mx-auto text-center mt-4 md:mt-12 px-2">
          
          {/* Headline Glass Surface */}
          <BorderGlow 
            backgroundColor="transparent" 
            borderRadius={32} 
            animated={false} 
            glowRadius={12}
            glowIntensity={0.8}
            fillOpacity={0.08}
            edgeSensitivity={60}
            className="w-full max-w-4xl mb-6 shadow-2xl"
          >
            <GlassSurface 
              width="100%" 
              height="auto" 
              className="p-6 md:p-10" 
              borderRadius={32}
              opacity={0.7}
              backgroundOpacity={0.15}
              distortionScale={0}
              blur={20}
            >
              <h1 className="text-4xl sm:text-6xl md:text-[6rem] leading-[1.05] font-['Oswald'] uppercase tracking-widest font-light opacity-0 animate-[fadeUp_1s_ease_0.4s_forwards] text-center w-full">
                <span className="text-black">Smart farming begins with</span><br />
                <span className="text-gray-600">Smart decisions</span>
              </h1>
            </GlassSurface>
          </BorderGlow>
          
          {/* Subtext Glass Surface */}
          <BorderGlow 
            backgroundColor="transparent" 
            borderRadius={24} 
            animated={false} 
            glowRadius={10}
            glowIntensity={0.8}
            fillOpacity={0.08}
            edgeSensitivity={60}
            className="w-full max-w-3xl shadow-xl"
          >
            <GlassSurface 
              width="100%" 
              height="auto" 
              className="p-5 md:p-8" 
              borderRadius={24}
              opacity={0.6}
              backgroundOpacity={0.15}
              distortionScale={0}
              blur={15}
            >
              <p className="text-lg md:text-xl text-black font-medium leading-relaxed opacity-0 animate-[fadeUp_1s_ease_0.6s_forwards] text-center w-full">
                Farmers empowered with AI analysis in disease detection, price forecasting, kisan times and weather prediction
              </p>
            </GlassSurface>
          </BorderGlow>
          
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
