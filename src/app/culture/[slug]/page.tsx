import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Compass } from "lucide-react";
import { cultureCategoryLabels } from "@/data/culture";
import { getContentCultureEntries } from "@/lib/server/content";

type CultureDetailProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CultureDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const entries = await getContentCultureEntries();
  const entry = entries.find((candidate) => candidate.id === slug);
  if (!entry) return { title: "文化" };
  return {
    title: `${entry.title} · 文化`,
    description: entry.summary,
  };
}

export default async function CultureDetailPage({ params }: CultureDetailProps) {
  const { slug } = await params;
  const entries = await getContentCultureEntries();
  const entry = entries.find((candidate) => candidate.id === slug);
  if (!entry) notFound();

  const index = entries.findIndex((candidate) => candidate.id === entry.id);
  const previous = index > 0 ? entries[index - 1] : null;
  const next = index >= 0 && index < entries.length - 1 ? entries[index + 1] : null;
  const category = cultureCategoryLabels[entry.category];

  return (
    <div className="pb-20">
      <div className="container-ayb pt-[108px] md:pt-[132px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/culture"
            className="inline-flex items-center gap-2 text-[9px] font-medium tracking-[0.04em] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft size={12} />
            返回文化地图
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-[var(--faint)]">
            <span className="font-mono">
              ENTRY {String(index + 1).padStart(2, "0")} / {String(entries.length).padStart(2, "0")}
            </span>
            <span className="h-3 w-[1px] bg-[var(--line)]" />
            <span>
              {category.label} · {category.hy}
            </span>
          </div>
        </div>

        <header className="relative mt-8 overflow-hidden border-b border-[var(--line)] pb-9 md:mt-10 md:pb-12">
          <div className="pointer-events-none absolute right-0 top-0 hidden h-40 w-40 rounded-full border border-[var(--line)] md:block" aria-hidden />
          <div className="pointer-events-none absolute right-16 top-12 hidden h-16 w-16 rounded-full border border-dashed border-[var(--line)] md:block" aria-hidden />
          <div className="relative z-10 grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow">Culture atlas · {category.hy}</p>
              <h1 className="mt-4 text-[38px] font-medium leading-[1.1] tracking-[-0.045em] text-[var(--ink)] md:text-[52px]">
                {entry.title}
              </h1>
              <p className="mt-3 font-hand text-[34px] leading-[1.3] text-[var(--accent)] md:text-[42px]" lang="hy">
                {entry.titleHy}
              </p>
              <p className="mt-3 text-[10px] tracking-[0.04em] text-[var(--muted)]">{entry.subtitle}</p>
              <p className="mt-4 max-w-[660px] text-[12px] leading-[1.95] text-[var(--muted)]">
                {entry.summary}
              </p>
            </div>

            <div className="flex items-center gap-3 text-[9px] text-[var(--faint)] md:flex-col md:items-end">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1.5">
                <Compass size={11} />
                {entry.sections.length} 个章节
              </span>
              <span className="hidden text-[8px] tracking-[0.12em] md:block">AYB · CULTURE</span>
            </div>
          </div>
        </header>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="min-w-0 max-w-[780px]">
            <div className="space-y-10">
              {entry.sections.map((section, sectionIndex) => (
                <section key={section.id} id={section.id} className="scroll-mt-28">
                  <div className="flex items-baseline gap-4 border-b border-[var(--line)] pb-3">
                    <span className="font-mono text-[9px] text-[var(--accent)]">
                      {String(sectionIndex + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-[23px] font-medium tracking-[-0.025em] text-[var(--ink)] md:text-[27px]">
                      {section.heading}
                    </h2>
                  </div>
                  <div className="mt-5 space-y-4">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-[13px] leading-[2.05] text-[var(--muted)]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {entry.related && entry.related.length > 0 && (
              <section className="mt-10 rounded-[24px] border border-[var(--line)] p-5 md:p-6">
                <p className="eyebrow">Continue · 继续</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {entry.related.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="glass-soft group flex items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-[11px] text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)]"
                    >
                      {link.label}
                      <ArrowUpRight size={12} className="shrink-0 text-[var(--faint)] transition-colors group-hover:text-[var(--accent)]" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <nav className="mt-10 grid gap-3 border-t border-[var(--line)] pt-6 sm:grid-cols-2">
              {previous ? (
                <Link
                  href={`/culture/${previous.id}`}
                  className="glass-soft group rounded-[18px] p-4 transition-colors hover:bg-[var(--surface-2)]"
                >
                  <span className="flex items-center gap-2 text-[8px] tracking-[0.12em] text-[var(--faint)]">
                    <ArrowLeft size={10} />
                    上一条
                  </span>
                  <p className="mt-2 text-[14px] font-medium text-[var(--ink)]">{previous.title}</p>
                </Link>
              ) : (
                <div className="rounded-[18px] border border-dashed border-[var(--line)] p-4 text-[9px] text-[var(--faint)]">
                  这是第一条。
                </div>
              )}
              {next ? (
                <Link
                  href={`/culture/${next.id}`}
                  className="glass-soft group rounded-[18px] p-4 text-right transition-colors hover:bg-[var(--surface-2)]"
                >
                  <span className="flex items-center justify-end gap-2 text-[8px] tracking-[0.12em] text-[var(--faint)]">
                    下一条
                    <ArrowRight size={10} />
                  </span>
                  <p className="mt-2 text-[14px] font-medium text-[var(--ink)]">{next.title}</p>
                </Link>
              ) : (
                <div className="rounded-[18px] border border-dashed border-[var(--line)] p-4 text-right text-[9px] text-[var(--faint)]">
                  更多条目还在路上。
                </div>
              )}
            </nav>
          </article>

          <aside className="hidden lg:sticky lg:top-[96px] lg:block">
            {entry.facts && entry.facts.length > 0 && (
              <div className="surface-card rounded-[24px] p-5">
                <p className="eyebrow">At a glance</p>
                <div className="mt-4 space-y-3">
                  {entry.facts.map((fact) => (
                    <div key={fact.label} className="border-b border-[var(--line)] pb-3 last:border-0 last:pb-0">
                      <p className="text-[8px] tracking-[0.08em] text-[var(--faint)]">{fact.label}</p>
                      <p className="mt-1 text-[12px] leading-[1.5] text-[var(--ink)]">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3 rounded-[24px] border border-[var(--line)] p-5">
              <p className="eyebrow">On this page</p>
              <div className="mt-3 space-y-2">
                {entry.sections.map((section, sectionIndex) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex gap-2 text-[9px] leading-[1.7] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    <span className="font-mono text-[8px] text-[var(--faint)]">
                      {String(sectionIndex + 1).padStart(2, "0")}
                    </span>
                    {section.heading}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
