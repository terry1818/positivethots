import { useState, useEffect, useRef, useCallback } from "react";

function stripMarkdown(text: string): string {
  return text
    // Remove headings
    .replace(/^#{1,6}\s+/gm, "")
    // Convert links [text](url) to just text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove youtube embeds [youtube:Title](url)
    .replace(/\[youtube:[^\]]*\]\([^)]+\)/g, "")
    // Remove bold/italic markers
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    // Remove list markers
    .replace(/^- /gm, "")
    // Collapse multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const RATES = [0.8, 1.0, 1.25, 1.5] as const;

export function useReadAloud() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRateState] = useState(1.0);
  const [isSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Pick best voice
  const pickVoice = useCallback(() => {
    if (!isSupported) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer remote English voices (cloud/neural)
    const remoteEn = voices.find(v => v.lang.startsWith("en") && !v.localService);
    if (remoteEn) { voiceRef.current = remoteEn; return; }
    // Fallback: any English voice
    const anyEn = voices.find(v => v.lang.startsWith("en"));
    if (anyEn) { voiceRef.current = anyEn; return; }
    // Default
    voiceRef.current = voices[0] || null;
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) return;
    pickVoice();
    const handler = () => pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      window.speechSynthesis.cancel();
    };
  }, [isSupported, pickVoice]);

  const play = useCallback((text: string) => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    const clean = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.rate = rate;
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [isSupported, rate]);

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
    // If currently speaking, restart with new rate
    if (utteranceRef.current && (isPlaying || isPaused)) {
      const text = utteranceRef.current.text;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.rate = r;
      utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
      utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [isPlaying, isPaused]);

  return { isPlaying, isPaused, isSupported, play, pause, resume, stop, rate, setRate, RATES };
}
