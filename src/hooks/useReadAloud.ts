import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[youtube:[^\]]*\]\([^)]+\)/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^- /gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type VoiceGender = "female" | "male";
const RATES = [0.8, 1.0, 1.25, 1.5] as const;
const VOICE_PREF_KEY = "pt_voice_gender";

// In-memory cache for audio URLs
const audioCache = new Map<string, string>();

function getStoredVoice(): VoiceGender {
  try {
    const v = localStorage.getItem(VOICE_PREF_KEY);
    if (v === "male" || v === "female") return v;
  } catch {}
  return "female";
}

function pickBestVoice(voices: SpeechSynthesisVoice[], gender: VoiceGender): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const enVoices = voices.filter(v => v.lang.startsWith("en"));
  if (!enVoices.length) return voices[0];

  const femaleHints = ["female", "woman", "samantha", "karen", "victoria", "fiona", "moira", "tessa", "zira", "hazel", "susan", "jenny", "aria", "sara"];
  const maleHints = ["male", "daniel", "james", "tom", "alex", "david", "mark", "guy", "fred", "aaron", "christopher", "roger"];
  const hints = gender === "female" ? femaleHints : maleHints;

  const remoteMatches = enVoices.filter(v => !v.localService && hints.some(h => v.name.toLowerCase().includes(h)));
  if (remoteMatches.length) return remoteMatches[0];

  const localMatches = enVoices.filter(v => hints.some(h => v.name.toLowerCase().includes(h)));
  if (localMatches.length) return localMatches[0];

  const remoteEn = enVoices.find(v => !v.localService);
  if (remoteEn) return remoteEn;

  return enVoices[0];
}

async function fetchCloudAudio(text: string, voice: VoiceGender, speed: number): Promise<string | null> {
  const cacheKey = `${text}|${voice}|${speed}`;
  const cached = audioCache.get(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke("text-to-speech", {
      body: { text, voice, speed },
    });

    if (error || !data?.audioUrl) return null;

    audioCache.set(cacheKey, data.audioUrl);
    return data.audioUrl;
  } catch {
    return null;
  }
}

export function useReadAloud() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRateState] = useState(1.0);
  const [voiceGender, setVoiceGenderState] = useState<VoiceGender>(getStoredVoice);
  const [isSupported] = useState(() => typeof window !== "undefined" && ("speechSynthesis" in window || true));
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const usingCloudRef = useRef(false);
  const voicesLoadedRef = useRef(false);

  const refreshVoice = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) voicesLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    refreshVoice();
    const handler = () => refreshVoice();
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [refreshVoice]);

  const setVoiceGender = useCallback((g: VoiceGender) => {
    setVoiceGenderState(g);
    try { localStorage.setItem(VOICE_PREF_KEY, g); } catch {}
  }, []);

  const playWithSpeechSynthesis = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const best = pickBestVoice(voices, voiceGender);
    if (best) utterance.voice = best;
    utterance.rate = rate;
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
    utteranceRef.current = utterance;
    usingCloudRef.current = false;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [rate, voiceGender]);

  const play = useCallback(async (text: string) => {
    // Stop any existing playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const clean = stripMarkdown(text);
    setIsLoading(true);

    // Try cloud TTS first
    const audioUrl = await fetchCloudAudio(clean, voiceGender, rate);

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.playbackRate = rate;
        audio.onended = () => { setIsPlaying(false); setIsPaused(false); usingCloudRef.current = false; };
        audio.onerror = () => {
          // Fallback to browser
          toast.info("Using device voice", { duration: 2000 });
          playWithSpeechSynthesis(clean);
        };
        audioRef.current = audio;
        usingCloudRef.current = true;
        await audio.play();
        setIsPlaying(true);
        setIsPaused(false);
        setIsLoading(false);
        return;
      } catch {
        // Fallback
      }
    }

    setIsLoading(false);

    // Fallback to browser speechSynthesis
    if (audioUrl === null) {
      toast.info("Using device voice", { duration: 2000 });
    }
    playWithSpeechSynthesis(clean);
  }, [rate, voiceGender, playWithSpeechSynthesis]);

  const pause = useCallback(() => {
    if (usingCloudRef.current && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (usingCloudRef.current && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    usingCloudRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const setRate = useCallback((r: number) => {
    setRateState(r);
    if (usingCloudRef.current && audioRef.current) {
      audioRef.current.playbackRate = r;
    } else if (utteranceRef.current && (isPlaying || isPaused)) {
      // For speechSynthesis, restart with new rate
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const text = utteranceRef.current.text;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const best = pickBestVoice(voices, voiceGender);
      if (best) utterance.voice = best;
      utterance.rate = r;
      utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
      utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [isPlaying, isPaused, voiceGender]);

  return { isPlaying, isPaused, isLoading, isSupported, play, pause, resume, stop, rate, setRate, RATES, voiceGender, setVoiceGender };
}
