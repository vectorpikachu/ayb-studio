import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { GrammarBlocks } from "@/components/grammar/lesson-blocks";
import { LessonQuiz } from "@/components/grammar/lesson-quiz";
import {
  getAdjacentLessons,
  getGrammarLesson,
  grammarLevelLabels,
} from "@/data/grammar";
import { getCurrentUser } from "@/lib/server/auth";
import { getGrammarProgressMap } from "@/lib/server/grammar";

type LessonPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getGrammarLesson(slug);
  if (!lesson) return { title: "语法课" };
  return {
    title: `${lesson.title} · 语法`,
    description: lesson.description,
  };
}

export default async function GrammarLessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const lesson = getGrammarLesson(slug);
  if (!lesson) notFound();

  const user = await getCurrentUser();
  const progressMap = user ? await getGrammarProgressMap(user.id) : {};
  const progress = progressMap[lesson.id] ?? null;
  const { previous, next } = getAdjacentLessons(lesson.id);
  const loginNextPath = `/grammar/${lesson.id}`;

  return (
    <div className="pb-16">
      <div className="container-ayb pt-[108px] md:pt-[132px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/grammar"
            className="inline-flex items-center gap-2 text-[9px] font-medium tracking-[0.04em] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft size={12} />
            返回语法地图
          </Link>
          <div className="flex items-center gap-3 text-[9px] text-[var(--faint)]">
            <span className="font-mono">
              LESSON {String(lesson.order).padStart(2, "0")} / 09
            </span>
            <span className="h-3 w-[1px] bg-[var(--line)]" />
            <span>{lesson.level} · {grammarLevelLabels[lesson.level]}</span>
            <span className="h-3 w-[1px] bg-[var(--line)]" />
            <span className="flex items-center gap-1">
              <Clock3 size={10} />
              {lesson.minutes} 分钟
            </span>
          </div>
        </div>

        <header className="relative mt-8 overflow-hidden border-b border-[var(--line)] pb-9 md:mt-10 md:pb-12">
          <div className="pointer-events-none absolute right-0 top-0 hidden h-40 w-40 rounded-full border border-[var(--line)] md:block" aria-hidden />
          <div className="pointer-events-none absolute right-16 top-12 hidden h-16 w-16 rounded-full border border-dashed border-[var(--line)] md:block" aria-hidden />
          <div className="relative z-10 grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow">Grammar notes · 语法笔记</p>
              <h1 className="mt-4 text-[38px] font-medium leading-[1.1] tracking-[-0.045em] text-[var(--ink)] md:text-[52px]">
                {lesson.title}
              </h1>
              <p className="mt-3 font-display text-[24px] leading-[1.25] text-[var(--accent)] md:text-[30px]" lang="hy">
                {lesson.titleHy}
              </p>
              <p className="mt-4 max-w-[600px] text-[11px] leading-[1.9] text-[var(--muted)]">
                {lesson.description}
              </p>
            </div>

            <div className="flex items-center gap-3 md:flex-col md:items-end">
              {progress ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--sage)_35%,transparent)] bg-[color-mix(in_srgb,var(--sage)_8%,transparent)] px-3 py-1.5 text-[9px] text-[var(--sage)]">
                  <CheckCircle2 size={11} />
                  已完成 · {progress.score}/{progress.total}
                </span>
              ) : user ? (
                <span className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[9px] text-[var(--faint)]">
                  尚未完成
                </span>
              ) : (
                <Link
                  href={`/login?next=${encodeURIComponent(loginNextPath)}`}
                  className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[9px] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                >
                  登录以保存进度
                </Link>
              )}
              <p className="hidden text-[8px] tracking-[0.12em] text-[var(--faint)] md:block">
                AYB · GRAMMAR
              </p>
            </div>
          </div>
        </header>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_230px]">
          <article className="min-w-0 max-w-[780px]">
            <p className="border-l-2 border-[var(--accent)] pl-5 text-[14px] leading-[2] text-[var(--ink)]">
              {lesson.intro}
            </p>

            {lesson.sections.map((section, sectionIndex) => (
              <section key={section.id} id={section.id} className="mt-12 scroll-mt-28">
                <div className="flex items-baseline gap-4 border-b border-[var(--line)] pb-3">
                  <span className="font-mono text-[9px] text-[var(--accent)]">
                    {String(sectionIndex + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-[23px] font-medium tracking-[-0.025em] text-[var(--ink)] md:text-[27px]">
                    {section.title}
                  </h2>
                </div>
                <div className="mt-5">
                  <GrammarBlocks blocks={section.blocks} />
                </div>
              </section>
            ))}

            <section className="mt-12 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-[var(--apricot)]" />
                <p className="eyebrow">Takeaways · Հիշիր</p>
              </div>
              <h2 className="mt-3 text-[20px] font-medium tracking-[-0.02em] text-[var(--ink)]">
                带走这三件事。
              </h2>
              <ol className="mt-4 grid gap-2.5">
                {lesson.takeaways.map((takeaway, index) => (
                  <li key={takeaway} className="flex gap-3 text-[11px] leading-[1.85] text-[var(--muted)]">
                    <span className="mt-0.5 font-mono text-[9px] text-[var(--accent)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {takeaway}
                  </li>
                ))}
              </ol>
            </section>

            <LessonQuiz
              lessonId={lesson.id}
              questions={lesson.quiz}
              initialProgress={progress ? { score: progress.score, total: progress.total } : null}
              isAuthenticated={Boolean(user)}
              loginNextPath={loginNextPath}
            />

            <nav className="mt-10 grid gap-3 border-t border-[var(--line)] pt-6 sm:grid-cols-2">
              {previous ? (
                <Link
                  href={`/grammar/${previous.id}`}
                  className="group flex items-center gap-3 rounded-[16px] border border-[var(--line)] p-4 transition-colors hover:border-[var(--line-strong)]"
                >
                  <ArrowLeft size={14} className="shrink-0 text-[var(--faint)]" />
                  <div>
                    <p className="text-[8px] tracking-[0.1em] text-[var(--faint)]">上一课</p>
                    <p className="mt-1 text-[11px] text-[var(--ink)]">{previous.title}</p>
                  </div>
                </Link>
              ) : (
                <Link
                  href="/grammar"
                  className="group flex items-center gap-3 rounded-[16px] border border-[var(--line)] p-4 transition-colors hover:border-[var(--line-strong)]"
                >
                  <ListChecks size={14} className="shrink-0 text-[var(--faint)]" />
                  <div>
                    <p className="text-[8px] tracking-[0.1em] text-[var(--faint)]">课程地图</p>
                    <p className="mt-1 text-[11px] text-[var(--ink)]">返回全部语法课</p>
                  </div>
                </Link>
              )}
              {next ? (
                <Link
                  href={`/grammar/${next.id}`}
                  className="group flex items-center justify-between gap-3 rounded-[16px] border border-[var(--line)] p-4 text-right transition-colors hover:border-[var(--line-strong)]"
                >
                  <div>
                    <p className="text-[8px] tracking-[0.1em] text-[var(--faint)]">下一课</p>
                    <p className="mt-1 text-[11px] text-[var(--ink)]">{next.title}</p>
                  </div>
                  <ArrowRight size={14} className="shrink-0 text-[var(--faint)] transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link
                  href="/grammar"
                  className="group flex items-center justify-between gap-3 rounded-[16px] border border-[var(--line)] p-4 text-right transition-colors hover:border-[var(--line-strong)]"
                >
                  <div>
                    <p className="text-[8px] tracking-[0.1em] text-[var(--faint)]">课程终点</p>
                    <p className="mt-1 text-[11px] text-[var(--ink)]">回到语法地图</p>
                  </div>
                  <ArrowUpRight size={14} className="text-[var(--faint)]" />
                </Link>
              )}
            </nav>
          </article>

          <aside className="hidden lg:sticky lg:top-[98px] lg:block">
            <div className="rounded-[20px] border border-[var(--line)] p-5">
              <p className="eyebrow">On this page</p>
              <nav className="mt-4 space-y-2.5">
                {lesson.sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex gap-2.5 text-[10px] leading-[1.6] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    <span className="font-mono text-[8px] text-[var(--faint)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </a>
                ))}
                <a
                  href="#quiz"
                  className="flex gap-2.5 border-t border-[var(--line)] pt-2.5 text-[10px] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                >
                  <span className="font-mono text-[8px] text-[var(--faint)]">✦</span>
                  三题小测
                </a>
              </nav>
            </div>

            <div className="mt-3 rounded-[20px] border border-[var(--line)] p-5">
              <p className="eyebrow">After reading</p>
              <p className="mt-3 text-[10px] leading-[1.8] text-[var(--muted)]">
                把这节课的例句读出声，再去复习里找几个相关的词。语法和词汇会在同一个句子里遇见。
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/review" className="btn btn-primary !min-h-9 !px-4 !text-[10px]">
                  去复习
                  <ArrowRight size={11} />
                </Link>
                <Link href="/dictionary" className="btn btn-ghost !min-h-9 !px-4 !text-[10px]">
                  打开词典
                </Link>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between px-1 text-[8px] tracking-[0.06em] text-[var(--faint)]">
              <span>LESSON {String(lesson.order).padStart(2, "0")}</span>
              <span>{lesson.level} · AYB</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
