import { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, X, Languages, User2, Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SupportedLanguage = "en-US" | "hi-IN" | "kn-IN";
type VoiceGender = "male" | "female";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const LANG_LABELS: Record<SupportedLanguage, { name: string; native: string }> = {
  "en-US": { name: "English", native: "English" },
  "hi-IN": { name: "Hindi", native: "हिंदी" },
  "kn-IN": { name: "Kannada", native: "ಕನ್ನಡ" },
};

const LANG_SYSTEM_SUFFIX: Record<SupportedLanguage, string> = {
  "en-US": "Always respond in English.",
  "hi-IN": "Always respond in Hindi (हिंदी). Use Devanagari script.",
  "kn-IN": "Always respond in Kannada (ಕನ್ನಡ). Use Kannada script.",
};

const WELCOME: Record<SupportedLanguage, string> = {
  "en-US": "Hello! 👋 I'm your Farm Shield Voice Assistant. Ask me anything about farming, crops, diseases, treatments, soil, irrigation, or government schemes. You can type or tap the mic to speak!",
  "hi-IN": "नमस्ते! 👋 मैं आपका फार्म शील्ड वॉइस सहायक हूं। खेती, फसलों, बीमारियों, उपचार, मिट्टी, सिंचाई, या सरकारी योजनाओं के बारे में कुछ भी पूछें। आप टाइप कर सकते हैं या माइक दबाकर बोल सकते हैं!",
  "kn-IN": "ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ ಫಾರ್ಮ್ ಶೀಲ್ಡ್ ಧ್ವನಿ ಸಹಾಯಕ. ಕೃಷಿ, ಬೆಳೆಗಳು, ರೋಗಗಳು, ಚಿಕಿತ್ಸೆ, ಮಣ್ಣು, ನೀರಾವರಿ, ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ. ನೀವು ಟೈಪ್ ಮಾಡಬಹುದು ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಬಹುದು!",
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function VoiceNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>("en-US");
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("female");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const isSupported = typeof window !== "undefined" && 
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Pick a voice matching language + gender preference
  const getVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = language.split("-")[0];
    const langVoices = voices.filter(v => v.lang.startsWith(langPrefix));
    
    if (langVoices.length === 0) return null;

    // Try to match gender by name heuristics
    const genderKeywords = voiceGender === "female" 
      ? ["female", "woman", "girl", "zira", "samantha", "karen", "lekha", "swara"]
      : ["male", "man", "boy", "david", "rishi", "hemant"];

    const genderMatch = langVoices.find(v => 
      genderKeywords.some(k => v.name.toLowerCase().includes(k))
    );

    return genderMatch || langVoices[0];
  }, [language, voiceGender]);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    
    const voice = getVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [language, getVoice]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Load voices
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: ChatMsg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      // Add language instruction to system prompt via a special user context
      const messagesForApi = newMessages.map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: messagesForApi,
          languageInstruction: LANG_SYSTEM_SUFFIX[language],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: errorData.error || "Failed to get response",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!response.body) throw new Error("No response body");

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
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }

      // Speak the final response
      if (assistantContent) {
        speak(assistantContent);
      }
    } catch (error) {
      console.error("Voice chat error:", error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, language, speak, toast]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    stopSpeaking();
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => { setIsListening(true); setTranscript(""); };
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t;
        else setTranscript(t);
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        setInput(finalTranscript);
        // Auto-send after speech recognition
        setTimeout(() => sendMessage(finalTranscript), 300);
      }
    };
    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
      if (event.error !== "aborted") {
        toast({ title: "Voice Error", description: "Could not recognize speech. Try again.", variant: "destructive" });
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [language, sendMessage, stopSpeaking, toast]);

  const clearChat = useCallback(() => {
    setMessages([]);
    stopSpeaking();
  }, [stopSpeaking]);

  if (!isSupported) return null;

  return (
    <>
      {/* Floating Voice Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-all",
          isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-accent hover:bg-accent/90 text-accent-foreground"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </Button>

      {/* Voice Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-[7.5rem] right-6 w-[380px] h-[520px] flex flex-col bg-card rounded-xl shadow-2xl z-50 border border-primary/20 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="py-3 px-4 border-b bg-primary/5 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                <Mic className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Voice Assistant</h3>
                <p className="text-xs text-muted-foreground">{LANG_LABELS[language].native}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Voice Gender Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Voice type">
                    <User2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setVoiceGender("male")} className={cn(voiceGender === "male" && "bg-primary/10")}>
                    👨 Male Voice
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVoiceGender("female")} className={cn(voiceGender === "female" && "bg-primary/10")}>
                    👩 Female Voice
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Language">
                    <Languages className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.entries(LANG_LABELS) as [SupportedLanguage, { name: string; native: string }][]).map(([code, label]) => (
                    <DropdownMenuItem key={code} onClick={() => setLanguage(code)} className={cn(language === code && "bg-primary/10")}>
                      <span className="font-medium">{label.native}</span>
                      <span className="ml-2 text-muted-foreground text-sm">({label.name})</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear */}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearChat} title="Clear chat">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {/* Welcome */}
              {messages.length === 0 && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                    <Mic className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="rounded-lg px-3 py-2 max-w-[85%] text-sm bg-muted whitespace-pre-wrap">
                    {WELCOME[language]}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent"
                  )}>
                    {msg.role === "user" ? <User2 className="h-4 w-4" /> : <Mic className="h-4 w-4 text-accent-foreground" />}
                  </div>
                  <div className={cn(
                    "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}>
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                    <Loader2 className="h-4 w-4 animate-spin text-accent-foreground" />
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-muted text-sm text-muted-foreground">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Listening Indicator */}
          {isListening && (
            <div className="px-4 py-2 border-t bg-primary/5 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-5 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "450ms" }} />
              </div>
              <span className="text-xs text-muted-foreground">{transcript || "Listening..."}</span>
            </div>
          )}

          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="px-4 py-2 border-t bg-accent/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-accent-foreground animate-pulse" />
                <span className="text-xs text-muted-foreground">Speaking...</span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={stopSpeaking}>Stop</Button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t bg-background rounded-b-xl flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }}}
              placeholder={language === "hi-IN" ? "यहाँ टाइप करें या माइक दबाएं..." : language === "kn-IN" ? "ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ..." : "Type here or tap the mic..."}
              disabled={isLoading}
              className="min-h-[44px] max-h-[80px] resize-none text-sm"
              rows={1}
            />
            <Button
              size="icon"
              onClick={() => isListening ? setIsListening(false) : startListening()}
              className={cn(
                "shrink-0 h-11 w-11 rounded-full",
                isListening ? "bg-destructive hover:bg-destructive/90 animate-pulse" : "bg-accent hover:bg-accent/90 text-accent-foreground"
              )}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-11 w-11"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
