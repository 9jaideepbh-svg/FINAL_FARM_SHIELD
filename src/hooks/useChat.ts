import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Groq API direct integration
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const groqKey = import.meta.env.VITE_GROQ_KEY;
      if (!groqKey) throw new Error("Groq API key is missing");

      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({ 
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are Krishi Voice, an Indian farming assistant.

LANGUAGE RULE — THIS IS YOUR MOST IMPORTANT RULE:
1. Look at the user's message carefully
2. Detect what language it is written in
3. Reply in THAT EXACT SAME language — no exceptions
4. NEVER switch languages on your own

Examples:
- User writes in English → You reply in English ONLY
- User writes in Kannada (ಕನ್ನಡ) → You reply in Kannada ONLY
- User writes in Hindi → You reply in Hindi ONLY
- User writes in Tamil → You reply in Tamil ONLY
- USER SPEAK IN WHICH LANGUAGE=REPLY IN THAT LANGUAGE ONLY
If you are unsure of the language → reply in English.

FARMING RULE:
- Answer farming questions only
- Keep reply between 50 and 90 words
- Give one clear actionable tip, and say where can he make more profit
- Use simple language a rural farmer understands`
            },
            ...messages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
            { role: "user", content: input.trim() }
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to send message");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
