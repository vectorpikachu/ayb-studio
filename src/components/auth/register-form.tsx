"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

function nextPath() {
  if (typeof window === "undefined") return "/";
  const candidate = new URLSearchParams(window.location.search).get("next");
  if (candidate && candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  return "/";
}

export function RegisterForm({ firstRun = false }: { firstRun?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "名字至少需要 2 个字符。";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "请输入有效的邮箱地址。";
    if (password.length < 8) next.password = "密码至少需要 8 个字符。";
    if (confirm !== password) next.confirm = "两次输入的密码不一致。";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!validate()) return;

    setPending(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        user?: { role?: string };
      };
      if (!response.ok) throw new Error(data.error ?? "注册失败，请稍后再试。");
      const next = nextPath();
      const destination =
        data.user?.role === "admin" && next === "/" ? "/admin?welcome=1" : next;
      window.location.assign(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "注册失败，请稍后再试。");
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="eyebrow">Create account · Գրանցում</p>
        <span className="text-[9px] text-[var(--faint)]">02 / 02</span>
      </div>
      <h1 className="mt-5 text-[32px] font-medium leading-[1.15] tracking-[-0.04em] text-[var(--ink)] md:text-[38px]">
        从这里开始。
      </h1>
      <p className="mt-3 text-[11px] leading-[1.8] text-[var(--muted)]">
        一个账户，保存所有学习痕迹。
        <span className="font-arm ml-1.5 text-[12px] text-[var(--faint)]">Սկսենք։</span>
      </p>

      {firstRun && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--sage)_32%,transparent)] bg-[color-mix(in_srgb,var(--sage)_7%,transparent)] p-3 text-[10px] leading-relaxed text-[var(--muted)]">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[var(--sage)]" />
          <p>
            <strong className="font-medium text-[var(--ink)]">这是本机的第一个账户。</strong>{" "}
            注册后你会成为管理员，可以在「内容管理」里导入词典和语法 JSON。
          </p>
        </div>
      )}

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
          id="register-name"
          label="名字 · NAME"
          icon={<UserRound size={14} />}
          type="text"
          autoComplete="name"
          placeholder="我们该怎么称呼你？"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
          }}
          error={errors.name}
          maxLength={32}
          required
        />
        <AuthField
          id="register-email"
          label="邮箱 · EMAIL"
          icon={<Mail size={14} />}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
          }}
          error={errors.email}
          required
        />
        <AuthField
          id="register-password"
          label="密码 · PASSWORD"
          hint="至少 8 个字符"
          icon={<LockKeyhole size={14} />}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="为一个安静的角落设一把锁"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
          }}
          error={errors.password}
          minLength={8}
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
        <AuthField
          id="register-confirm"
          label="确认密码 · CONFIRM"
          icon={<ShieldCheck size={14} />}
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          placeholder="再输入一次密码"
          value={confirm}
          onChange={(event) => {
            setConfirm(event.target.value);
            if (errors.confirm) setErrors((current) => ({ ...current, confirm: undefined }));
          }}
          error={errors.confirm}
          minLength={8}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirm((visible) => !visible)}
              aria-label={showConfirm ? "隐藏确认密码" : "显示确认密码"}
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
            >
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary !mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              正在创建账户…
            </>
          ) : (
            <>
              创建学习空间
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-[8px] leading-[1.8] text-[var(--faint)]">
        继续即表示你了解：本应用用于语言学习，学习进度与文章保存在当前部署实例的本地数据库中。
      </p>

      <p className="mt-7 text-center text-[10px] text-[var(--muted)]">
        已经有账户？
        <Link href="/login" className="ml-1.5 font-semibold text-[var(--ink)] underline decoration-[var(--line-strong)] underline-offset-4 transition-colors hover:text-[var(--accent)]">
          登录
        </Link>
      </p>
      <p className="mt-6 flex items-center justify-center gap-1.5 text-[8px] tracking-[0.05em] text-[var(--faint)]">
        <LockKeyhole size={9} />
        密码经过 scrypt 哈希，不会以明文保存
      </p>
    </div>
  );
}
