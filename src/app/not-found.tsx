import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-ayb flex min-h-[72vh] flex-col items-center justify-center pt-24 text-center">
      <p className="font-display text-[88px] leading-none text-[var(--accent)] opacity-80">Չ</p>
      <p className="eyebrow mt-6">404 · Կորած էջ</p>
      <h1 className="mt-4 text-[28px] font-medium tracking-[-0.03em] text-[var(--ink)]">
        这一页，还没有被写下来。
      </h1>
      <p className="mt-3 text-[12px] leading-relaxed text-[var(--muted)]">
        也许是一时走神。回到首页，我们重新从第一个字母开始。
      </p>
      <Link href="/" className="btn btn-ghost mt-8">
        <ArrowLeft size={14} />
        回到首页
      </Link>
    </div>
  );
}
