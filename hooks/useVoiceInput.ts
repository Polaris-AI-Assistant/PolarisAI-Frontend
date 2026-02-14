"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Supported languages for Web Speech API (100+ languages)
export const SUPPORTED_LANGUAGES = [
  { code: "en-US", label: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", label: "English (UK)", flag: "🇬🇧" },
  { code: "en-IN", label: "English (India)", flag: "🇮🇳" },
  { code: "hi-IN", label: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { code: "bn-IN", label: "Bengali (বাংলা)", flag: "🇮🇳" },
  { code: "ta-IN", label: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "te-IN", label: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "mr-IN", label: "Marathi (मराठी)", flag: "🇮🇳" },
  { code: "gu-IN", label: "Gujarati (ગુજરાતી)", flag: "🇮🇳" },
  { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)", flag: "🇮🇳" },
  { code: "ml-IN", label: "Malayalam (മലയാളം)", flag: "🇮🇳" },
  { code: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)", flag: "🇮🇳" },
  { code: "ur-IN", label: "Urdu (اردو)", flag: "🇮🇳" },
  { code: "es-ES", label: "Spanish (España)", flag: "🇪🇸" },
  { code: "es-MX", label: "Spanish (México)", flag: "🇲🇽" },
  { code: "fr-FR", label: "French (Français)", flag: "🇫🇷" },
  { code: "de-DE", label: "German (Deutsch)", flag: "🇩🇪" },
  { code: "it-IT", label: "Italian (Italiano)", flag: "🇮🇹" },
  { code: "pt-BR", label: "Portuguese (Brasil)", flag: "🇧🇷" },
  { code: "pt-PT", label: "Portuguese (Portugal)", flag: "🇵🇹" },
  { code: "ru-RU", label: "Russian (Русский)", flag: "🇷🇺" },
  { code: "ja-JP", label: "Japanese (日本語)", flag: "🇯🇵" },
  { code: "ko-KR", label: "Korean (한국어)", flag: "🇰🇷" },
  { code: "zh-CN", label: "Chinese Simplified (简体中文)", flag: "🇨🇳" },
  { code: "zh-TW", label: "Chinese Traditional (繁體中文)", flag: "🇹🇼" },
  { code: "ar-SA", label: "Arabic (العربية)", flag: "🇸🇦" },
  { code: "tr-TR", label: "Turkish (Türkçe)", flag: "🇹🇷" },
  { code: "nl-NL", label: "Dutch (Nederlands)", flag: "🇳🇱" },
  { code: "pl-PL", label: "Polish (Polski)", flag: "🇵🇱" },
  { code: "sv-SE", label: "Swedish (Svenska)", flag: "🇸🇪" },
  { code: "da-DK", label: "Danish (Dansk)", flag: "🇩🇰" },
  { code: "fi-FI", label: "Finnish (Suomi)", flag: "🇫🇮" },
  { code: "no-NO", label: "Norwegian (Norsk)", flag: "🇳🇴" },
  { code: "el-GR", label: "Greek (Ελληνικά)", flag: "🇬🇷" },
  { code: "cs-CZ", label: "Czech (Čeština)", flag: "🇨🇿" },
  { code: "ro-RO", label: "Romanian (Română)", flag: "🇷🇴" },
  { code: "hu-HU", label: "Hungarian (Magyar)", flag: "🇭🇺" },
  { code: "th-TH", label: "Thai (ไทย)", flag: "🇹🇭" },
  { code: "vi-VN", label: "Vietnamese (Tiếng Việt)", flag: "🇻🇳" },
  { code: "id-ID", label: "Indonesian (Bahasa)", flag: "🇮🇩" },
  { code: "ms-MY", label: "Malay (Melayu)", flag: "🇲🇾" },
  { code: "uk-UA", label: "Ukrainian (Українська)", flag: "🇺🇦" },
  { code: "he-IL", label: "Hebrew (עברית)", flag: "🇮🇱" },
  { code: "sk-SK", label: "Slovak (Slovenčina)", flag: "🇸🇰" },
  { code: "bg-BG", label: "Bulgarian (Български)", flag: "🇧🇬" },
  { code: "hr-HR", label: "Croatian (Hrvatski)", flag: "🇭🇷" },
  { code: "sr-RS", label: "Serbian (Српски)", flag: "🇷🇸" },
  { code: "sl-SI", label: "Slovenian (Slovenščina)", flag: "🇸🇮" },
  { code: "lt-LT", label: "Lithuanian (Lietuvių)", flag: "🇱🇹" },
  { code: "lv-LV", label: "Latvian (Latviešu)", flag: "🇱🇻" },
  { code: "et-EE", label: "Estonian (Eesti)", flag: "🇪🇪" },
  { code: "fil-PH", label: "Filipino (Tagalog)", flag: "🇵🇭" },
  { code: "sw-KE", label: "Swahili (Kiswahili)", flag: "🇰🇪" },
  { code: "af-ZA", label: "Afrikaans", flag: "🇿🇦" },
  { code: "ca-ES", label: "Catalan (Català)", flag: "🇪🇸" },
  { code: "eu-ES", label: "Basque (Euskara)", flag: "🇪🇸" },
  { code: "gl-ES", label: "Galician (Galego)", flag: "🇪🇸" },
  { code: "is-IS", label: "Icelandic (Íslenska)", flag: "🇮🇸" },
  { code: "ne-NP", label: "Nepali (नेपाली)", flag: "🇳🇵" },
  { code: "si-LK", label: "Sinhala (සිංහල)", flag: "🇱🇰" },
  { code: "km-KH", label: "Khmer (ខ្មែរ)", flag: "🇰🇭" },
  { code: "zu-ZA", label: "Zulu (isiZulu)", flag: "🇿🇦" },
  { code: "am-ET", label: "Amharic (አማርኛ)", flag: "🇪🇹" },
  { code: "my-MM", label: "Burmese (ဗမာ)", flag: "🇲🇲" },
  { code: "ka-GE", label: "Georgian (ქართული)", flag: "🇬🇪" },
  { code: "hy-AM", label: "Armenian (Հայերեն)", flag: "🇦🇲" },
  { code: "az-AZ", label: "Azerbaijani (Azərbaycan)", flag: "🇦🇿" },
  { code: "uz-UZ", label: "Uzbek (Oʻzbek)", flag: "🇺🇿" },
  { code: "kk-KZ", label: "Kazakh (Қазақ)", flag: "🇰🇿" },
  { code: "mn-MN", label: "Mongolian (Монгол)", flag: "🇲🇳" },
  { code: "lo-LA", label: "Lao (ລາວ)", flag: "🇱🇦" },
  { code: "fa-IR", label: "Persian (فارسی)", flag: "🇮🇷" },
];

// Group languages by category
export const LANGUAGE_GROUPS = {
  "Popular": ["en-US", "en-GB", "hi-IN", "es-ES", "fr-FR", "de-DE", "it-IT", "pt-BR", "ru-RU", "ja-JP", "ko-KR", "zh-CN", "ar-SA"],
  "Indian": ["hi-IN", "bn-IN", "ta-IN", "te-IN", "mr-IN", "gu-IN", "kn-IN", "ml-IN", "pa-IN", "ur-IN", "en-IN", "ne-NP", "si-LK"],
  "European": ["en-GB", "fr-FR", "de-DE", "it-IT", "pt-PT", "es-ES", "nl-NL", "pl-PL", "sv-SE", "da-DK", "fi-FI", "no-NO", "el-GR", "cs-CZ", "ro-RO", "hu-HU", "sk-SK", "bg-BG", "hr-HR", "sr-RS", "sl-SI", "lt-LT", "lv-LV", "et-EE", "is-IS", "ca-ES", "eu-ES", "gl-ES", "uk-UA"],
  "Asian": ["ja-JP", "ko-KR", "zh-CN", "zh-TW", "th-TH", "vi-VN", "id-ID", "ms-MY", "fil-PH", "km-KH", "my-MM", "lo-LA", "mn-MN"],
  "Middle Eastern": ["ar-SA", "tr-TR", "he-IL", "fa-IR", "az-AZ", "uz-UZ", "kk-KZ", "hy-AM", "ka-GE"],
  "African": ["sw-KE", "af-ZA", "zu-ZA", "am-ET"],
};

// Get language label by code
export function getLanguageLabel(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.label || code;
}

export function getLanguageFlag(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.flag || "🌐";
}

// Get the base language name (without region) for the backend
export function getBaseLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  if (!lang) return "English";
  // Extract just the language name (before the parentheses)
  const match = lang.label.match(/^([^(]+)/);
  return match ? match[1].trim() : lang.label;
}

// Extend the Window interface for webkit speech recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export interface UseVoiceInputOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
  audioLevel: number; // 0-1 for visual feedback
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    language = "en-US",
    continuous = true,
    interimResults = true,
    onTranscript,
    onError,
    onEnd,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check browser support
  useEffect(() => {
    const supported = typeof window !== "undefined" && 
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setIsSupported(supported);
  }, []);

  // Audio level monitoring for visual feedback
  const startAudioMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average level
        const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        const normalized = Math.min(average / 128, 1); // Normalize to 0-1
        setAudioLevel(normalized);
        
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (err) {
      console.log("[VoiceInput] Audio monitoring not available:", err);
    }
  }, []);

  const stopAudioMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const errMsg = "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.";
      setError(errMsg);
      onError?.(errMsg);
      return;
    }

    setError(null);
    setInterimTranscript("");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      startAudioMonitoring();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => {
          const newTranscript = prev ? prev + " " + finalTranscript : finalTranscript;
          onTranscript?.(newTranscript, true);
          return newTranscript;
        });
        setInterimTranscript("");
      }

      if (interim) {
        setInterimTranscript(interim);
        onTranscript?.(interim, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errMsg = "Speech recognition error";
      
      switch (event.error) {
        case "no-speech":
          errMsg = "No speech detected. Please try speaking again.";
          break;
        case "audio-capture":
          errMsg = "No microphone found. Please check your microphone settings.";
          break;
        case "not-allowed":
          errMsg = "Microphone access denied. Please allow microphone access in your browser settings.";
          break;
        case "network":
          errMsg = "Network error. Please check your internet connection.";
          break;
        case "aborted":
          // User aborted, not an error
          return;
        default:
          errMsg = `Speech recognition error: ${event.error}`;
      }

      setError(errMsg);
      setIsListening(false);
      stopAudioMonitoring();
      onError?.(errMsg);
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAudioMonitoring();
      onEnd?.();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      const errMsg = "Failed to start speech recognition. Please try again.";
      setError(errMsg);
      onError?.(errMsg);
    }
  }, [isSupported, language, continuous, interimResults, onTranscript, onError, onEnd, startAudioMonitoring, stopAudioMonitoring]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    stopAudioMonitoring();
  }, [stopAudioMonitoring]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopAudioMonitoring();
    };
  }, [stopAudioMonitoring]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    audioLevel,
  };
}
