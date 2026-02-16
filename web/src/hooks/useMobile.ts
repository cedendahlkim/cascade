/**
 * Mobile-specific features hook for Gracestack AI Lab
 *
 * L1: Haptic feedback via Vibration API
 * L2: PWA shortcuts & install prompt
 * L3: Voice input via Web Speech API
 * L4: Offline detection & cached conversations
 */
import { useState, useEffect, useCallback, useRef } from "react";

// --- L1: Haptic Feedback ---

export type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "double" | "message";

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [15, 50, 30],
  warning: [50, 30, 50],
  error: [80, 40, 80, 40, 80],
  double: [20, 60, 20],
  message: [10, 30, 15],
};

export interface HapticSettings {
  enabled: boolean;
  onMessage: boolean;
  onThinking: boolean;
  onDone: boolean;
  onError: boolean;
  onQuestion: boolean;
  intensity: "light" | "medium" | "heavy";
}

const DEFAULT_HAPTIC_SETTINGS: HapticSettings = {
  enabled: true,
  onMessage: true,
  onThinking: false,
  onDone: true,
  onError: true,
  onQuestion: true,
  intensity: "medium",
};

export function loadHapticSettings(): HapticSettings {
  try {
    const stored = localStorage.getItem("cascade_haptic_settings");
    if (stored) return { ...DEFAULT_HAPTIC_SETTINGS, ...JSON.parse(stored) };
  } catch { /* defaults */ }
  return { ...DEFAULT_HAPTIC_SETTINGS };
}

export function saveHapticSettings(settings: HapticSettings): void {
  localStorage.setItem("cascade_haptic_settings", JSON.stringify(settings));
}

export function hapticFeedback(pattern: HapticPattern = "medium"): void {
  const settings = loadHapticSettings();
  if (!settings.enabled) return;
  if (!navigator.vibrate) return;
  try {
    navigator.vibrate(HAPTIC_PATTERNS[pattern] || HAPTIC_PATTERNS.medium);
  } catch { /* not supported */ }
}

export function hapticForEvent(event: "message" | "thinking" | "done" | "error" | "question"): void {
  const settings = loadHapticSettings();
  if (!settings.enabled) return;

  const mapping: Record<string, { enabled: boolean; pattern: HapticPattern }> = {
    message: { enabled: settings.onMessage, pattern: "message" },
    thinking: { enabled: settings.onThinking, pattern: "light" },
    done: { enabled: settings.onDone, pattern: "success" },
    error: { enabled: settings.onError, pattern: "error" },
    question: { enabled: settings.onQuestion, pattern: "warning" },
  };

  const config = mapping[event];
  if (config?.enabled) hapticFeedback(config.pattern);
}

// --- L2: PWA Install Prompt ---

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setCanInstall(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt.current) return false;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setCanInstall(false);
    return outcome === "accepted";
  }, []);

  return { canInstall, isInstalled, install };
}

// --- L3: Voice Input via Web Speech API ---

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startListening = useCallback((lang = "sv-SE") => {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.warn("[voice] Speech recognition error:", e.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript("");
    hapticFeedback("light");
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).stop();
    }
    setIsListening(false);
  }, []);

  return { isListening, transcript, isSupported, startListening, stopListening };
}

// --- L4: Offline Detection & Cached Conversations ---

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      if (!navigator.onLine) return;
      // Show reconnection indicator briefly
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 3000);
    };
    const goOffline = () => {
      setIsOnline(false);
      hapticFeedback("warning");
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

// Offline message queue — stores messages sent while offline
const OFFLINE_QUEUE_KEY = "cascade_offline_queue";

export function getOfflineQueue(): Array<{ content: string; timestamp: string }> {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
  } catch { return []; }
}

export function addToOfflineQueue(content: string): void {
  const queue = getOfflineQueue();
  queue.push({ content, timestamp: new Date().toISOString() });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// Conversation cache for offline reading
const CONV_CACHE_KEY = "cascade_offline_conversations";

export function cacheConversations(messages: Array<{ id: string; role: string; content: string; timestamp: string }>): void {
  try {
    // Keep last 100 messages for offline reading
    const trimmed = messages.slice(-100);
    localStorage.setItem(CONV_CACHE_KEY, JSON.stringify(trimmed));
  } catch { /* storage full */ }
}

export function getCachedConversations(): Array<{ id: string; role: string; content: string; timestamp: string }> {
  try {
    return JSON.parse(localStorage.getItem(CONV_CACHE_KEY) || "[]");
  } catch { return []; }
}

// --- Detect mobile device ---
export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
}
