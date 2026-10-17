import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  Flame,
  MousePointerClick,
  Quote,
  Sparkles,
} from "lucide-react";
import { AudioButton } from "@/components/audio-button";
import { Handwriting } from "@/components/handwriting";
import { Reveal } from "@/components/reveal";

const steps = [
  {
    number: "01",
    title: "先翻开，再回答",
    body: "看到亚美尼亚语单词，先在脑中寻找意思。翻开卡片后，释义、转写与一句真实例句会一起出现。",
  },
  {
    number: "02",
    title: "告诉自己有多确定",
    body: "重来、困难、记得、简单。四个按键，不需要打分表，也不要猜。",
  },
  {
    number: "03",
    title: "在刚好的时候重逢",
    body: "间隔会随着记忆变稳而变长。复习不是重复劳动，而是让每次重逢都发生在遗忘之前。",
  },
];

export function ReviewGuest() {
  return (
    <div className="overflow-hidden pb-16">
      <section className="container-ayb relative pb-8 pt-[124px] md:pt-[156px]">
        <div className="grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr]">
          <Reveal>
            <p className="eyebrow">Recite · Կրկնություն</p>
            <h1 className="mt-5 max-w-[560px] text-[42px] font-medium leading-[1.06] tracking-[-0.05em] text-[var(--ink)] md:text-[64px]">
              把遇见过的词，
              <br />
              一次次带回来。
            </h1>
            <p className="mt-6 max-w-[460px] text-[12px] leading-[1.95] text-[var(--muted)]">
              间隔重复不是考试。它只是在你快要忘记的时候，把那个词、那句例句，再一次轻轻放到眼前。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register?next=/review" className="btn btn-primary">
                创建账户并开始
                <ArrowRight size={14} />
              </Link>
              <Link href="/login?next=/review" className="btn btn-ghost">
                已有账户，登录
                <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[9px] tracking-[0.05em] text-[var(--faint)]">
              <span className="flex items-center gap-1.5">
                <Sparkles size={11} className="text-[var(--accent)]" />
                带例句的记忆
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 size={11} />
                四档间隔重复
              </span>
              <span className="flex items-center gap-1.5">
                <Flame size={11} />
                连续学习记录
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="relative mx-auto w-full max-w-[480px]">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="absolute left-[8%] top-[8%] h-20 w-20 rounded-full border border-[var(--line)]" />
              <div className="absolute bottom-[10%] right-[6%] h-28 w-28 rounded-full border border-dashed border-[var(--line)]" />
              <div className="absolute right-[14%] top-[3%] h-2 w-2 rounded-full bg-[var(--accent)]" />
              <div className="absolute bottom-[16%] left-[3%] h-1.5 w-1.5 rounded-full bg-[var(--apricot)]" />
            </div>

            <div className="absolute inset-x-8 top-6 h-[390px] -rotate-[3deg] rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] opacity-55" />
            <div className="absolute inset-x-5 top-3 h-[400px] rotate-[1.5deg] rounded-[24px] border border-[var(--line)] bg-[var(--surface)] opacity-80" />

            <div className="surface-card relative rounded-[26px] p-6 shadow-[0_35px_90px_rgba(0,0,0,.24)] md:p-8">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  <span className="text-[8px] tracking-[0.12em] text-[var(--faint)]">SAMPLE CARD · A1</span>
                </div>
                <AudioButton text="նուռ" label="朗读示例词语" size="sm" />
              </div>

              <div className="py-8 text-center">
                <span className="eyebrow">这个词语是什么意思？</span>
                <p className="mt-5 font-display text-[82px] leading-none text-[var(--ink)]" lang="hy">
                  նուռ
                </p>
                <p className="mt-3 text-[10px] tracking-[0.08em] text-[var(--faint)]">nurr</p>
                <Handwriting
                  text="նուռ"
                  className="mt-3 justify-center"
                  textClassName="text-[28px] leading-[1.4]"
                  iconSize={13}
                />
                <div className="mt-7 grid gap-1.5 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-left">
                  <div className="flex items-baseline gap-3">
                    <span className="w-5 text-[8px] text-[var(--faint)]">中</span>
                    <span className="text-[12px] font-medium text-[var(--ink)]">石榴</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="w-5 text-[8px] text-[var(--faint)]">EN</span>
                    <span className="text-[10px] text-[var(--muted)]">pomegranate</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="w-5 text-[8px] text-[var(--faint)]">RU</span>
                    <span className="text-[10px] text-[var(--muted)]">гранат</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[14px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-2)_38%,transparent)] p-4">
                <div className="flex items-center gap-2 text-[var(--faint)]">
                  <Quote size={10} />
                  <span className="eyebrow">例句 · In a sentence</span>
                </div>
                <p className="mt-3 font-arm text-[17px] leading-[1.6] text-[var(--ink)]" lang="hy">
                  Աշնանը նուռը կարմիր է դառնում։
                </p>
                <Handwriting
                  text="Աշնանը նուռը կարմիր է դառնում։"
                  className="mt-2"
                  textClassName="text-[18px] leading-[1.7]"
                  iconSize={10}
                />
                <p className="mt-1.5 text-[9px] text-[var(--faint)]">秋天，石榴变红了。</p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
                <div className="flex items-center gap-1.5 text-[8px] tracking-[0.05em] text-[var(--faint)]">
                  <MousePointerClick size={10} />
                  登录后开始你的第一轮复习
                </div>
                <div className="flex gap-1">
                  {["1", "2", "3", "4"].map((key) => (
                    <span
                      key={key}
                      className="grid h-5 w-5 place-items-center rounded-md border border-[var(--line)] font-mono text-[8px] text-[var(--faint)]"
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="orbit-chip absolute -right-2 top-[16%] hidden xl:block">
              <strong>10 min</strong>
              <span>AGAIN · ՀԵՏՈ</span>
            </div>
            <div className="orbit-chip absolute -bottom-14 left-[12%] hidden xl:block">
              <strong>4 days</strong>
              <span>NEXT · ՀԵՏՈ</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-ayb mt-20 md:mt-28">
        <Reveal>
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="eyebrow">How it works · Ինչպես</p>
              <h2 className="mt-3 text-[26px] font-medium tracking-[-0.035em] text-[var(--ink)] md:text-[34px]">
                三次呼吸，记住一个词。
              </h2>
            </div>
            <Link href="/login?next=/review" className="arrow-link hidden sm:flex">
              试试看
              <ArrowRight size={12} />
            </Link>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.06}>
              <div className="surface-card h-full rounded-[22px] p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold tracking-[0.14em] text-[var(--faint)]">
                    {step.number}
                  </span>
                  {index === 0 && <BookOpen size={14} className="text-[var(--accent)]" />}
                  {index === 1 && <Check size={14} className="text-[var(--sage)]" />}
                  {index === 2 && <Flame size={14} className="text-[var(--apricot)]" />}
                </div>
                <h3 className="mt-8 text-[16px] font-medium text-[var(--ink)]">{step.title}</h3>
                <p className="mt-3 text-[10px] leading-[1.9] text-[var(--muted)]">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
