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

type SupportedLanguage =
  | "en-US"
  | "hi-IN"
  | "kn-IN"
  | "te-IN"
  | "ta-IN"
  | "mr-IN"
  | "bn-IN"
  | "gu-IN"
  | "ml-IN"
  | "pa-IN"
  | "or-IN"
  | "ur-IN";
type VoiceGender = "male" | "female";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const LANG_LABELS: Record<SupportedLanguage, { name: string; native: string; letter: string }> = {
  "en-US": { name: "English", native: "English", letter: "A" },
  "hi-IN": { name: "Hindi", native: "हिंदी", letter: "अ" },
  "kn-IN": { name: "Kannada", native: "ಕನ್ನಡ", letter: "ಕ" },
  "te-IN": { name: "Telugu", native: "తెలుగు", letter: "అ" },
  "ta-IN": { name: "Tamil", native: "தமிழ்", letter: "அ" },
  "mr-IN": { name: "Marathi", native: "मराठी", letter: "म" },
  "bn-IN": { name: "Bengali", native: "বাংলা", letter: "অ" },
  "gu-IN": { name: "Gujarati", native: "ગુજરાતી", letter: "અ" },
  "ml-IN": { name: "Malayalam", native: "മലയാളം", letter: "അ" },
  "pa-IN": { name: "Punjabi", native: "ਪੰਜਾਬੀ", letter: "ੳ" },
  "or-IN": { name: "Odia", native: "ଓଡ଼ିଆ", letter: "ଅ" },
  "ur-IN": { name: "Urdu", native: "اردو", letter: "ا" },
};

const LANG_SYSTEM_SUFFIX: Record<SupportedLanguage, string> = {
  "en-US": "Always respond in English.",
  "hi-IN": "Always respond in Hindi (हिंदी). Use Devanagari script.",
  "kn-IN": "Always respond in Kannada (ಕನ್ನಡ). Use Kannada script.",
  "te-IN": "Always respond in Telugu (తెలుగు). Use Telugu script.",
  "ta-IN": "Always respond in Tamil (தமிழ்). Use Tamil script.",
  "mr-IN": "Always respond in Marathi (मराठी). Use Devanagari script.",
  "bn-IN": "Always respond in Bengali (বাংলা). Use Bengali script.",
  "gu-IN": "Always respond in Gujarati (ગુજરાતી). Use Gujarati script.",
  "ml-IN": "Always respond in Malayalam (മലയാളം). Use Malayalam script.",
  "pa-IN": "Always respond in Punjabi (ਪੰਜਾਬੀ). Use Gurmukhi script.",
  "or-IN": "Always respond in Odia (ଓଡ଼ିଆ). Use Odia script.",
  "ur-IN": "Always respond in Urdu (اردو). Use Urdu Nastaliq script style.",
};

const WELCOME: Record<SupportedLanguage, string> = {
  "en-US": "Hello! 👋 I'm your Farm Shield Voice Assistant. Ask me anything about farming, crops, diseases, treatments, soil, irrigation, or government schemes. You can type or tap the mic to speak!",
  "hi-IN": "नमस्ते! 👋 मैं आपका फार्म शील्ड वॉइस सहायक हूं। खेती, फसलों, बीमारियों, उपचार, मिट्टी, सिंचाई, या सरकारी योजनाओं के बारे में कुछ भी पूछें। आप टाइप कर सकते हैं या माइक दबाकर बोल सकते हैं!",
  "kn-IN": "ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ ಫಾರ್ಮ್ ಶೀಲ್ಡ್ ಧ್ವನಿ ಸಹಾಯಕ. ಕೃಷಿ, ಬೆಳೆಗಳು, ರೋಗಗಳು, ಚಿಕಿತ್ಸೆ, ಮಣ್ಣು, ನೀರಾವರಿ, ಅಥವಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ. ನೀವು ಟೈಪ್ ಮಾಡಬಹುದು ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಬಹುದು!",
  "te-IN": "నమస్కారం! 👋 నేను మీ ఫార్మ్ షీల్డ్ వాయిస్ అసిస్టెంట్. వ్యవసాయం, పంటలు, తెగుళ్లు, నివారణోపాయాలు, నేల, నీటిపారుదల లేదా ప్రభుత్వ పథకాల గురించి నన్ను ఏదైనా అడగండి. మీరు టైప్ చేయవచ్చు లేదా మాట్లాడటానికి మైక్‌ను నొక్కవచ్చు!",
  "ta-IN": "வணக்கம்! 👋 நான் உங்கள் ஃபார்ம் ஷீல்டு குரல் உதவியாளர். விவசாயம், பயிர்கள், நோய்கள், சிகிச்சைகள், மண், நீர்ப்பாசனம் அல்லது அரசு திட்டங்கள் பற்றி என்னிடம் கேளுங்கள். நீங்கள் தட்டச்சு செய்யலாம் அல்லது பேச மைக் ஐ அழுத்தலாம்!",
  "mr-IN": "नमस्कार! 👋 मी आपला फार्म शील्ड व्हॉइस असिस्टंट आहे. शेती, पिके, रोग, उपचार, माती, सिंचन किंवा सरकारी योजनांबद्दल मला काहीही विचारा. आपण टाईप करू शकता किंवा बोलण्यासाठी माईकवर टॅप करू शकता!",
  "bn-IN": "নমস্কার! 👋 আমি আপনার ফার্ম শিল্ড ভয়েস অ্যাসিস্ট্যান্ট। চাষাবাদ, ফসল, রোগবালাই, প্রতিকার, মাটি, সেচ বা সরকারি প্রকল্প সম্পর্কে আমাকে যেকোনো প্রশ্ন করতে পারেন। আপনি টাইপ করতে পারেন অথবা কথা বলতে মাইক ট্যাপ করতে পারেন!",
  "gu-IN": "નમસ્તે! 👋 હું તમારો ફાર્મ શીલ્ડ વોઇસ આસિસ્ટન્ટ છું. ખેતી, પાક, રોગો, ઉપચાર, જમીન, સિંચાઈ અથવા સરકારી યોજનાઓ વિશે મને કંઈપણ પૂછો. તમે ટાઇપ કરી શકો છો અથવા બોલવા માટે માઇક ટૅપ કરી શકો છો!",
  "ml-IN": "നമസ്കാരം! 👋 ഞാൻ നിങ്ങളുടെ ഫാം ഷീൽഡ് വോയ്സ് അസിന്റന്റാണ്. കൃഷി, വിളകൾ, രോഗങ്ങൾ, ചികിത്സകൾ, മണ്ണ്, ജലസേചനം അല്ലെങ്കിൽ സർക്കാർ പദ്ധതികളെക്കുറിച്ച് എന്നോട് എന്തും ചോദിക്കാം. നിങ്ങൾക്ക് ടൈപ്പ് ചെയ്യാം അല്ലെങ്കിൽ സംസാരിക്കാൻ മൈക്ക് ടാപ്പ് ചെയ്യാം!",
  "pa-IN": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 👋 ਮੈਂ ਤੁਹਾਡਾ ਫਾਰਮ ਸ਼ੀਲਡ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਹਾਂ। ਖੇਤੀਬਾੜੀ, ਫਸਲਾਂ, ਬਿਮਾਰੀਆਂ, ਇਲਾਜ, ਮਿੱਟੀ, ਸਿੰਚਾਈ, ਜਾਂ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਬਾਰੇ ਮੈਨੂੰ ਕੁਝ ਵੀ ਪੁੱਛੋ। ਤੁਸੀਂ ਟਾਈਪ ਕਰ ਸਕਦੇ ਹੋ ਜਾਂ ਬੋਲਣ ਲਈ ਮਾਈਕ 'ਤੇ ਟੈਪ ਕਰ ਸਕਦੇ ਹੋ!",
  "or-IN": "ନମସ୍କାର! 👋 ମୁଁ ଆପଣଙ୍କର ଫାର୍ମ ଶିଲ୍ଡ ଭଏସ ଆସିଷ୍ଟାଣ୍ଟ। କୃଷି, ଫସଲ, ରୋଗ, ପ୍ରତିକାର, ମୃତ୍ତିକା, ଜଳସେଚନ କିମ୍ବା ସରକାରୀ ଯୋଜନା ବିଷୟରେ ମତେ କିଛି ବି ପଚାରନ୍ତୁ। ଆପଣ ଟାଇପ୍ କରିପାରିବେ କିମ୍ବା କହିବା ପାଇଁ ମାଇକ୍ ଟ୍ୟାପ୍ କରିପାରିବେ!",
  "ur-IN": "السلام علیکم! 👋 میں آپ کا فارم شیلڈ وائس اسسٹنٹ ہوں۔ مجھ سے زراعت، فصلوں، بیماریوں، علاج، مٹی، آبپاشی، یا سرکاری اسکیموں کے بارے میں کچھ بھی پوچھیں۔ آپ ٹائپ کر سکتے ہیں یا بولنے کے لیے مائیک دبا سکتے ہیں!",
};

export function VoiceNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem("farm_shield_chatbot_lang");
    return (saved as SupportedLanguage) || "en-US";
  });
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(() => {
    return !!localStorage.getItem("farm_shield_chatbot_lang");
  });
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("female");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, hasSelectedLanguage]);

  const groqTTS = async (text: string) => {
    const groqKey = import.meta.env.VITE_GROQ_KEY;
    if (!groqKey) return;

    try {
      setIsSpeaking(true);
      const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "canopylabs/orpheus-v1-english",
          voice: voiceGender === "female" ? "samantha" : "david",
          input: text
        })
      });

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.play().catch(e => {
        console.error("Autoplay blocked or failed:", e);
        toast({
          title: "Audio Blocked",
          description: "Browser blocked autoplay. Please tap anywhere on the screen or use the 'Play' button on the message.",
          duration: 10000
        });
      });

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMsg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const groqKey = import.meta.env.VITE_GROQ_KEY;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are Krishi Voice, an Indian farming assistant.

LANGUAGE RULE — THIS IS YOUR MOST IMPORTANT RULE:
1. You must reply strictly in the language requested by the user, which is: ${LANG_LABELS[language].name} (${LANG_LABELS[language].native}).
2. Use the correct script for this language (e.g. Devanagari script for Hindi/Marathi, Kannada script for Kannada, Telugu script for Telugu, Tamil script for Tamil, Gurmukhi for Punjabi, etc.).
3. NEVER switch languages. Even if the user message contains English words, translate them and reply fully in ${LANG_LABELS[language].name}.
4. Provide highly comprehensive, detailed agricultural answers. Do NOT give short or summary answers unless explicitly asked. Detail is preferred to help the farmer succeed.

FARMING RULE:
- Answer farming, crop, pest, treatment, soil, water, and scheme questions.
- Maintain a premium, expert tone.

${LANG_SYSTEM_SUFFIX[language]}`
            },
            ...newMessages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
          ],
          temperature: 0.7
        }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const data = await response.json();
      const assistantContent = data.choices[0].message.content;

      setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);

      const isEnglish = (text: string) => {
        const latinChars = text.match(/[A-Za-z0-9\s.,!?'"()]/g) || [];
        return (latinChars.length / text.length) > 0.8;
      };

      if (isEnglish(assistantContent)) {
        groqTTS(assistantContent);
      }

    } catch (error) {
      console.error("Voice chat error:", error);
      toast({ title: "Error", description: "Failed to get AI response", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, language, voiceGender, toast]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleSTT(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      setTranscript("Listening...");
    } catch (err) {
      toast({ title: "Mic Error", description: "Could not access microphone.", variant: "destructive" });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const handleSTT = async (blob: Blob) => {
    const groqKey = import.meta.env.VITE_GROQ_KEY;
    setIsLoading(true);
    setTranscript("Processing voice...");

    try {
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");
      formData.append("model", "whisper-large-v3");
      formData.append("language", language.split("-")[0]);
      formData.append("response_format", "json");

      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`
        },
        body: formData
      });

      if (!response.ok) throw new Error("STT failed");

      const data = await response.json();
      if (data.text) {
        setTranscript(data.text);
        setInput(data.text);
        sendMessage(data.text);
      }
    } catch (error) {
      console.error("STT Error:", error);
      toast({ title: "Voice Error", description: "Failed to transcribe audio.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    stopSpeaking();
  }, [stopSpeaking]);

  return (
    <>
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

      {isOpen && (
        <div className="fixed bottom-[7.5rem] right-6 w-[380px] h-[520px] flex flex-col bg-card/90 backdrop-blur-xl rounded-2xl shadow-2xl z-50 border border-primary/20 animate-in slide-in-from-bottom-5">
          <div className="py-3 px-4 border-b bg-primary/5 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                <Mic className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Krishi Voice AI</h3>
                <p className="text-xs text-muted-foreground">{LANG_LABELS[language].native}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <User2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setVoiceGender("male")}>👨 Male Voice</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setVoiceGender("female")}>👩 Female Voice</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Languages className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                  {(Object.entries(LANG_LABELS) as [SupportedLanguage, { name: string; native: string; letter: string }][]).map(([code, label]) => (
                    <DropdownMenuItem 
                      key={code} 
                      onClick={() => {
                        setLanguage(code);
                        localStorage.setItem("farm_shield_chatbot_lang", code);
                        setHasSelectedLanguage(true);
                        toast({
                          title: "Language Selected",
                          description: `Krishi Voice will now reply in: ${label.name}`,
                        });
                        sendMessage(`I have selected ${label.name}. Please respond to all my future messages in ${label.native} only.`);
                      }}
                    >
                      {label.native} ({label.name})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearChat}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!hasSelectedLanguage ? (
            <div className="flex-1 flex flex-col justify-center items-center p-4 bg-gradient-to-br from-background/90 to-background/50 h-full animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-2 animate-bounce">
                  <Languages className="h-6 w-6 text-accent" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-foreground bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
                  Choose Language
                </h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                  Select your language for farming advice & voice chat
                </p>
              </div>

              <ScrollArea className="w-full max-h-[300px] pr-2">
                <div className="grid grid-cols-2 gap-2 p-1">
                  {(Object.entries(LANG_LABELS) as [SupportedLanguage, { name: string; native: string; letter: string }][]).map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code);
                        localStorage.setItem("farm_shield_chatbot_lang", code);
                        setHasSelectedLanguage(true);
                        toast({
                          title: "Language Set",
                          description: `Farm Shield chatbot is now set to ${label.name}`,
                        });
                      }}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-xl text-left border transition-all duration-300 group",
                        "bg-white/5 backdrop-blur-md border-white/10 hover:border-accent/40 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(var(--accent),0.1)]",
                        "active:scale-95 transform"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 group-hover:bg-accent/20 group-hover:border-accent/30 transition-all font-bold text-sm text-accent">
                        {label.letter}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                          {label.native}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {label.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="mt-4 text-[10px] text-muted-foreground/80 flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                You can change this later from settings
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                        "rounded-lg px-3 py-2 max-w-[85%] text-sm relative group",
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      )}>
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        {msg.role === "assistant" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => groqTTS(msg.content)}
                            title="Replay audio"
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Loader2 className="h-4 w-4 animate-spin text-accent-foreground" />
                      </div>
                      <div className="rounded-lg px-3 py-2 bg-muted text-sm text-muted-foreground">
                        {transcript || "AI is thinking..."}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {isSpeaking && (
                <div className="px-4 py-2 border-t bg-accent/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-accent-foreground animate-pulse" />
                    <span className="text-xs text-muted-foreground">Speaking...</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={stopSpeaking}>Stop</Button>
                </div>
              )}

              <div className="p-3 border-t bg-background rounded-b-2xl flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Ask anything..."
                  disabled={isLoading}
                  className="min-h-[44px] max-h-[80px] resize-none text-sm rounded-xl"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={() => isListening ? stopListening() : startListening()}
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
                  className="shrink-0 h-11 w-11 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
