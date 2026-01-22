import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Chatbot } from "@/components/chat/Chatbot";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
      <Chatbot />
    </div>
  );
}