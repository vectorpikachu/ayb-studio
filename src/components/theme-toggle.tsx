"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const current = document.documentElement.dataset.theme;
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("ayb-theme", next);
    } catch {
      // ignore unavailable storage
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? (theme === "dark" ? "切换到浅色主题" : "切换到深色主题") : "切换主题"}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-[var(--nav-bg)] text-[var(--muted)] backdrop-blur-xl transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]",
        className,
      )}
    >
      {theme === "dark" ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
    </button>
  );
}
