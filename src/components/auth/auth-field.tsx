"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
  error?: string;
  hint?: string;
};

export function AuthField({ label, icon, trailing, error, hint, id, className, ...props }: AuthFieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[9px] font-semibold tracking-[0.12em] text-[var(--muted)]"
        >
          {label}
        </label>
        {hint && <span className="text-[8px] tracking-[0.04em] text-[var(--faint)]">{hint}</span>}
      </div>
      <div
        className={cn(
          "flex h-[48px] items-center rounded-2xl border bg-[var(--surface)] shadow-[inset_0_1px_0_var(--glass-inset)] backdrop-blur-xl transition-colors focus-within:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus-within:bg-[var(--elevated)]",
          error ? "border-[var(--accent)]" : "border-[var(--glass-edge)]",
        )}
      >
        <span className="ml-3.5 mr-3 shrink-0 text-[var(--faint)]" aria-hidden>
          {icon}
        </span>
        <input
          id={id}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent pr-3 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--faint)]",
            className,
          )}
          {...props}
        />
        {trailing && <span className="mr-1.5 shrink-0">{trailing}</span>}
      </div>
      {error && (
        <p className="mt-1.5 text-[9px] leading-relaxed text-[var(--accent)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
