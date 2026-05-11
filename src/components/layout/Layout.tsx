import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Chatbot } from "@/components/chat/Chatbot";
import { VoiceNavigation } from "@/components/voice/VoiceNavigation";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-1 ${isHomePage ? "" : "pt-32"}`}>
        {children}
      </main>
      {showFooter && <Footer />}
      <Chatbot />
      <VoiceNavigation />
    </div>
  );
}