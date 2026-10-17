import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import {
  grammarLessons,
  grammarLevelGroups,
  totalGrammarMinutes,
} from "@/data/grammar";
import { ARMENIAN_ALPHABET } from "@/data/dictionary";
import { getCurrentUser } from "@/lib/server/auth";
import { getGrammarProgressMap } from "@/lib/server/grammar";

export const metadata: Metadata = {
  title: "语法",
  description:
    "九节可实践的亚美尼亚语语法课：从字母、发音与人称，到名词、时态、格与后置词，每课都有例句和自测。",
};

export default async function GrammarPage() {
  const user = await getCurrentUser();
  const progress = user ? await getGrammarProgressMap(user.id) : {};
  const completedIds = new Set(Object.keys(progress));
  const completedCount = grammarLessons.filter((lesson) => completedIds.has(lesson.id)).length;
  const firstUnfinished =
    grammarLessons.find((lesson) => !completedIds.has(lesson.id)) ?? grammarLessons[0];
  const percent = Math.round((completedCount / grammarLessons.length) * 100);

  return (
    <div className="pb-16">
      <section className="container-ayb relative overflow-hidden pt-[112px] md:pt-[140px]">
        <span
          className="pointer-events-none absolute -right-8 top-12 hidden select-none font-display text-[280px] leading-none text-[var(--ink)] opacity-[0.025] lg:block"
          aria-hidden
        >
          Ք
        </span>
        <div className="pointer-events-none absolute right-[12%] top-[150px] hidden h-36 w-36 rounded-full border border-[var(--line)] lg:block" aria-hidden />

        <div className="grid items-end gap-10 lg:grid-cols-[1fr_310px]">
          <Reveal>
            <p className="eyebrow">Grammar · Քերականություն</p>
            <h1 className="mt-5 max-w-[700px] text-[42px] font-medium leading-[1.07] tracking-[-0.05em] text-[var(--ink)] md:text-[62px]">
              语法不是围墙，
              <br />
              是一张地图。
            </h1>
            <p className="mt-5 max-w-[510px] text-[12px] leading-[1.95] text-[var(--muted)]">
              从 38 个字母到格的变化，九节短课，把规则放回具体的句子里。每节课都配有例句、对照表和一小组自测。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/grammar/${firstUnfinished.id}`}
                className="btn btn-primary"
              >
                {completedCount > 0 ? "继续下一课" : "从第一课开始"}
                <ArrowRight size={14} />
              </Link>
              {!user && (
                <Link href="/register?next=/grammar" className="btn btn-ghost">
                  注册保存进度
                  <ArrowUpRight size={13} />
                </Link>
              )}
              {user && (
                <Link href="/review" className="btn btn-ghost">
                  去复习单词
                  <ArrowUpRight size={13} />
                </Link>
              )}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] tracking-[0.05em] text-[var(--faint)]">
              <span className="flex items-center gap-1.5">
                <BookOpen size={11} />
                {grammarLessons.length} 节课
              </span>
              <span className="h-3 w-[1px] bg-[var(--line)]" />
              <span className="flex items-center gap-1.5">
                <Clock3 size={11} />
                约 {totalGrammarMinutes} 分钟
              </span>
              <span className="h-3 w-[1px] bg-[var(--line)]" />
              <span>A1 → B1 · 循序渐进</span>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="surface-card relative overflow-hidden rounded-[26px] p-5 md:p-6">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-25 blur-3xl"
                style={{ background: "var(--accent)" }}
              />
              <div className="flex items-center justify-between">
                <span className="eyebrow">Your path</span>
                <span className="text-[9px] text-[var(--faint)]">{percent}%</span>
              </div>
              <div className="mt-5 flex items-center gap-5">
                <div
                  className="grid h-[112px] w-[112px] shrink-0 place-items-center rounded-full p-[3px]"
                  style={{
                    background: `conic-gradient(var(--accent) ${percent * 3.6}deg, var(--surface-2) 0)`,
                  }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full bg-[var(--elevated)] text-center">
                    <div>
                      <p className="text-[26px] leading-none text-[var(--ink)]">
                        {completedCount}
                        <span className="text-[13px] text-[var(--faint)]"> / {grammarLessons.length}</span>
                      </p>
                      <p className="mt-1.5 text-[8px] tracking-[0.12em] text-[var(--faint)]">LESSONS</p>
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[var(--ink)]">
                    {user
                      ? completedCount === grammarLessons.length
                        ? "九节课，已全部走完。"
                        : "下一站，"
                      : "登录后保存你的路径。"}
                  </p>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--muted)]">
                    {user
                      ? completedCount === grammarLessons.length
                        ? "可以随时回来重读，或去复习里巩固词汇。"
                        : firstUnfinished.title
                      : "每节课的自测通过后，会在这里留下一个标记。"}
                  </p>
                  <Link
                    href={user ? `/grammar/${firstUnfinished.id}` : "/login?next=/grammar"}
                    className="arrow-link mt-3 !text-[10px]"
                  >
                    {user ? "打开下一课" : "登录以保存"}
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <div className="hide-scrollbar mt-12 flex items-center gap-4 overflow-x-auto border-y border-[var(--line)] py-4">
            <span className="eyebrow shrink-0">The alphabet · 38 տառ</span>
            <div className="flex items-center gap-1">
              {ARMENIAN_ALPHABET.map((letter) => (
                <span
                  key={letter}
                  className="grid h-6 min-w-6 shrink-0 place-items-center font-arm text-[11px] text-[var(--muted)]"
                  lang="hy"
                >
                  {letter}
                </span>
              ))}
            </div>
            <Link
              href="/grammar/alphabet-and-sounds"
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-[9px] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
            >
              认识它们
              <ArrowUpRight size={10} />
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="container-ayb mt-14 md:mt-20">
        <Reveal>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Course map · Դասընթաց</p>
              <h2 className="mt-3 text-[28px] font-medium tracking-[-0.035em] text-[var(--ink)] md:text-[36px]">
                九节课，一条慢慢变清晰的路。
              </h2>
            </div>
            <p className="max-w-[260px] text-[10px] leading-[1.8] text-[var(--faint)] sm:text-right">
              不需要按顺序完成。
              <br />
              但每一节都会用到前面留下的一块砖。
            </p>
          </div>
        </Reveal>

        <div className="mt-9">
          {grammarLevelGroups.map((group) => (
            <div key={group.level} className="mb-8">
              <div className="flex items-center gap-3 border-b border-[var(--line)] pb-3">
                <span className="rounded-full border border-[var(--line)] px-2.5 py-1 font-mono text-[8px] text-[var(--accent)]">
                  {group.level}
                </span>
                <span className="text-[11px] font-medium text-[var(--ink)]">{group.label}</span>
                <span className="text-[9px] text-[var(--faint)]">
                  {group.lessons.length} 节 · {group.level === "A1" ? "打好地基" : group.level === "A2" ? "把时间放进去" : "让名词移动"}
                </span>
                <span className="ml-auto hidden font-mono text-[8px] text-[var(--faint)] sm:block">
                  {group.lessons.filter((lesson) => completedIds.has(lesson.id)).length} / {group.lessons.length} DONE
                </span>
              </div>

              <div>
                {group.lessons.map((lesson) => {
                  const completed = completedIds.has(lesson.id);
                  const isNext = user && lesson.id === firstUnfinished.id && !completed;
                  return (
                    <Link
                      key={lesson.id}
                      href={`/grammar/${lesson.id}`}
                      className="group grid items-center gap-4 border-b border-[var(--line)] py-5 transition-colors hover:border-[var(--line-strong)] md:grid-cols-[54px_1fr_210px_28px] md:py-6"
                    >
                      <div className="flex items-center gap-2 md:block">
                        <span className="font-mono text-[10px] text-[var(--faint)]">
                          {String(lesson.order).padStart(2, "0")}
                        </span>
                        {completed && <CheckCircle2 size={12} className="text-[var(--sage)] md:mt-2 md:block" />}
                        {isNext && (
                          <span className="rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] px-1.5 py-0.5 text-[8px] text-[var(--accent)] md:mt-2 md:inline-block">
                            NEXT
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-[18px] font-medium tracking-[-0.02em] text-[var(--ink)] md:text-[21px]">
                            {lesson.title}
                          </h3>
                          <span className="font-arm text-[10px] text-[var(--faint)] md:hidden" lang="hy">
                            {lesson.titleHy}
                          </span>
                          {completed && (
                            <span className="rounded-full bg-[color-mix(in_srgb,var(--sage)_9%,transparent)] px-2 py-0.5 text-[8px] text-[var(--sage)]">
                              已完成
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 max-w-[570px] text-[10px] leading-[1.8] text-[var(--muted)]">
                          {lesson.subtitle}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 md:block md:text-right">
                        <p className="hidden font-display text-[19px] leading-tight text-[var(--muted)] md:block" lang="hy">
                          {lesson.titleHy}
                        </p>
                        <p className="mt-1 text-[8px] tracking-[0.06em] text-[var(--faint)]">
                          {lesson.level} · {lesson.minutes} MIN
                        </p>
                      </div>

                      <span className="hidden h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] text-[var(--faint)] transition-all duration-300 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] md:flex">
                        <ArrowUpRight size={12} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <Reveal>
          <div className="mt-4 flex flex-col justify-between gap-5 rounded-[22px] border border-[var(--line)] p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--apricot)]">
                <Sparkles size={14} />
              </span>
              <div>
                <p className="text-[11px] font-medium text-[var(--ink)]">语法是骨骼，词汇是血肉。</p>
                <p className="mt-1 max-w-[470px] text-[9px] leading-[1.8] text-[var(--faint)]">
                  读完一课后，去词典找一个刚学的结构里出现过的词，再把它放进复习队列。知识会因此有落脚点。
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href="/dictionary" className="btn btn-ghost !min-h-9 !px-4 !text-[10px]">
                打开词典
              </Link>
              <Link href="/review" className="btn btn-primary !min-h-9 !px-4 !text-[10px]">
                去复习
                <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
