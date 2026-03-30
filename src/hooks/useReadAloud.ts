import { useState, useEffect, useRef, useCallback } from "react";

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

  // Keywords that hint at gender in voice names
  const femaleHints = ["female", "woman", "samantha", "karen", "victoria", "fiona", "moira", "tessa", "zira", "hazel", "susan", "jenny", "aria", "sara"];
  const maleHints = ["male", "daniel", "james", "tom", "alex", "david", "mark", "guy", "fred", "aaron", "christopher", "roger"];
  const hints = gender === "female" ? femaleHints : maleHints;

  // Prefer remote/cloud voices with matching gender hints
  const remoteMatches = enVoices.filter(v => !v.localService && hints.some(h => v.name.toLowerCase().includes(h)));
  if (remoteMatches.length) return remoteMatches[0];

  // Local voices with matching gender hints
  const localMatches = enVoices.filter(v => hints.some(h => v.name.toLowerCase().includes(h)));
  if (localMatches.length) return localMatches[0];

  // Fallback: any remote English voice
  const remoteEn = enVoices.find(v => !v.localService);
  if (remoteEn) return remoteEn;

  return enVoices[0];
}

export function useReadAloud() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRateState] = useState(1.0);
  const [voiceGender, setVoiceGenderState] = useState<VoiceGender>(getStoredVoice);
  const [isSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const voicesLoadedRef = useRef(false);

  const refreshVoice = useCallback(() => {
    if (!isSupported) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) voicesLoadedRef.current = true;
    voiceRef.current = pickBestVoice(voices, voiceGender);
  }, [isSupported, voiceGender]);

  useEffect(() => {
    if (!isSupported) return;
    refreshVoice();
    const handler = () => refreshVoice();
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      window.speechSynthesis.cancel();
    };
  }, [isSupported, refreshVoice]);

  const setVoiceGender = useCallback((g: VoiceGender) => {
    setVoiceGenderState(g);
    try { localStorage.setItem(VOICE_PREF_KEY, g); } catch {}
  }, []);

  const play = useCallback((text: string) => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    const clean = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    // Re-pick voice in case gender changed
    const voices = window.speechSynthesis.getVoices();
    const best = pickBestVoice(voices, voiceGender);
    if (best) utterance.voice = best;
    utterance.rate = rate;
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [isSupported, rate, voiceGender]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setIsPlaying(true);
    setIsPaused(false);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, [isSupported]);

  const setRate = useCallback((r: number) => {
    setRateState(r);
    if (utteranceRef.current && (isPlaying || isPaused)) {
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

  return { isPlaying, isPaused, isSupported, play, pause, resume, stop, rate, setRate, RATES, voiceGender, setVoiceGender };
}
