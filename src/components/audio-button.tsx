"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { audioKey, loadAudioIndex, peekAudioIndex } from "@/lib/audio-key";
import { cn } from "@/lib/utils";

const CHUNK_LIMIT = 180;

/**
 * Chrome stops an utterance after roughly 15 seconds, and engines with no
 * Armenian voice may accept speak() and stay silent. Split long readings at
 * sentence boundaries so they can be queued, and tell the reader when nothing
 * starts.
 */
export function splitForSpeech(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= CHUNK_LIMIT) return clean ? [clean] : [];

  const sentences = clean.match(/[^։.!?…]+[։.!?…]*/g) ?? [clean];
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    const value = current.trim();
    if (value) chunks.push(value);
    current = "";
  };

  for (const sentence of sentences) {
    if (current && (current + sentence).length > CHUNK_LIMIT) flush();
    current += sentence;
    while (current.length > CHUNK_LIMIT) {
      const space = current.lastIndexOf(" ", CHUNK_LIMIT);
      const cut = space > CHUNK_LIMIT * 0.4 ? space : CHUNK_LIMIT;
      chunks.push(current.slice(0, cut).trim());
      current = current.slice(cut);
    }
  }
  flush();
  return chunks;
}

function announce(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ayb:speech-status", { detail: message }));
  }
}

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
  const session = useRef(0);
  const startTimer = useRef<number | null>(null);
  const clip = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Warm the manifest so the first click can start playback inside the user
    // gesture (Safari is strict about play() after an await).
    void loadAudioIndex();
    return () => {
      session.current += 1;
      if (startTimer.current) window.clearTimeout(startTimer.current);
      if (clip.current) {
        clip.current.pause();
        clip.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stop() {
    session.current += 1;
    if (startTimer.current) {
      window.clearTimeout(startTimer.current);
      startTimer.current = null;
    }
    if (clip.current) {
      clip.current.pause();
      clip.current.currentTime = 0;
      clip.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }

  async function playClip(token: number): Promise<boolean> {
    const key = audioKey(text);
    const cached = peekAudioIndex();
    if (cached && !cached.has(key)) return false;
    if (!cached) {
      const index = await loadAudioIndex();
      if (session.current !== token || !index.has(key)) return false;
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const audio = new Audio("/audio/" + key + ".mp3");
      audio.preload = "auto";
      clip.current = audio;
      audio.onplaying = () => {
        if (session.current === token) setSpeaking(true);
        finish(true);
      };
      audio.onended = () => {
        if (clip.current === audio) clip.current = null;
        if (session.current === token) setSpeaking(false);
      };
      audio.onerror = () => finish(false);
      audio.play().then(() => finish(true)).catch(() => finish(false));
    });
  }

  function speakTts(token: number, voice: SpeechSynthesisVoice | undefined) {
    const synth = window.speechSynthesis;
    synth.cancel();
    // Chrome can leave the queue paused after cancel(); resume is a no-op
    // when it is already running.
    synth.resume();
    const chunks = splitForSpeech(text);
    if (!chunks.length) return;

    let started = false;
    setSpeaking(true);

    // Engines without an Armenian voice accept speak() and never fire onstart.
    // Explain the silence instead of leaving a pulsing icon.
    startTimer.current = window.setTimeout(() => {
      if (session.current !== token || started) return;
      synth.cancel();
      setSpeaking(false);
      announce(
        voice
          ? "语音没能开始，请再点一次。"
          : "当前浏览器没有亚美尼亚语语音，这段文字也还没有预生成音频。",
      );
    }, 1800);

    const speakChunk = (index: number) => {
      if (session.current !== token) return;
      if (index >= chunks.length) {
        setSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = "hy-AM";
      utterance.rate = 0.85;
      utterance.pitch = 1;
      if (voice) utterance.voice = voice;
      utterance.onstart = () => {
        started = true;
        if (startTimer.current) window.clearTimeout(startTimer.current);
      };
      utterance.onend = () => speakChunk(index + 1);
      utterance.onerror = (event) => {
        if (session.current !== token) return;
        setSpeaking(false);
        if (started && event.error !== "interrupted" && event.error !== "canceled") {
          announce("朗读中断了，请再试一次。");
        }
      };
      synth.speak(utterance);
    };

    speakChunk(0);
  }

  async function speak() {
    stop();
    const token = session.current;
    const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
    const armenian = synth
      ?.getVoices()
      .find((voice) => voice.lang.toLowerCase().replace("_", "-").startsWith("hy"));

    // A native voice beats the bundled reference recording; without one, the
    // pre-rendered MP3 is the only reliable sound.
    if (synth && armenian) {
      speakTts(token, armenian);
      return;
    }

    if (await playClip(token)) return;
    if (session.current !== token) return;
    if (synth) speakTts(token, undefined);
    else announce("这个浏览器不支持语音合成，这段文字也还没有预生成音频。");
  }

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={`${label}：${text}`}
      aria-pressed={speaking}
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
