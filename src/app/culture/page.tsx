import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Compass, Landmark, Sparkles } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { HandText } from "@/components/hand-text";
import {
  cultureCategoryLabels,
  cultureCategories,
  type CultureCategory,
} from "@/data/culture";
import { getContentCultureEntries } from "@/lib/server/content";

export const metadata: Metadata = {
  title: "文化",
  description:
    "亚美尼亚的历史、文化、人物与地理：从字母的诞生到亚拉拉特山，用中文读一个国家的几个入口。",
};

type CulturePageProps = {
  searchParams: Promise<{ category?: string }>;
};

function isCategory(value: string | undefined): value is CultureCategory {
  return value === "history" || value === "culture" || value === "people" || value === "geography";
}

export default async function CulturePage({ searchParams }: CulturePageProps) {
  const entries = await getContentCultureEntries();
  const { category } = await searchParams;
  const activeCategory = isCategory(category) ? category : null;
  const visible = activeCategory
    ? entries.filter((entry) => entry.category === activeCategory)
    : entries;
  const counts = cultureCategories.map((item) => ({
    ...item,
    count: entries.filter((entry) => entry.category === item.id).length,
  }));

  return (
    <div className="pb-28 md:pb-20">
      <section className="container-ayb relative overflow-hidden pt-[104px] md:pt-[140px]">
        <span
          className="pointer-events-none absolute -right-8 top-14 hidden select-none font-display text-[280px] leading-none text-[var(--ink)] opacity-[0.025] lg:block"
          aria-hidden
        >
          Լ
        </span>
        <div className="pointer-events-none absolute right-[12%] top-[150px] hidden h-36 w-36 rounded-full border border-[var(--line)] lg:block" aria-hidden />

        <div className="grid items-end gap-10 lg:grid-cols-[1fr_300px]">
          <Reveal>
            <p className="eyebrow">Culture atlas · Մշակույթ</p>
            <h1 className="mt-4 max-w-[720px] text-[42px] font-medium leading-[1.07] tracking-[-0.05em] text-[var(--ink)] md:text-[62px]">
              一个国家，
              <br />
              不止一个入口。
            </h1>
            <p className="mt-4 max-w-[560px] text-[12px] leading-[1.95] text-[var(--muted)]">
              历史、文化、人物与地理。不是百科式的年表，而是几条可以走进去的路线：一块石头、一种声音、一个人、一座山。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/culture?category=history" className="btn btn-primary">
                从历史开始
                <ArrowRight size={14} />
              </Link>
              <Link href="/reading" className="btn btn-ghost">
                去读课文
                <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] tracking-[0.05em] text-[var(--faint)]">
              <span className="flex items-center gap-1.5">
                <Landmark size={11} />
                {entries.length} 个条目
              </span>
              <span className="h-3 w-[1px] bg-[var(--line)]" />
              <span className="flex items-center gap-1.5">
                <Compass size={11} />
                4 个栏目
              </span>
              <span className="h-3 w-[1px] bg-[var(--line)]" />
              <span>中文编辑 · 可继续扩展</span>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="hidden lg:block">
            <div className="surface-card relative overflow-hidden rounded-[26px] p-5 md:p-6">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-25 blur-3xl"
                style={{ background: "var(--apricot)" }}
              />
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-[var(--apricot)]" />
                <span className="eyebrow">How to use</span>
              </div>
              <p className="mt-4 text-[11px] leading-[1.9] text-[var(--muted)]">
                先挑一个栏目，再读一个条目。把不认识的专名当作路标，不必一次记住所有年代。
              </p>
              <div className="mt-5 space-y-2 border-t border-[var(--line)] pt-4">
                {counts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-[9px]">
                    <span className="text-[var(--muted)]">
                      {item.label} · {item.hy}
                    </span>
                    <span className="font-mono text-[var(--faint)]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-ayb mt-8 md:mt-20">
        <Reveal>
          <div className="flex flex-col justify-between gap-5 border-b border-[var(--line)] pb-5">
            <div>
              <p className="eyebrow">The atlas · Քարտեզ</p>
              <h2 className="mt-3 text-[28px] font-medium tracking-[-0.035em] text-[var(--ink)] md:text-[36px]">
                {activeCategory ? cultureCategoryLabels[activeCategory].label : "全部条目"}
              </h2>
              <p className="mt-2 max-w-[560px] text-[10px] leading-[1.8] text-[var(--faint)]">
                {activeCategory
                  ? cultureCategoryLabels[activeCategory].description
                  : "从古代到现代，从石头到湖。每个条目都可以单独阅读。"}
              </p>
            </div>
            <div className="hide-scrollbar flex gap-1.5 overflow-x-auto">
              <Link
                href="/culture"
                className={
                  activeCategory
                    ? "shrink-0 rounded-full border border-[var(--line)] px-3 py-1.5 text-[9px] text-[var(--muted)]"
                    : "shrink-0 rounded-full bg-[var(--ink)] px-3 py-1.5 text-[9px] text-[var(--paper)]"
                }
              >
                全部 {entries.length}
              </Link>
              {counts.map((item) => (
                <Link
                  key={item.id}
                  href={`/culture?category=${item.id}`}
                  className={
                    activeCategory === item.id
                      ? "shrink-0 rounded-full bg-[var(--ink)] px-3 py-1.5 text-[9px] text-[var(--paper)]"
                      : "shrink-0 rounded-full border border-[var(--line)] px-3 py-1.5 text-[9px] text-[var(--muted)]"
                  }
                >
                  {item.label} {item.count}
                </Link>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-3 md:mt-7 md:grid-cols-2">
          {visible.map((entry, index) => (
            <Reveal key={entry.id} delay={Math.min(index * 0.035, 0.2)}>
              <Link
                href={`/culture/${entry.id}`}
                className="surface-card group relative block h-full overflow-hidden rounded-[26px] p-6 transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[0_32px_64px_-32px_var(--glass-shadow)] md:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-[8px] font-semibold tracking-[0.08em] text-[var(--accent)]">
                    {cultureCategoryLabels[entry.category].label}
                  </span>
                  <span className="font-mono text-[9px] text-[var(--faint)]">
                    {String(entry.order).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 text-[21px] font-medium tracking-[-0.025em] text-[var(--ink)] md:text-[24px]">
                  {entry.title}
                </h3>
                <p className="mt-1.5 text-[25px] leading-[1.35] text-[var(--accent)]">
                  <HandText text={entry.titleHy} />
                </p>
                <p className="mt-3 text-[11px] leading-[1.9] text-[var(--muted)]">{entry.summary}</p>
                <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[8px] tracking-[0.06em] text-[var(--faint)]">
                  <span>{entry.subtitle}</span>
                  <span className="inline-flex items-center gap-1 text-[var(--muted)] transition-colors group-hover:text-[var(--accent)]">
                    阅读
                    <ArrowUpRight size={11} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="glass-soft mt-6 rounded-[24px] px-6 py-16 text-center text-[11px] text-[var(--faint)]">
            这个栏目还没有条目。
          </div>
        )}
      </section>
    </div>
  );
}
