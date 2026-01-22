import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Trash2, Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChat } from "@/hooks/useChat";

const WELCOME_MESSAGE = `Hello! 👋 I'm Farm Shield AI, your 24/7 agricultural assistant.

I can help you with:
• Plant disease diagnosis & treatment
• Crop management advice
• Soil health & fertilizer recommendations
• Irrigation & water management
• Government schemes (PM-KISAN, PMFBY, etc.)
• Organic farming practices

How can I assist you today?`;

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-[380px] h-[520px] flex flex-col shadow-2xl z-50 border-primary/20">
          <CardHeader className="py-3 px-4 border-b bg-primary/5 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Farm Shield AI</CardTitle>
                <p className="text-xs text-muted-foreground">Agricultural Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearMessages}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {/* Welcome message */}
                {messages.length === 0 && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Leaf className="h-4 w-4 text-primary" />
                    </div>
                    <div className="rounded-lg px-3 py-2 max-w-[85%] text-sm bg-muted">
                      <div className="whitespace-pre-wrap">{WELCOME_MESSAGE}</div>
                    </div>
                  </div>
                )}

                {/* Chat messages */}
                {messages.map((message, idx) => (
                  <ChatMessage key={idx} message={message} />
                ))}

                {/* Loading indicator */}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-muted text-sm text-muted-foreground">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-4 border-t bg-background">
              <ChatInput onSend={sendMessage} isLoading={isLoading} />
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
