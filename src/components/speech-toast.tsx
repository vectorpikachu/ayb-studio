"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Browsers without an Armenian speech voice fail silently. AudioButton sends a
 * message here so the reader gets an explanation instead of a dead icon.
 */
export function SpeechToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    function onStatus(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (!detail) return;
      setMessage(detail);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMessage(null), 4800);
    }
    window.addEventListener("ayb:speech-status", onStatus);
    return () => {
      window.removeEventListener("ayb:speech-status", onStatus);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-24 z-[90] mx-auto w-fit max-w-[420px] rounded-2xl border border-[var(--glass-edge)] bg-[var(--elevated)] px-4 py-3 text-center text-[11px] leading-relaxed text-[var(--ink)] shadow-[0_20px_50px_-20px_var(--glass-shadow)] backdrop-blur-xl md:bottom-8"
    >
      {message}
    </div>
  );
}
