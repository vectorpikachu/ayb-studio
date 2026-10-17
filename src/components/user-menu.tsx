"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  LayoutGrid,
  Loader2,
  LogOut,
  PenLine,
  Repeat2,
  ShieldCheck,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth-types";

const menuItems = [
  { href: "/", label: "学习空间", icon: LayoutGrid },
  { href: "/review", label: "今日复习", icon: Repeat2 },
  { href: "/grammar", label: "语法课程", icon: BookOpen },
  { href: "/write", label: "写作室", icon: PenLine },
];

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = Array.from(user.name)[0]?.toUpperCase() ?? "A";
  const items =
    user.role === "admin"
      ? [{ href: "/admin", label: "内容管理", icon: ShieldCheck }, ...menuItems]
      : menuItems;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function logout() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("退出失败，请重试。");
      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "退出失败，请重试。");
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${user.name} 的账户菜单`}
        className="group flex h-9 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--nav-bg)] p-0.5 pr-1.5 text-[var(--muted)] backdrop-blur-xl transition-colors hover:border-[var(--line-strong)]"
      >
        <span
          className="grid h-8 w-8 place-items-center rounded-full text-[12px] font-semibold text-[#fff8ef] shadow-[inset_0_1px_0_rgba(255,255,255,.22)]"
          style={{
            background:
              "radial-gradient(circle at 32% 22%, #e9a37d 0%, #d95b46 42%, #96352b 100%)",
          }}
        >
          {initial}
        </span>
        <span className="hidden max-w-[74px] truncate pr-0.5 text-[10px] font-medium text-[var(--ink)] xl:block">
          {user.name}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="账户菜单"
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[248px] overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--elevated)] p-1.5 shadow-[0_24px_70px_rgba(0,0,0,.28)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-[#fff8ef]"
                style={{
                  background:
                    "radial-gradient(circle at 32% 22%, #e9a37d 0%, #d95b46 42%, #96352b 100%)",
                }}
              >
                {initial}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-[11px] font-semibold text-[var(--ink)]">
                  {user.name}
                  {user.role === "admin" && (
                    <span className="rounded-full border border-[color-mix(in_srgb,var(--sage)_38%,transparent)] px-1.5 py-0.5 text-[7px] font-medium tracking-[0.06em] text-[var(--sage)]">
                      ADMIN
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-[9px] text-[var(--faint)]">{user.email}</p>
              </div>
            </div>
            <div className="my-1 h-[1px] bg-[var(--line)]" />
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[10px] text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                >
                  <Icon size={13} strokeWidth={1.7} />
                  {item.label}
                </Link>
              );
            })}
            <div className="my-1 h-[1px] bg-[var(--line)]" />
            {error && <p className="px-2.5 py-1 text-[9px] text-[var(--accent)]">{error}</p>}
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              disabled={busy}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[10px] text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)] disabled:opacity-60"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} strokeWidth={1.7} />}
              {busy ? "正在退出…" : "退出登录"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
