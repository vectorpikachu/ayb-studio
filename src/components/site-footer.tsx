import Link from "next/link";
import { Brand } from "@/components/brand";

export function SiteFooter() {
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
          <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-[11px] text-[var(--muted)] sm:grid-cols-3">
            <Link className="transition-colors hover:text-[var(--ink)]" href="/dictionary">
              词典
            </Link>
            <Link className="transition-colors hover:text-[var(--ink)]" href="/grammar">
              语法
            </Link>
            <Link className="transition-colors hover:text-[var(--ink)]" href="/write">
              写作
            </Link>
            <Link className="transition-colors hover:text-[var(--ink)]" href="/review">
              复习
            </Link>
            <Link className="transition-colors hover:text-[var(--ink)]" href="/login">
              登录
            </Link>
            <Link className="transition-colors hover:text-[var(--ink)]" href="/register">
              注册
            </Link>
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
