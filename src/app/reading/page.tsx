import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpenText, Clock3, Languages, Sparkles } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { countArmenianWords, readingLevelLabels, readingTexts } from "@/data/reading";

export const metadata: Metadata = {
  title: "课文",
  description:
    "带生词、语法点和中文对照的亚美尼亚语课文。先读一整段，再把里面的词和格放回句子里。",
};

const readingSteps = [
  {
    number: "01",
    title: "先读印刷体",
    text: "不看翻译，先通读一遍，抓住动词和重复出现的词。",
  },
  {
    number: "02",
    title: "再对照中文",
    text: "打开中文对照，确认刚刚猜到的意思，标出不认识的词。",
  },
  {
    number: "03",
    title: "最后看手写",
    text: "切到手写模式，辨认连笔字形；再回到生词和语法点。",
  },
];

export default function ReadingPage() {
  const totalWords = readingTexts.reduce((total, text) => total + countArmenianWords(text), 0);

  return (
    <div className="pb-20">
      <section className="container-ayb relative overflow-hidden pt-[112px] md:pt-[140px]">
        <span
          className="pointer-events-none absolute -right-6 top-14 hidden select-none font-display text-[280px] leading-none text-[var(--ink)] opacity-[0.025] lg:block"
          aria-hidden
        >
          Գ
        </span>
        <div className="pointer-events-none absolute right-[13%] top-[150px] hidden h-36 w-36 rounded-full border border-[var(--line)] lg:block" aria-hidden />

        <div className="grid items-end gap-10 lg:grid-cols-[1fr_300px]">
          <Reveal>
            <p className="eyebrow">Reading room · Ընթերցարան</p>
            <h1 className="mt-5 max-w-[700px] text-[42px] font-medium leading-[1.07] tracking-[-0.05em] text-[var(--ink)] md:text-[62px]">
              把语言，
              <br />
              读成一整段。
            </h1>
            <p className="mt-5 max-w-[540px] text-[12px] leading-[1.95] text-[var(--muted)]">
              单词和语法点最终要回到段落里。每篇课文都带中文对照、生词表、语法点和朗读；先读意思，再拆句子。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/reading/${readingTexts[0].id}`} className="btn btn-primary">
                从第一篇开始
                <ArrowRight size={14} />
              </Link>
              <Link href="/grammar" className="btn btn-ghost">
                去补语法
                <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] tracking-[0.05em] text-[var(--faint)]">
              <span className="flex items-center gap-1.5">
                <BookOpenText size={11} />
                {readingTexts.length} 篇课文
              </span>
              <span className="h-3 w-[1px] bg-[var(--line)]" />
              <span className="flex items-center gap-1.5">
                <Languages size={11} />
                {totalWords} 个亚美尼亚语词
              </span>
              <span className="h-3 w-[1px] bg-[var(--line)]" />
              <span>A2 起 · 逐渐加长</span>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="surface-card relative overflow-hidden rounded-[26px] p-5 md:p-6">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-25 blur-3xl"
                style={{ background: "var(--accent)" }}
              />
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-[var(--accent)]" />
                <span className="eyebrow">How to read</span>
              </div>
              <div className="mt-5 space-y-4">
                {readingSteps.map((step) => (
                  <div key={step.number} className="flex gap-3">
                    <span className="font-mono text-[9px] text-[var(--accent)]">{step.number}</span>
                    <div>
                      <p className="text-[11px] font-medium text-[var(--ink)]">{step.title}</p>
                      <p className="mt-1 text-[9px] leading-[1.8] text-[var(--faint)]">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-ayb mt-14 md:mt-20">
        <Reveal>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Texts · Տեքստեր</p>
              <h2 className="mt-3 text-[28px] font-medium tracking-[-0.035em] text-[var(--ink)] md:text-[36px]">
                从这一篇开始。
              </h2>
            </div>
            <p className="max-w-[260px] text-[10px] leading-[1.8] text-[var(--faint)] sm:text-right">
              篇幅会慢慢变长。
              <br />
              每篇都保留生词和语法索引。
            </p>
          </div>
        </Reveal>

        <div className="mt-9 grid gap-4">
          {readingTexts.map((text, index) => {
            const words = countArmenianWords(text);
            return (
              <Reveal key={text.id} delay={index * 0.06}>
                <Link
                  href={`/reading/${text.id}`}
                  className="surface-card group relative block overflow-hidden rounded-[28px] p-6 transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-[0_34px_70px_-34px_var(--glass-shadow)] md:p-9"
                >
                  <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ background: "var(--accent)" }} />
                  <div className="relative grid gap-8 md:grid-cols-[96px_1fr_auto] md:items-center">
                    <div>
                      <p className="font-mono text-[10px] text-[var(--faint)]">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <span className="mt-3 inline-flex rounded-full border border-[var(--line)] px-2.5 py-1 text-[8px] font-semibold tracking-[0.08em] text-[var(--accent)]">
                        {text.level} · {readingLevelLabels[text.level]}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-[24px] font-medium tracking-[-0.03em] text-[var(--ink)] md:text-[30px]">
                        {text.title}
                      </h3>
                      <p className="mt-1.5 font-hand text-[28px] leading-[1.3] text-[var(--accent)]" lang="hy">
                        {text.titleHy}
                      </p>
                      <p className="mt-3 max-w-[560px] text-[11px] leading-[1.9] text-[var(--muted)]">
                        {text.description}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[8px] tracking-[0.06em] text-[var(--faint)]">
                        <span className="flex items-center gap-1.5">
                          <Clock3 size={10} />
                          {text.minutes} 分钟
                        </span>
                        <span>{words} 词</span>
                        <span>{text.vocabulary.length} 个生词</span>
                        <span>{text.grammarPoints.length} 个语法点</span>
                      </div>
                    </div>

                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] text-[var(--faint)] transition-all duration-300 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                      <ArrowUpRight size={15} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
