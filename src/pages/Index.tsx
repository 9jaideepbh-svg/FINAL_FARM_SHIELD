import { Link } from "react-router-dom";
import { Leaf, Camera, History, ArrowRight, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";

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
];

export default function Index() {
  const { user } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-10" />
        <div className="container relative py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Leaf className="h-4 w-4" />
              AI-Powered Agriculture
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Protect Your Crops with{" "}
              <span className="text-gradient">Farm Shield</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Advanced AI plant disease diagnosis that helps farmers identify problems early, 
              get treatment recommendations, and protect their harvest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to={user ? "/diagnosis" : "/auth?tab=signup"}>
                  {user ? "Start Diagnosis" : "Get Started Free"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {user && (
                <Button size="lg" variant="outline" asChild>
                  <Link to="/history">
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Farm Shield Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform provides accurate plant disease diagnosis in seconds, 
              helping you take action before it's too late.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <section className="py-20">
        <div className="container">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Ready to protect your crops?
                </h2>
                <p className="text-muted-foreground mb-6">
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
              <div className="relative h-64 md:h-auto bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Leaf className="h-32 w-32 text-primary/30" />
              </div>
            </div>
          </Card>
        </div>
      </section>
    </Layout>
  );
}