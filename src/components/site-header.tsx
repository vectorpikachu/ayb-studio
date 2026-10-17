"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/constants";

function isActive(pathname: string, href: string, match?: string) {
  if (match === "exact" || href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="container-ayb flex h-[76px] items-center justify-between gap-4">
        <div className="pointer-events-auto">
          <Brand />
        </div>

        <nav
          aria-label="主导航"
          className="pill-nav pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 md:flex"
        >
          <Link
            href="/"
            aria-label="首页"
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full transition-colors",
              pathname === "/" ? "text-[var(--ink)]" : "text-[var(--faint)] hover:text-[var(--ink)]",
            )}
          >
            <Compass size={15} strokeWidth={1.8} />
          </Link>
          {navItems.slice(1).map((item) => {
            const active = isActive(pathname, item.href, item.match);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[12px] font-medium tracking-[0.04em] transition-colors",
                  active
                    ? "bg-[var(--surface-2)] text-[var(--ink)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pointer-events-auto flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden h-9 items-center rounded-full border border-[var(--line)] bg-[var(--nav-bg)] px-4 text-[11px] font-semibold tracking-[0.04em] text-[var(--ink)] backdrop-blur-xl transition-colors hover:border-[var(--line-strong)] sm:inline-flex"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="hidden h-9 items-center rounded-full bg-[var(--ink)] px-4 text-[11px] font-semibold tracking-[0.04em] text-[var(--paper)] transition-colors hover:bg-[var(--accent)] hover:text-[#fff8ef] sm:inline-flex"
          >
            开始学习
          </Link>
        </div>
      </div>
    </header>
  );
}
