"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, UserRound } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth-types";

function isActive(pathname: string, href: string, match?: string) {
  if (match === "exact" || href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 14);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("site-header pointer-events-none fixed inset-x-0 top-0 z-50", scrolled && "is-scrolled")}>
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
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-9 items-center rounded-full border border-[var(--glass-edge)] bg-[var(--nav-bg)] px-4 text-[11px] font-semibold tracking-[0.04em] text-[var(--ink)] shadow-[inset_0_1px_0_var(--glass-inset)] backdrop-blur-xl transition-all hover:-translate-y-px hover:border-[var(--line-strong)] sm:inline-flex"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="btn btn-primary hidden !min-h-9 !px-4 !text-[11px] sm:inline-flex"
              >
                开始学习
              </Link>
              <Link
                href="/login"
                aria-label="登录 Ayb"
                className="grid h-9 w-9 place-items-center rounded-full border border-[var(--glass-edge)] bg-[var(--nav-bg)] text-[var(--muted)] shadow-[inset_0_1px_0_var(--glass-inset)] backdrop-blur-xl transition-colors hover:text-[var(--ink)] sm:hidden"
              >
                <UserRound size={15} strokeWidth={1.8} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
