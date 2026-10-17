"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Blocks, BookOpen, Home, PenLine, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { mobileNav } from "@/lib/constants";

const icons = {
  home: Home,
  book: BookOpen,
  repeat: Repeat2,
  blocks: Blocks,
  reading: BookOpenText,
  pen: PenLine,
};

export function MobileDock() {
  const pathname = usePathname();

  // Keep task-focused screens immersive: the floating card and writing
  // controls should never sit underneath the navigation dock.
  if (pathname.startsWith("/review") || pathname.startsWith("/write")) return null;

  return (
    <nav
      aria-label="移动端导航"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-[430px] items-center justify-around rounded-[24px] border border-[var(--glass-edge)] bg-[var(--nav-bg)] px-1.5 py-2 shadow-[0_24px_60px_-20px_var(--glass-shadow),inset_0_1px_0_var(--glass-inset)] backdrop-blur-2xl md:hidden"
    >
      {mobileNav.map((item) => {
        const Icon = icons[item.icon];
        const active =
          item.match === "exact" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex min-w-[54px] flex-col items-center gap-1 rounded-2xl py-1.5 text-[9px] font-medium tracking-wide transition-colors",
              active ? "text-[var(--ink)]" : "text-[var(--faint)]",
            )}
          >
            <Icon size={18} strokeWidth={active ? 2 : 1.6} />
            <span>{item.label}</span>
            {active && (
              <span className="absolute -top-0.5 h-[3px] w-[3px] rounded-full bg-[var(--accent)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
