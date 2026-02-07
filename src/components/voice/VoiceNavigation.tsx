import { useState, useCallback, useEffect } from "react";
import { Mic, MicOff, Volume2, X, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SupportedLanguage = "en-US" | "hi-IN" | "kn-IN";

interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  commands: {
    home: string[];
    diagnosis: string[];
    weather: string[];
    soil: string[];
    schemes: string[];
    history: string[];
    help: string[];
    stop: string[];
  };
  responses: {
    listening: string;
    navigating: string;
    notUnderstood: string;
    helpMessage: string;
    stopped: string;
  };
}

const languages: Record<SupportedLanguage, LanguageConfig> = {
  "en-US": {
    code: "en-US",
    name: "English",
    nativeName: "English",
    commands: {
      home: ["home", "go home", "main page", "dashboard"],
      diagnosis: ["diagnosis", "diagnose", "plant disease", "check plant", "scan plant"],
      weather: ["weather", "weather report", "forecast"],
      soil: ["soil", "soil analysis", "soil test"],
      schemes: ["schemes", "government schemes", "yojana", "subsidy"],
      history: ["history", "past diagnoses", "previous results"],
      help: ["help", "what can you do", "commands"],
      stop: ["stop", "cancel", "close"],
    },
    responses: {
      listening: "Listening...",
      navigating: "Navigating to",
      notUnderstood: "Sorry, I didn't understand. Say 'help' for available commands.",
      helpMessage: "You can say: Home, Diagnosis, Weather, Soil, Schemes, or History",
      stopped: "Voice navigation stopped",
    },
  },
  "hi-IN": {
    code: "hi-IN",
    name: "Hindi",
    nativeName: "हिंदी",
    commands: {
      home: ["होम", "घर", "मुख्य पृष्ठ", "डैशबोर्ड"],
      diagnosis: ["निदान", "जांच", "पौधे की बीमारी", "पौधा जांचें", "रोग निदान"],
      weather: ["मौसम", "मौसम रिपोर्ट", "पूर्वानुमान"],
      soil: ["मिट्टी", "मिट्टी विश्लेषण", "मिट्टी परीक्षण"],
      schemes: ["योजनाएं", "सरकारी योजना", "योजना", "सब्सिडी"],
      history: ["इतिहास", "पिछले निदान", "पिछले परिणाम"],
      help: ["मदद", "सहायता", "कमांड"],
      stop: ["बंद करो", "रद्द करें", "बंद"],
    },
    responses: {
      listening: "सुन रहा हूं...",
      navigating: "जा रहा हूं",
      notUnderstood: "क्षमा करें, समझ नहीं आया। 'मदद' बोलें",
      helpMessage: "आप बोल सकते हैं: होम, निदान, मौसम, मिट्टी, योजनाएं, या इतिहास",
      stopped: "वॉइस नेविगेशन बंद",
    },
  },
  "kn-IN": {
    code: "kn-IN",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    commands: {
      home: ["ಮನೆ", "ಹೋಮ್", "ಮುಖ್ಯ ಪುಟ"],
      diagnosis: ["ರೋಗನಿರ್ಣಯ", "ಪರೀಕ್ಷೆ", "ಗಿಡದ ರೋಗ", "ಸ್ಕ್ಯಾನ್"],
      weather: ["ಹವಾಮಾನ", "ಮುನ್ಸೂಚನೆ"],
      soil: ["ಮಣ್ಣು", "ಮಣ್ಣು ವಿಶ್ಲೇಷಣೆ", "ಮಣ್ಣು ಪರೀಕ್ಷೆ"],
      schemes: ["ಯೋಜನೆಗಳು", "ಸರ್ಕಾರಿ ಯೋಜನೆ", "ಸಬ್ಸಿಡಿ"],
      history: ["ಇತಿಹಾಸ", "ಹಿಂದಿನ ಫಲಿತಾಂಶಗಳು"],
      help: ["ಸಹಾಯ", "ಆಜ್ಞೆಗಳು"],
      stop: ["ನಿಲ್ಲಿಸು", "ಬಂದ್"],
    },
    responses: {
      listening: "ಆಲಿಸುತ್ತಿದ್ದೇನೆ...",
      navigating: "ಹೋಗುತ್ತಿದ್ದೇನೆ",
      notUnderstood: "ಕ್ಷಮಿಸಿ, ಅರ್ಥವಾಗಲಿಲ್ಲ. 'ಸಹಾಯ' ಎಂದು ಹೇಳಿ",
      helpMessage: "ನೀವು ಹೇಳಬಹುದು: ಮನೆ, ರೋಗನಿರ್ಣಯ, ಹವಾಮಾನ, ಮಣ್ಣು, ಯೋಜನೆಗಳು",
      stopped: "ವಾಯ್ಸ್ ನ್ಯಾವಿಗೇಶನ್ ನಿಂತಿದೆ",
    },
  },
};

const routeMap: Record<string, string> = {
  home: "/",
  diagnosis: "/diagnosis",
  weather: "/weather",
  soil: "/soil",
  schemes: "/schemes",
  history: "/history",
};

export function VoiceNavigation() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("en-US");
  const [showPanel, setShowPanel] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const currentLang = languages[language];

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setIsSupported(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [language]);

  const processCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase().trim();
    const lang = currentLang;

    // Check for navigation commands
    for (const [route, commands] of Object.entries(lang.commands)) {
      if (route === "help" || route === "stop") continue;
      
      for (const cmd of commands) {
        if (lowerText.includes(cmd.toLowerCase())) {
          const targetRoute = routeMap[route];
          if (targetRoute && location.pathname !== targetRoute) {
            speak(`${lang.responses.navigating} ${route}`);
            navigate(targetRoute);
            toast({
              title: lang.responses.navigating,
              description: route.charAt(0).toUpperCase() + route.slice(1),
            });
            return true;
          }
        }
      }
    }

    // Check for help command
    for (const cmd of lang.commands.help) {
      if (lowerText.includes(cmd.toLowerCase())) {
        speak(lang.responses.helpMessage);
        toast({
          title: "Voice Commands",
          description: lang.responses.helpMessage,
        });
        return true;
      }
    }

    // Check for stop command
    for (const cmd of lang.commands.stop) {
      if (lowerText.includes(cmd.toLowerCase())) {
        setIsListening(false);
        speak(lang.responses.stopped);
        return true;
      }
    }

    // Not understood
    speak(lang.responses.notUnderstood);
    return false;
  }, [currentLang, location.pathname, navigate, speak, toast]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setShowPanel(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          setTranscript(transcript);
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        processCommand(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error !== "aborted") {
        toast({
          title: "Voice Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [language, processCommand, toast]);

  const stopListening = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsListening(false);
    setShowPanel(false);
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Floating Voice Button */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 items-end">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 rounded-full shadow-lg bg-card"
            >
              <Languages className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.values(languages).map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(language === lang.code && "bg-primary/10")}
              >
                <span className="font-medium">{lang.nativeName}</span>
                <span className="ml-2 text-muted-foreground text-sm">({lang.name})</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Voice Button */}
        <Button
          size="lg"
          onClick={isListening ? stopListening : startListening}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            isListening 
              ? "bg-destructive hover:bg-destructive/90 animate-pulse" 
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {isListening ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Voice Panel */}
      {showPanel && (
        <div className="fixed bottom-44 right-6 z-50 w-72 bg-card rounded-lg shadow-xl border p-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">{currentLang.nativeName}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={stopListening}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="min-h-[60px] bg-muted/50 rounded-lg p-3 flex items-center justify-center">
            {isListening ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                  <span className="w-1 h-5 bg-primary rounded-full animate-pulse" style={{ animationDelay: "450ms" }} />
                  <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "600ms" }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {transcript || currentLang.responses.listening}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                {transcript || "Tap microphone to start"}
              </p>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {currentLang.responses.helpMessage}
          </p>
        </div>
      )}
    </>
  );
}
