"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AudioButton({
  text,
  label = "朗读",
  className,
  size = "md",
}: {
  text: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [speaking, setSpeaking] = useState(false);
  const supported = useRef(true);

  useEffect(() => {
    supported.current = typeof window !== "undefined" && "speechSynthesis" in window;
    return () => {
      if (supported.current) window.speechSynthesis.cancel();
    };
  }, []);

  function speak() {
    if (!supported.current) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hy-AM";
    utterance.rate = 0.82;
    const voices = window.speechSynthesis.getVoices();
    const armenian = voices.find((voice) => voice.lang.toLowerCase().startsWith("hy"));
    if (armenian) utterance.voice = armenian;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={`${label}：${text}`}
      title={label}
      className={cn(
        "group inline-grid shrink-0 place-items-center rounded-full border border-[var(--line-strong)] text-[var(--muted)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]",
        size === "md" ? "h-10 w-10" : "h-8 w-8",
        speaking && "border-[var(--accent)] text-[var(--accent)]",
        className,
      )}
    >
      <Volume2
        size={size === "md" ? 16 : 13}
        strokeWidth={1.8}
        className={cn("transition-transform group-hover:scale-110", speaking && "animate-pulse")}
      />
    </button>
  );
}
