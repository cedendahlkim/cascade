import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  textToSpeak?: string | null;
  className?: string;
}

// Check browser support
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const hasSpeechRecognition = !!SpeechRecognition;
const hasSpeechSynthesis = "speechSynthesis" in window;

export default function VoiceButton({ onTranscript, textToSpeak, className = "" }: VoiceButtonProps) {
  const [listening, setListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<string | null>(null);

  // Auto-speak new AI responses
  useEffect(() => {
    if (ttsEnabled && textToSpeak && textToSpeak !== lastSpokenRef.current && hasSpeechSynthesis) {
      lastSpokenRef.current = textToSpeak;
      // Strip markdown for cleaner speech
      const clean = textToSpeak
        .replace(/```[\s\S]*?```/g, "kodblock")
        .replace(/[#*_`~\[\]()]/g, "")
        .replace(/\n+/g, ". ")
        .slice(0, 500);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "sv-SE";
      utterance.rate = 1.1;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  }, [textToSpeak, ttsEnabled]);

  const startListening = () => {
    if (!hasSpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "sv-SE";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  const toggleTts = () => {
    if (ttsEnabled) {
      speechSynthesis.cancel();
    }
    setTtsEnabled(!ttsEnabled);
  };

  if (!hasSpeechRecognition && !hasSpeechSynthesis) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {hasSpeechRecognition && (
        <button
          onClick={listening ? stopListening : startListening}
          className={`p-2.5 rounded-xl transition-colors touch-manipulation ${
            listening
              ? "bg-red-600 text-white animate-pulse"
              : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
          }`}
          title={listening ? "Stoppa inspelning" : "Röstinput"}
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      )}
      {hasSpeechSynthesis && (
        <button
          onClick={toggleTts}
          className={`p-2.5 rounded-xl transition-colors touch-manipulation ${
            ttsEnabled
              ? "bg-blue-900/60 text-blue-400 border border-blue-800/50"
              : "bg-slate-800 text-slate-500 hover:text-white border border-slate-700"
          }`}
          title={ttsEnabled ? "Stäng av uppläsning" : "Läs upp svar"}
        >
          {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

export { hasSpeechRecognition, hasSpeechSynthesis };
