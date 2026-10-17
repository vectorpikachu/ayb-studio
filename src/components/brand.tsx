import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Ayb 首页"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[11px] border border-white/10 bg-[var(--surface-2)] shadow-[0_8px_24px_rgba(0,0,0,.18)] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-rotate-6">
        <span
          className="absolute inset-0 opacity-95"
          style={{
            background:
              "radial-gradient(circle at 32% 22%, #f0a37a 0%, #d95b46 36%, #9e3329 100%)",
          }}
        />
        <span className="relative font-display -translate-y-[1px] text-[18px] leading-none text-[#fff7ea]">
          Ա
        </span>
      </span>
      <span className="flex flex-col">
        <span className="text-[15px] font-bold leading-none tracking-[0.22em] text-[var(--ink)]">
          AYB
        </span>
        {!compact && (
          <span className="mt-1 text-[8px] font-semibold leading-none tracking-[0.19em] text-[var(--faint)]">
            ARMENIAN STUDIO
          </span>
        )}
      </span>
    </Link>
  );
}
