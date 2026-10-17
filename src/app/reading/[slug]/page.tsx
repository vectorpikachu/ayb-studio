import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  Clock3,
  Languages,
  Sparkles,
} from "lucide-react";
import { Handwriting } from "@/components/handwriting";
import { ReadingParagraphs } from "@/components/reading/reading-paragraphs";
import {
  countArmenianWords,
  getAdjacentReadingTexts,
  getReadingText,
  readingLevelLabels,
  readingTexts,
} from "@/data/reading";

type ReadingPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return readingTexts.map((text) => ({ slug: text.id }));
}

export async function generateMetadata({ params }: ReadingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const text = getReadingText(slug);
  if (!text) return { title: "课文" };
  return {
    title: `${text.title} · 课文`,
    description: text.description,
  };
}

export default async function ReadingTextPage({ params }: ReadingPageProps) {
  const { slug } = await params;
  const text = getReadingText(slug);
  if (!text) notFound();

  const index = readingTexts.findIndex((candidate) => candidate.id === text.id) + 1;
  const words = countArmenianWords(text);
  const { previous, next } = getAdjacentReadingTexts(text.id);
  const paragraphCount = text.paragraphs.length;

  return (
    <div className="pb-20">
      <div className="container-ayb pt-[108px] md:pt-[132px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/reading"
            className="inline-flex items-center gap-2 text-[9px] font-medium tracking-[0.04em] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft size={12} />
            返回课文
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-[var(--faint)]">
            <span className="font-mono">
              TEXT {String(index).padStart(2, "0")} / {String(readingTexts.length).padStart(2, "0")}
            </span>
            <span className="h-3 w-[1px] bg-[var(--line)]" />
            <span>
              {text.level} · {readingLevelLabels[text.level]}
            </span>
            <span className="h-3 w-[1px] bg-[var(--line)]" />
            <span className="flex items-center gap-1">
              <Clock3 size={10} />
              {text.minutes} 分钟
            </span>
          </div>
        </div>

        <header className="relative mt-8 overflow-hidden border-b border-[var(--line)] pb-9 md:mt-10 md:pb-12">
          <div className="pointer-events-none absolute right-0 top-0 hidden h-40 w-40 rounded-full border border-[var(--line)] md:block" aria-hidden />
          <div className="pointer-events-none absolute right-16 top-12 hidden h-16 w-16 rounded-full border border-dashed border-[var(--line)] md:block" aria-hidden />
          <div className="relative z-10 grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow">Reading · Ընթերցանություն</p>
              <h1 className="mt-4 text-[38px] font-medium leading-[1.1] tracking-[-0.045em] text-[var(--ink)] md:text-[52px]">
                {text.title}
              </h1>
              <p className="mt-3 font-hand text-[34px] leading-[1.3] text-[var(--accent)] md:text-[42px]" lang="hy">
                {text.titleHy}
              </p>
              <p className="mt-4 max-w-[620px] text-[11px] leading-[1.9] text-[var(--muted)]">
                {text.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[9px] text-[var(--faint)] md:flex-col md:items-end">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1.5">
                <BookOpenText size={11} />
                {paragraphCount} 段 · {words} 词
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1.5">
                <Languages size={11} />
                {text.vocabulary.length} 生词 · {text.grammarPoints.length} 语法点
              </span>
              <span className="hidden text-[8px] tracking-[0.12em] md:block">AYB · READING</span>
            </div>
          </div>
        </header>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <article className="min-w-0">
            <div className="surface-card overflow-hidden rounded-[28px]">
              <ReadingParagraphs paragraphs={text.paragraphs} />
            </div>

            <section className="mt-12" aria-labelledby="vocabulary">
              <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
                <div>
                  <p className="eyebrow">Vocabulary · Բառեր</p>
                  <h2 id="vocabulary" className="mt-2 text-[24px] font-medium tracking-[-0.03em] text-[var(--ink)]">
                    生词
                  </h2>
                </div>
                <span className="text-[9px] text-[var(--faint)]">{text.vocabulary.length} 个</span>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {text.vocabulary.map((word) => (
                  <div key={word.hy} className="glass-soft rounded-[20px] p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-arm text-[20px] leading-tight text-[var(--ink)]" lang="hy">
                        {word.hy}
                      </p>
                      <span className="text-[9px] tracking-[0.04em] text-[var(--faint)]">
                        {word.translit}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[var(--muted)]">{word.zh}</p>
                    {word.note && (
                      <p className="mt-1 text-[9px] leading-[1.7] text-[var(--faint)]">{word.note}</p>
                    )}
                    <Handwriting
                      text={word.hy}
                      className="mt-2"
                      textClassName="text-[18px] leading-[1.4]"
                      iconSize={11}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12" aria-labelledby="grammar-points">
              <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
                <div>
                  <p className="eyebrow">Grammar in context · Քերականություն</p>
                  <h2 id="grammar-points" className="mt-2 text-[24px] font-medium tracking-[-0.03em] text-[var(--ink)]">
                    语法点
                  </h2>
                </div>
                <span className="text-[9px] text-[var(--faint)]">{text.grammarPoints.length} 个</span>
              </div>
              <div className="mt-5 space-y-3">
                {text.grammarPoints.map((point, pointIndex) => (
                  <section
                    key={point.title}
                    id={`grammar-${pointIndex + 1}`}
                    className="surface-card rounded-[24px] p-5 md:p-6"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 font-mono text-[9px] text-[var(--accent)]">
                        {String(pointIndex + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[16px] font-medium tracking-[-0.02em] text-[var(--ink)]">
                          {point.title}
                        </h3>
                        <p className="mt-2 text-[11px] leading-[1.9] text-[var(--muted)]">
                          {point.explanation}
                        </p>
                        <div className="mt-4 space-y-3">
                          {point.examples.map((example) => (
                            <div key={example.hy} className="border-l border-[var(--accent)] pl-4">
                              <p className="font-arm text-[17px] leading-[1.6] text-[var(--ink)]" lang="hy">
                                {example.hy}
                              </p>
                              <Handwriting
                                text={example.hy}
                                className="mt-1.5"
                                textClassName="text-[18px] leading-[1.7]"
                                iconSize={10}
                              />
                              <p className="mt-1.5 text-[10px] leading-[1.8] text-[var(--muted)]">
                                {example.zh}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section className="glass mt-10 rounded-[26px] p-6 md:p-7">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-[var(--apricot)]" />
                <p className="eyebrow">Takeaways · Հիշիր</p>
              </div>
              <ul className="mt-4 space-y-2.5">
                {text.takeaways.map((takeaway) => (
                  <li key={takeaway} className="flex gap-2.5 text-[11px] leading-[1.8] text-[var(--muted)]">
                    <span className="mt-[2px] text-[var(--accent)]">—</span>
                    {takeaway}
                  </li>
                ))}
              </ul>
            </section>

            <nav className="mt-10 grid gap-3 border-t border-[var(--line)] pt-6 sm:grid-cols-2">
              {previous ? (
                <Link
                  href={`/reading/${previous.id}`}
                  className="glass-soft group rounded-[18px] p-4 transition-colors hover:bg-[var(--surface-2)]"
                >
                  <span className="flex items-center gap-2 text-[8px] tracking-[0.12em] text-[var(--faint)]">
                    <ArrowLeft size={10} />
                    上一篇
                  </span>
                  <p className="mt-2 text-[14px] font-medium text-[var(--ink)]">{previous.title}</p>
                </Link>
              ) : (
                <div className="rounded-[18px] border border-dashed border-[var(--line)] p-4 text-[9px] text-[var(--faint)]">
                  这是第一篇。
                </div>
              )}
              {next ? (
                <Link
                  href={`/reading/${next.id}`}
                  className="glass-soft group rounded-[18px] p-4 text-right transition-colors hover:bg-[var(--surface-2)]"
                >
                  <span className="flex items-center justify-end gap-2 text-[8px] tracking-[0.12em] text-[var(--faint)]">
                    下一篇
                    <ArrowRight size={10} />
                  </span>
                  <p className="mt-2 text-[14px] font-medium text-[var(--ink)]">{next.title}</p>
                </Link>
              ) : (
                <div className="rounded-[18px] border border-dashed border-[var(--line)] p-4 text-right text-[9px] text-[var(--faint)]">
                  更多课文还在路上。
                </div>
              )}
            </nav>
          </article>

          <aside className="hidden lg:sticky lg:top-[96px] lg:block">
            <div className="surface-card rounded-[24px] p-5">
              <p className="eyebrow">In this text</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-b border-[var(--line)] pb-4 text-center">
                <div>
                  <p className="text-[22px] leading-none text-[var(--ink)]">{text.vocabulary.length}</p>
                  <p className="mt-1 text-[8px] text-[var(--faint)]">生词</p>
                </div>
                <div>
                  <p className="text-[22px] leading-none text-[var(--ink)]">{text.grammarPoints.length}</p>
                  <p className="mt-1 text-[8px] text-[var(--faint)]">语法点</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {text.grammarPoints.map((point, pointIndex) => (
                  <a
                    key={point.title}
                    href={`#grammar-${pointIndex + 1}`}
                    className="flex gap-2 text-[9px] leading-[1.7] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    <span className="font-mono text-[8px] text-[var(--faint)]">
                      {String(pointIndex + 1).padStart(2, "0")}
                    </span>
                    {point.title}
                  </a>
                ))}
              </div>
              <Link href="/grammar/seven-cases" className="arrow-link mt-5 !text-[10px]">
                系统看七个格
                <ArrowUpRight size={11} />
              </Link>
            </div>

            <div className="mt-3 rounded-[24px] border border-[var(--line)] p-5">
              <div className="flex items-center gap-2 text-[var(--faint)]">
                <Languages size={12} />
                <span className="eyebrow">Reading tip</span>
              </div>
              <p className="mt-3 text-[10px] leading-[1.9] text-[var(--muted)]">
                第一遍不要查词。把动词圈出来，猜一猜谁做了什么；第二遍再打开中文对照和生词表。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
