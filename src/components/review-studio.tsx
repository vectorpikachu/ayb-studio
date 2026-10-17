"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Cloud,
  Flame,
  Keyboard,
  Layers,
  Loader2,
  Quote,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { AudioButton } from "@/components/audio-button";
import {
  categoryMap,
  getWordById,
  levelLabels,
  posLabels,
} from "@/data/dictionary";
import type { ReviewOverview, ReviewSessionCard, ReviewSessionPayload } from "@/lib/review-types";
import { previewSchedule, formatDueDistance, type ReviewGrade } from "@/lib/srs";
import { cn } from "@/lib/utils";

const ratingMeta: Array<{
  grade: ReviewGrade;
  label: string;
  hint: string;
  key: string;
  icon: typeof RotateCcw;
  color: string;
}> = [
  {
    grade: 0,
    label: "重来",
    hint: "还没想起来",
    key: "1",
    icon: RotateCcw,
    color: "var(--accent)",
  },
  {
    grade: 1,
    label: "困难",
    hint: "想得很费力",
    key: "2",
    icon: Cloud,
    color: "var(--apricot)",
  },
  {
    grade: 2,
    label: "记得",
    hint: "正常回忆",
    key: "3",
    icon: Check,
    color: "var(--sage)",
  },
  {
    grade: 3,
    label: "简单",
    hint: "毫不费力",
    key: "4",
    icon: Zap,
    color: "var(--azure)",
  },
];

function emptyGradeCounts(): Record<ReviewGrade, number> {
  return { 0: 0, 1: 0, 2: 0, 3: 0 };
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("input, textarea, select, [contenteditable='true']"))
  );
}

function isNativeActivationTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("a, button, [role='button']"));
}

export function ReviewStudio({
  initialSession,
  userName,
  initialFocusWordId,
}: {
  initialSession: ReviewSessionPayload;
  userName: string;
  initialFocusWordId?: string;
}) {
  const [cards, setCards] = useState<ReviewSessionCard[]>(initialSession.cards);
  const [sessionTotal, setSessionTotal] = useState(initialSession.cards.length);
  const [overview, setOverview] = useState<ReviewOverview>(initialSession.overview);
  const [flipped, setFlipped] = useState(false);
  const [pendingGrade, setPendingGrade] = useState<ReviewGrade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewedWordIds, setReviewedWordIds] = useState<string[]>([]);
  const [gradeCounts, setGradeCounts] = useState<Record<ReviewGrade, number>>(emptyGradeCounts);
  const [roundLoading, setRoundLoading] = useState(false);
  const [focusNoteVisible, setFocusNoteVisible] = useState(
    Boolean(initialFocusWordId && initialSession.cards[0]?.wordId === initialFocusWordId),
  );
  const [lastSchedule, setLastSchedule] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const summaryRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const current = cards[0];
  const word = current ? getWordById(current.wordId) : undefined;
  const category = word ? categoryMap[word.category] : undefined;
  const completed = sessionTotal - cards.length;
  const progress = sessionTotal > 0 ? Math.round((completed / sessionTotal) * 100) : 100;
  const finished = cards.length === 0;
  const hasReviewed = reviewedWordIds.length > 0;
  const accuracy =
    reviewedWordIds.length > 0
      ? Math.round(((gradeCounts[2] + gradeCounts[3]) / reviewedWordIds.length) * 100)
      : 0;

  const reviewedWords = useMemo(
    () =>
      reviewedWordIds
        .map((id) => getWordById(id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [reviewedWordIds],
  );

  async function gradeCard(grade: ReviewGrade) {
    if (!current || !word || pendingGrade !== null || !flipped) return;
    const gradedWord = word;
    const gradedCard = current;

    setPendingGrade(grade);
    setError(null);
    try {
      const response = await fetch("/api/review/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: gradedCard.wordId, grade }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        state?: { due: string };
      };
      if (!response.ok) throw new Error(data.error ?? "评分没有保存，请再试一次。");

      setLastSchedule(data.state ? `下次复习：${formatDueDistance(data.state.due)}` : null);
      setGradeCounts((counts) => ({ ...counts, [grade]: counts[grade] + 1 }));
      setReviewedWordIds((ids) => [...ids, gradedWord.id]);
      setOverview((previous) => ({
        ...previous,
        dueCount: gradedCard.isNew ? previous.dueCount : Math.max(0, previous.dueCount - 1),
        newCount: gradedCard.isNew ? Math.max(0, previous.newCount - 1) : previous.newCount,
        learnedCount: gradedCard.isNew ? previous.learnedCount + 1 : previous.learnedCount,
        reviewedToday: previous.reviewedToday + 1,
        totalReviews: previous.totalReviews + 1,
        streak: Math.max(previous.streak, 1),
      }));
      setCards((queue) => queue.slice(1));
      setFlipped(false);
      setFocusNoteVisible(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "评分没有保存，请再试一次。");
    } finally {
      setPendingGrade(null);
    }
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (isNativeActivationTarget(event.target) && (event.key === " " || event.key === "Enter")) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (!flipped && (event.code === "Space" || event.key === "Enter") && cards.length > 0) {
        event.preventDefault();
        setFlipped(true);
        return;
      }

      if (flipped && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        void gradeCard((Number(event.key) - 1) as ReviewGrade);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // gradeCard depends on the current queue; re-registering keeps keyboard
    // shortcuts aligned with the card on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, flipped, pendingGrade, current?.wordId]);

  useEffect(() => {
    if (!finished || !hasReviewed) return;
    const timer = window.setTimeout(() => {
      const element = summaryRef.current;
      if (!element) return;
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [finished, hasReviewed, reducedMotion]);

  async function startAnotherRound() {
    if (roundLoading) return;
    setRoundLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/review/session?round=" + Date.now(), {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as
        | (ReviewSessionPayload & { error?: string })
        | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : "暂时无法开始新一轮。");
      }
      if (!("cards" in data)) throw new Error("暂时无法开始新一轮。");

      setCards(data.cards);
      setSessionTotal(data.cards.length);
      setOverview(data.overview);
      setFlipped(false);
      setReviewedWordIds([]);
      setGradeCounts(emptyGradeCounts());
      setLastSchedule(null);
      setFocusNoteVisible(false);
      window.setTimeout(() => {
        const element = stageRef.current;
        if (!element) return;
        const top = element.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({
          top: Math.max(0, top),
          behavior: reducedMotion ? "auto" : "smooth",
        });
      }, 80);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "暂时无法开始新一轮。");
    } finally {
      setRoundLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden pb-16">
      <div className="container-ayb relative pt-[96px] md:pt-[124px]">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow">Recite · Կրկնություն</p>
          <Link
            href="/dictionary"
            className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.04em] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
          >
            <BookOpen size={11} />
            去词典找词
          </Link>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-[34px] font-medium leading-[1.05] tracking-[-0.045em] text-[var(--ink)] md:text-[48px]">
              和一个词，再见一面。
            </h1>
            <p className="mt-2.5 hidden max-w-[500px] text-[11px] leading-[1.8] text-[var(--muted)] sm:block">
              {userName}，今天也慢一点。间隔重复会在你快要忘记的时候，把这些词重新带回来。
            </p>
            <p className="mt-2 text-[10px] text-[var(--faint)] sm:hidden">
              {userName}，今天也慢一点。
            </p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-[var(--line)] rounded-[16px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--elevated)_60%,transparent)] py-3 sm:min-w-[330px]">
            {[
              { icon: Layers, value: overview.dueCount, label: "到期复习" },
              { icon: Flame, value: overview.streak, label: "连续天数" },
              { icon: BookOpen, value: overview.learnedCount, label: "已学词语" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center px-3 text-center">
                  <Icon size={12} className="text-[var(--faint)]" strokeWidth={1.7} />
                  <p className="mt-1.5 text-[18px] leading-none text-[var(--ink)]">{stat.value}</p>
                  <p className="mt-1.5 text-[8px] tracking-[0.04em] text-[var(--faint)]">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div ref={stageRef} className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_288px]">
          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-semibold tracking-[0.1em] text-[var(--muted)]">
                  {finished ? "ROUND COMPLETE" : `CARD ${Math.min(completed + 1, sessionTotal)} / ${sessionTotal}`}
                </span>
                <span className="hidden h-[1px] w-12 bg-[var(--line)] sm:block" />
                <span className="hidden text-[9px] text-[var(--faint)] sm:block">
                  {overview.reviewedToday} 次复习 · 今日
                </span>
              </div>
              <Link
                href="/"
                className="text-[9px] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
              >
                稍后再来
              </Link>
            </div>
            <div className="mb-5 h-[3px] overflow-hidden rounded-full bg-[var(--surface-2)]">
              <motion.div
                className="h-full rounded-full bg-[var(--accent)]"
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 160, damping: 26 }}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] px-4 py-3 text-[10px] text-[var(--ink)]"
              >
                {error}
              </div>
            )}

            {focusNoteVisible && word && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-[9px] text-[var(--faint)]">
                <Sparkles size={10} className="text-[var(--apricot)]" />
                从词典带来的词：{word.hy}
              </div>
            )}

            <AnimatePresence mode="wait">
              {finished ? (
                hasReviewed ? (
                  <motion.section
                    ref={summaryRef}
                    key="summary"
                    initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="surface-card relative flex min-h-[520px] scroll-mt-[100px] flex-col items-center justify-center overflow-hidden rounded-[28px] px-6 py-12 text-center md:px-12"
                  >
                    <span
                      className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
                      style={{ background: "var(--accent)" }}
                    />
                    <div className="relative">
                      <p className="font-display text-[72px] leading-none text-[var(--accent)] md:text-[86px]" lang="hy">
                        Ապրե՛ս
                      </p>
                      <h2 className="mt-5 text-[24px] font-medium tracking-[-0.03em] text-[var(--ink)] md:text-[30px]">
                        这一轮完成了。
                      </h2>
                      <p className="mx-auto mt-3 max-w-[380px] text-[11px] leading-[1.9] text-[var(--muted)]">
                        {userName}，你今天和 {reviewedWordIds.length} 个词重新见了面。它们会在合适的时间，再回来。
                      </p>

                      <div className="mx-auto mt-8 grid max-w-[470px] grid-cols-3 divide-x divide-[var(--line)] rounded-[16px] border border-[var(--line)] bg-[var(--surface)] py-4">
                        <div>
                          <p className="text-[24px] leading-none text-[var(--ink)]">{reviewedWordIds.length}</p>
                          <p className="mt-1.5 text-[8px] text-[var(--faint)]">本轮词语</p>
                        </div>
                        <div>
                          <p className="text-[24px] leading-none text-[var(--ink)]">{accuracy}%</p>
                          <p className="mt-1.5 text-[8px] text-[var(--faint)]">记得 / 简单</p>
                        </div>
                        <div>
                          <p className="text-[24px] leading-none text-[var(--ink)]">{overview.streak}</p>
                          <p className="mt-1.5 text-[8px] text-[var(--faint)]">连续天数</p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                        {reviewedWords.slice(0, 12).map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full border border-[var(--line)] px-2.5 py-1 font-arm text-[10px] text-[var(--muted)]"
                            lang="hy"
                          >
                            {item.hy}
                          </span>
                        ))}
                        {reviewedWords.length > 12 && (
                          <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[9px] text-[var(--faint)]">
                            +{reviewedWords.length - 12}
                          </span>
                        )}
                      </div>

                      <div className="mt-9 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                        <button
                          type="button"
                          onClick={startAnotherRound}
                          disabled={roundLoading}
                          className="btn btn-primary"
                        >
                          {roundLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                          {roundLoading ? "正在准备…" : "再来一组"}
                        </button>
                        <Link href="/" className="btn btn-ghost">
                          回到学习室
                        </Link>
                      </div>
                      <p className="mt-5 text-[8px] tracking-[0.06em] text-[var(--faint)]">
                        {lastSchedule ?? "学习进度已经安静地保存。"}
                      </p>
                    </div>
                  </motion.section>
                ) : (
                  <motion.section
                    key="empty"
                    initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="surface-card flex min-h-[460px] flex-col items-center justify-center rounded-[28px] px-6 text-center"
                  >
                    <p className="font-display text-[66px] leading-none text-[var(--accent)]" lang="hy">
                      Հանգիստ
                    </p>
                    <h2 className="mt-5 text-[24px] font-medium tracking-[-0.03em] text-[var(--ink)]">
                      今天没有需要复习的词。
                    </h2>
                    <p className="mt-3 max-w-[360px] text-[11px] leading-[1.9] text-[var(--muted)]">
                      所有的词都在安静地等待它们下一次出现。你可以去词典认识一个新词，或者读一节语法。
                    </p>
                    <div className="mt-7 flex flex-wrap justify-center gap-2.5">
                      <Link href="/dictionary" className="btn btn-primary">
                        去词典逛逛
                        <ArrowRight size={13} />
                      </Link>
                      <button
                        type="button"
                        onClick={startAnotherRound}
                        disabled={roundLoading}
                        className="btn btn-ghost"
                      >
                        {roundLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                        刷新复习队列
                      </button>
                    </div>
                  </motion.section>
                )
              ) : (
                current &&
                word &&
                category && (
                  <motion.article
                    key={word.id}
                    initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => {
                      if (!flipped) setFlipped(true);
                    }}
                    className={cn(
                      "surface-card relative flex min-h-[390px] flex-col overflow-clip rounded-[28px] md:min-h-[500px]",
                      !flipped && "cursor-pointer",
                    )}
                  >
                    <span
                      className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full opacity-[0.12] blur-3xl"
                      style={{ background: category.accent }}
                    />
                    <div className="relative flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4 md:px-8">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: category.accent }}
                        />
                        <span className="text-[9px] tracking-[0.04em] text-[var(--muted)]">
                          {category.label}
                        </span>
                        <span className="h-[2px] w-[2px] rounded-full bg-[var(--faint)]" />
                        <span className="text-[9px] text-[var(--faint)]">
                          {current.isNew ? "新词 · NEW" : "复习 · REVIEW"}
                        </span>
                        <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[8px] text-[var(--faint)]">
                          {word.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                        <span className="hidden text-[9px] text-[var(--faint)] sm:block">
                          {levelLabels[word.level]}
                        </span>
                        <AudioButton text={word.hy} label="朗读这个词语" size="sm" />
                      </div>
                    </div>

                    <div className="relative flex flex-1 flex-col px-5 py-7 md:px-10 md:py-9">
                      <AnimatePresence mode="wait" initial={false}>
                        {!flipped ? (
                          <motion.div
                            key="front"
                            initial={reducedMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-1 flex-col items-center justify-center py-4 text-center"
                          >
                            <span className="eyebrow">这个词语是什么意思？</span>
                            <h2
                              className={cn(
                                "mt-7 max-w-full break-words font-display leading-[0.95] tracking-[-0.02em] text-[var(--ink)]",
                                Array.from(word.hy).length > 13
                                  ? "text-[clamp(38px,6.6vw,68px)]"
                                  : Array.from(word.hy).length > 9
                                    ? "text-[clamp(48px,7.2vw,86px)]"
                                    : "text-[clamp(64px,8.2vw,108px)]",
                              )}
                              lang="hy"
                            >
                              {word.hy}
                            </h2>
                            <p className="mt-4 text-[11px] tracking-[0.06em] text-[var(--faint)]">
                              {word.translit}
                            </p>
                            <div className="mt-7 flex items-center gap-3 text-[9px] text-[var(--faint)]">
                              <span>{posLabels[word.pos]}</span>
                              <span className="h-[2px] w-[2px] rounded-full bg-[var(--faint)]" />
                              <span>{Array.from(word.hy).length} 个字母</span>
                            </div>
                            <div className="mt-10 flex items-center gap-2 text-[9px] text-[var(--faint)] sm:hidden">
                              <span className="h-[1px] w-5 bg-[var(--line-strong)]" />
                              点击翻开
                              <span className="h-[1px] w-5 bg-[var(--line-strong)]" />
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="back"
                            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.24 }}
                            className="flex flex-1 flex-col"
                          >
                            <div className="flex flex-wrap items-end justify-between gap-3">
                              <div>
                                <p className="font-display text-[34px] leading-none text-[var(--ink)] md:text-[40px]" lang="hy">
                                  {word.hy}
                                </p>
                                <p className="mt-2 text-[9px] tracking-[0.05em] text-[var(--faint)]">
                                  {word.translit}
                                </p>
                              </div>
                              <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[8px] text-[var(--faint)]">
                                {posLabels[word.pos]}
                              </span>
                            </div>

                            <div className="mt-6 grid gap-2 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-4">
                              <div className="flex items-baseline gap-3 border-b border-[var(--line)] py-3">
                                <span className="w-5 shrink-0 text-[8px] tracking-[0.1em] text-[var(--faint)]">中</span>
                                <span className="text-[14px] font-medium text-[var(--ink)]">{word.zh}</span>
                              </div>
                              <div className="flex items-baseline gap-3 border-b border-[var(--line)] py-2.5">
                                <span className="w-5 shrink-0 text-[8px] tracking-[0.1em] text-[var(--faint)]">EN</span>
                                <span className="text-[11px] text-[var(--muted)]" lang="en">{word.en}</span>
                              </div>
                              <div className="flex items-baseline gap-3 py-2.5">
                                <span className="w-5 shrink-0 text-[8px] tracking-[0.1em] text-[var(--faint)]">RU</span>
                                <span className="text-[11px] text-[var(--muted)]" lang="ru">{word.ru}</span>
                              </div>
                            </div>

                            <div className="mt-4 rounded-[16px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-2)_38%,transparent)] p-4 md:p-5">
                              <div className="flex items-center justify-between gap-3">
                                <span className="eyebrow">例句 · In a sentence</span>
                                <div onClick={(event) => event.stopPropagation()}>
                                  <AudioButton text={word.example.hy} label="朗读例句" size="sm" />
                                </div>
                              </div>
                              <p className="mt-4 font-arm text-[20px] leading-[1.55] text-[var(--ink)] md:text-[23px]" lang="hy">
                                {word.example.hy}
                              </p>
                              <p className="mt-1.5 text-[9px] italic text-[var(--faint)]">
                                {word.example.translit}
                              </p>
                              <p className="mt-3 border-l border-[var(--accent)] pl-3 text-[10px] leading-relaxed text-[var(--muted)]">
                                {word.example.zh}
                              </p>
                              <p className="mt-1 pl-3 text-[9px] leading-relaxed text-[var(--faint)]">
                                {word.example.en}
                              </p>
                            </div>

                            {word.note && (
                              <p className="mt-4 text-[9px] leading-[1.8] text-[var(--faint)]">
                                <span className="text-[var(--apricot)]">提示 · </span>
                                {word.note}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div
                      className="relative border-t border-[var(--line)]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {!flipped ? (
                        <div className="flex items-center justify-between gap-4 px-5 py-3 md:px-8">
                          <div>
                            <p className="text-[9px] text-[var(--faint)]">先在心里回答，再翻开。</p>
                            <p className="mt-1 hidden text-[8px] text-[var(--faint)] sm:block">
                              点击卡片，或按空格键
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFlipped(true)}
                            className="btn btn-primary !min-h-10 !rounded-[12px] !px-5"
                          >
                            <Quote size={12} />
                            翻开卡片
                            <span className="ml-1 hidden rounded border border-current/20 px-1.5 py-0.5 font-mono text-[8px] font-normal opacity-60 sm:inline">
                              Space
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="px-2 py-2 md:px-3">
                          <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1">
                            <p className="text-[9px] text-[var(--faint)]">这个词语，记得有多清楚？</p>
                            <span className="hidden text-[8px] tracking-[0.04em] text-[var(--faint)] sm:block">
                              按 1–4 评分
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
                            {ratingMeta.map((rating) => {
                              const Icon = rating.icon;
                              const pending = pendingGrade === rating.grade;
                              return (
                                <button
                                  key={rating.grade}
                                  type="button"
                                  onClick={() => gradeCard(rating.grade)}
                                  disabled={pendingGrade !== null}
                                  className="group flex min-h-[64px] flex-col items-start justify-between rounded-[11px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_50%,transparent)] px-3 py-2.5 text-left transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface)] disabled:cursor-wait disabled:opacity-60"
                                >
                                  <div className="flex w-full items-center justify-between gap-2">
                                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--ink)]">
                                      {pending ? (
                                        <Loader2 size={12} className="animate-spin" />
                                      ) : (
                                        <Icon size={12} style={{ color: rating.color }} />
                                      )}
                                      {rating.label}
                                    </span>
                                    <span
                                      className="grid h-5 w-5 place-items-center rounded-md border border-[var(--line)] font-mono text-[8px] text-[var(--faint)]"
                                      style={{ color: rating.color }}
                                    >
                                      {rating.key}
                                    </span>
                                  </div>
                                  <div className="mt-2 flex w-full items-end justify-between gap-2">
                                    <span className="text-[8px] text-[var(--faint)]">{rating.hint}</span>
                                    <span className="shrink-0 text-[8px]" style={{ color: rating.color }}>
                                      {current.state
                                        ? previewSchedule(current.state, rating.grade)
                                        : previewSchedule(null, rating.grade)}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.article>
                )
              )}
            </AnimatePresence>
          </div>

          <aside className="hidden lg:sticky lg:top-[96px] lg:block">
            <div className="surface-card rounded-[22px] p-5">
              <div className="flex items-center justify-between">
                <span className="eyebrow">This round</span>
                <span className="text-[9px] text-[var(--faint)]">{progress}%</span>
              </div>
              <div className="mt-5 flex justify-center">
                <div
                  className="grid h-[116px] w-[116px] place-items-center rounded-full p-[3px] transition-[background] duration-500"
                  style={{
                    background: `conic-gradient(var(--accent) ${progress * 3.6}deg, var(--surface-2) 0)`,
                  }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full bg-[var(--elevated)] text-center">
                    <div>
                      <p className="text-[23px] leading-none text-[var(--ink)]">
                        {Math.min(completed, sessionTotal)}
                        <span className="text-[12px] text-[var(--faint)]"> / {sessionTotal}</span>
                      </p>
                      <p className="mt-1.5 text-[8px] tracking-[0.08em] text-[var(--faint)]">WORDS</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-4">
                <div>
                  <p className="text-[10px] text-[var(--muted)]">今日已复习</p>
                  <p className="mt-1 text-[16px] text-[var(--ink)]">{overview.reviewedToday}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--muted)]">连续学习</p>
                  <p className="mt-1 text-[16px] text-[var(--ink)]">{overview.streak} 天</p>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-[20px] border border-[var(--line)] p-5">
              <div className="flex items-center gap-2">
                <Keyboard size={13} className="text-[var(--faint)]" />
                <span className="eyebrow">Keyboard</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { key: "Space", label: "翻开卡片" },
                  { key: "1", label: "重来 · 10 分钟后" },
                  { key: "2", label: "困难 · 稍后" },
                  { key: "3", label: "记得 · 正常间隔" },
                  { key: "4", label: "简单 · 更长间隔" },
                ].map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between gap-3">
                    <span className="text-[9px] text-[var(--muted)]">{shortcut.label}</span>
                    <kbd className="min-w-6 rounded border border-[var(--line)] px-1.5 py-0.5 text-center font-mono text-[8px] text-[var(--faint)]">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-[20px] border border-[var(--line)] p-5">
              <p className="font-arm text-[14px] leading-[1.6] text-[var(--ink)]" lang="hy">
                Մի բառ, ևս մեկ անգամ։
              </p>
              <p className="mt-2 text-[9px] leading-relaxed text-[var(--faint)]">
                一个词，再一次。重复不是原地踏步，而是在记忆里为它铺一条更稳的路。
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between px-1 text-[8px] tracking-[0.06em] text-[var(--faint)]">
              <span>本轮共 {sessionTotal} 个词</span>
              <Link href="/dictionary" className="inline-flex items-center gap-1 hover:text-[var(--ink)]">
                查一个词
                <ArrowRight size={9} />
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-5 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2 text-[9px] text-[var(--faint)]">
            <ArrowLeft size={11} />
            回到学习室
          </Link>
          <p className="text-[8px] tracking-[0.04em] text-[var(--faint)]">
            {overview.reviewedToday} 次今日复习 · {overview.streak} 天连续
          </p>
        </div>
      </div>
    </div>
  );
}
