import { Link } from "react-router-dom";
import { Leaf, Camera, History, ArrowRight, Shield, Zap, Globe, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useRef, useState, useEffect, useCallback } from "react";
import heroVideo from "@/assets/hero-video.mp4";

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

function useStormAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ rain: AudioBufferSourceNode | null; gainNode: GainNode | null }>({ rain: null, gainNode: null });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createRainBuffer = useCallback((ctx: AudioContext) => {
    const sampleRate = ctx.sampleRate;
    const duration = 4;
    const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
    }
    return buffer;
  }, []);

  const playThunder = useCallback((ctx: AudioContext, master: GainNode) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 80 + Math.random() * 60;
    osc.type = "sawtooth";
    osc.frequency.value = 30 + Math.random() * 30;
    gain.gain.setValueAtTime(0.4 + Math.random() * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5 + Math.random());
    osc.connect(filter).connect(gain).connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 2.5);
  }, []);

  const start = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5;
    gainNode.connect(ctx.destination);
    nodesRef.current.gainNode = gainNode;

    // Rain noise through bandpass
    const rainBuffer = createRainBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = rainBuffer;
    source.loop = true;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 800;
    bandpass.Q.value = 0.5;
    source.connect(bandpass).connect(gainNode);
    source.start();
    nodesRef.current.rain = source;

    // Periodic thunder
    playThunder(ctx, gainNode);
    intervalRef.current = setInterval(() => {
      if (audioCtxRef.current) playThunder(audioCtxRef.current, gainNode);
    }, 4000 + Math.random() * 4000);
  }, [createRainBuffer, playThunder]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    nodesRef.current.rain?.stop();
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    nodesRef.current = { rain: null, gainNode: null };
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { start, stop };
}

export default function Index() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const storm = useStormAudio();

  const toggleMute = () => {
    if (isMuted) {
      storm.start();
    } else {
      storm.stop();
    }
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  return (
    <Layout>
      {/* Hero Video Section */}
      <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
        {/* Video Background */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={heroVideo}
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        {/* Content Overlay - buttons at bottom */}
        <div className="relative z-10 flex items-end justify-center h-full pb-12 md:pb-16">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to={user ? "/diagnosis" : "/auth?tab=signup"}>
                {user ? "Start Diagnosis" : "Get Started Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {user && (
              <Button size="lg" className="bg-primary text-primary-foreground border-primary hover:bg-primary/80" asChild>
                <Link to="/history">
                  <History className="mr-2 h-4 w-4" />
                  View History
                </Link>
              </Button>
            )}
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
