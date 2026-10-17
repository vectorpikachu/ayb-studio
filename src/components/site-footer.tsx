import Link from "next/link";
import { Brand } from "@/components/brand";
import type { SessionUser } from "@/lib/auth-types";

const learningLinks = [
  { href: "/dictionary", label: "词典" },
  { href: "/review", label: "复习" },
  { href: "/grammar", label: "语法" },
  { href: "/reading", label: "课文" },
  { href: "/culture", label: "文化" },
  { href: "/write", label: "写作" },
];

export function SiteFooter({ user }: { user: SessionUser | null }) {
  return (
    <footer className="mt-20 border-t border-[var(--line)] pb-28 pt-10 md:mt-28 md:pb-10">
      <div className="container-ayb">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div>
            <Brand />
            <p className="mt-4 max-w-[280px] text-[11px] leading-[1.8] text-[var(--faint)]">
              一间安静的亚美尼亚语学习室。
              <br />A small studio for a beautiful language.
            </p>
          </div>
          <div className="flex gap-16 sm:gap-20">
            <div>
              <p className="eyebrow mb-3">学习 LEARN</p>
              <div className="grid gap-2 text-[11px] text-[var(--muted)]">
                {learningLinks.map((link) => (
                  <Link
                    key={link.href}
                    className="transition-colors hover:text-[var(--ink)]"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow mb-3">账户 ACCOUNT</p>
              {user ? (
                <div className="text-[11px] leading-[1.8] text-[var(--muted)]">
                  <p className="max-w-[150px] truncate font-medium text-[var(--ink)]">{user.name}</p>
                  <p className="max-w-[150px] truncate text-[9px] text-[var(--faint)]">{user.email}</p>
                  <Link href="/write" className="mt-2 inline-block text-[10px] transition-colors hover:text-[var(--ink)]">
                    我的写作 →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-2 text-[11px] text-[var(--muted)]">
                  <Link className="transition-colors hover:text-[var(--ink)]" href="/login">
                    登录
                  </Link>
                  <Link className="transition-colors hover:text-[var(--ink)]" href="/register">
                    创建账户
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--line)] pt-5 text-[9px] tracking-[0.08em] text-[var(--faint)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AYB STUDIO. MADE WITH CARE.</p>
          <p className="font-arm text-[11px] tracking-[0.03em] text-[var(--muted)]">
            Լեզուն սկսվում է տառից։
          </p>
        </div>
      </div>
    </footer>
  );
}
