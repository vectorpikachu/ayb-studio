"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";

type Props = {
  demoEnabled: boolean;
  demoEmail?: string;
  demoPassword?: string;
};

function nextPath() {
  if (typeof window === "undefined") return "/";
  const candidate = new URLSearchParams(window.location.search).get("next");
  if (candidate && candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  return "/";
}

export function LoginForm({ demoEnabled, demoEmail, demoPassword }: Props) {
  const [email, setEmail] = useState(demoEnabled ? (demoEmail ?? "") : "");
  const [password, setPassword] = useState(demoEnabled ? (demoPassword ?? "") : "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [demoPending, setDemoPending] = useState(false);

  async function signIn(payload: { email: string; password: string }) {
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new Error(data.error ?? "登录失败，请稍后再试。");
    window.location.assign(nextPath());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError("请输入邮箱地址。");
      return;
    }
    if (!password) {
      setError("请输入密码。");
      return;
    }

    setPending(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "登录失败，请稍后再试。");
      setPending(false);
    }
  }

  async function handleDemo() {
    setError(null);
    setDemoPending(true);
    try {
      const response = await fetch("/api/auth/demo", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "演示账号暂不可用。");
      window.location.assign(nextPath());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "演示账号暂不可用。");
      setDemoPending(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="eyebrow">Sign in · Մուտք</p>
        <span className="text-[9px] text-[var(--faint)]">01 / 02</span>
      </div>
      <h1 className="mt-5 text-[32px] font-medium leading-[1.15] tracking-[-0.04em] text-[var(--ink)] md:text-[38px]">
        欢迎回来。
      </h1>
      <p className="mt-3 text-[11px] leading-[1.8] text-[var(--muted)]">
        继续你的亚美尼亚语旅程。
        <span className="font-arm ml-1.5 text-[12px] text-[var(--faint)]">Շարունակենք։</span>
      </p>

      {error && (
        <div
          className="mt-6 flex items-start gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] p-3 text-[10px] leading-relaxed text-[var(--ink)]"
          role="alert"
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
        <AuthField
          id="login-email"
          label="邮箱 · EMAIL"
          icon={<Mail size={14} />}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <AuthField
          id="login-password"
          label="密码 · PASSWORD"
          icon={<LockKeyhole size={14} />}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="输入你的密码"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={pending || demoPending}
          className="btn btn-primary !mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              正在登录…
            </>
          ) : (
            <>
              登录
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {demoEnabled && (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-[1px] flex-1 bg-[var(--line)]" />
            <span className="text-[8px] tracking-[0.16em] text-[var(--faint)]">OR EXPLORE</span>
            <span className="h-[1px] flex-1 bg-[var(--line)]" />
          </div>

          <div className="rounded-[14px] border border-dashed border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--surface-2)_35%,transparent)] p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--apricot)_14%,transparent)] text-[var(--apricot)]">
                <Sparkles size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-[var(--ink)]">先看看 Lilit 的学习空间</p>
                <p className="mt-1 text-[9px] leading-relaxed text-[var(--faint)]">
                  已学习 20 个词、完成 2 节语法，还有一篇文章。
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemo}
              disabled={pending || demoPending}
              className="mt-3.5 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[var(--line-strong)] text-[10px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-60"
            >
              {demoPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  正在打开…
                </>
              ) : (
                <>
                  一键进入演示空间
                  <ArrowRight size={12} />
                </>
              )}
            </button>
            {demoEmail && demoPassword && (
              <p className="mt-2.5 text-center font-mono text-[8px] tracking-[0.02em] text-[var(--faint)]">
                {demoEmail} · {demoPassword}
              </p>
            )}
          </div>
        </>
      )}

      <p className="mt-7 text-center text-[10px] text-[var(--muted)]">
        还没有账户？
        <Link href="/register" className="ml-1.5 font-semibold text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-4 transition-colors hover:text-[var(--accent)]">
          创建一个
        </Link>
      </p>
    </div>
  );
}
