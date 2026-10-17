"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, Loader2, RotateCcw, X } from "lucide-react";
import type { QuizQuestion } from "@/data/grammar";
import { cn } from "@/lib/utils";

type QuizProgress = {
  score: number;
  total: number;
} | null;

type Props = {
  lessonId: string;
  questions: QuizQuestion[];
  initialProgress: QuizProgress;
  isAuthenticated: boolean;
  loginNextPath: string;
};

const optionLetters = ["A", "B", "C", "D", "E", "F"];

export function LessonQuiz({
  lessonId,
  questions,
  initialProgress,
  isAuthenticated,
  loginNextPath,
}: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Array<number | null>>(
    () => questions.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedProgress, setSavedProgress] = useState<QuizProgress>(initialProgress);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedPass, setSavedPass] = useState(false);

  const allAnswered = answers.every((answer) => answer !== null);
  const score = questions.reduce(
    (sum, question, index) => (answers[index] === question.answer ? sum + 1 : sum),
    0,
  );
  const total = questions.length;
  const passMark = Math.ceil(total * 0.6);
  const passed = submitted && score >= passMark;
  const displayProgress = savedProgress ?? initialProgress;

  function choose(questionIndex: number, optionIndex: number) {
    if (submitted) return;
    setAnswers((current) =>
      current.map((answer, index) => (index === questionIndex ? optionIndex : answer)),
    );
  }

  async function submit() {
    if (!allAnswered || submitted) return;
    setSubmitted(true);
    setSaveError(null);

    if (!isAuthenticated) return;

    setSaving(true);
    try {
      const response = await fetch("/api/grammar/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, answers }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        passed?: boolean;
        progress?: { score: number; total: number } | null;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "进度保存失败。");
      setSavedPass(Boolean(data.passed));
      if (data.progress) setSavedProgress(data.progress);
      if (data.passed) router.refresh();
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "进度保存失败。");
    } finally {
      setSaving(false);
    }
  }

  function retry() {
    setAnswers(questions.map(() => null));
    setSubmitted(false);
    setSaveError(null);
    setSavedPass(false);
  }

  return (
    <section id="quiz" className="surface-card mt-12 scroll-mt-28 overflow-hidden rounded-[24px]">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] p-6 sm:flex-row sm:items-end md:p-8">
        <div>
          <p className="eyebrow">Check yourself · Ստուգենք</p>
          <h2 className="mt-3 text-[24px] font-medium tracking-[-0.03em] text-[var(--ink)]">
            三题小测
          </h2>
          <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
            答对至少 {passMark} 题即可标记这节课为完成。
          </p>
        </div>
        {displayProgress && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--sage)_38%,transparent)] bg-[color-mix(in_srgb,var(--sage)_8%,transparent)] px-3 py-1.5 text-[9px] text-[var(--sage)]">
            <CheckCircle2 size={11} />
            已完成 · 最佳 {displayProgress.score}/{displayProgress.total}
          </span>
        )}
      </div>

      <div className="space-y-9 p-6 md:p-8">
        {questions.map((question, questionIndex) => {
          const selected = answers[questionIndex];
          const isCorrect = submitted && selected === question.answer;
          return (
            <fieldset key={question.id}>
              <legend className="flex gap-3 text-[13px] font-medium leading-[1.7] text-[var(--ink)]">
                <span className="mt-0.5 font-mono text-[10px] text-[var(--accent)]">
                  {String(questionIndex + 1).padStart(2, "0")}
                </span>
                {question.question}
              </legend>
              <div className="mt-3.5 grid gap-2">
                {question.options.map((option, optionIndex) => {
                  const picked = selected === optionIndex;
                  const correctOption = submitted && optionIndex === question.answer;
                  const wrongPick = submitted && picked && optionIndex !== question.answer;
                  return (
                    <label
                      key={option}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]",
                        correctOption
                          ? "border-[color-mix(in_srgb,var(--sage)_50%,transparent)] bg-[color-mix(in_srgb,var(--sage)_8%,transparent)]"
                          : wrongPick
                            ? "border-[color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
                            : picked
                              ? "border-[var(--ink)] bg-[var(--surface-2)]"
                              : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]",
                        submitted && "cursor-default",
                      )}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={optionIndex}
                        checked={picked}
                        onChange={() => choose(questionIndex, optionIndex)}
                        disabled={submitted}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-md border font-mono text-[9px]",
                          correctOption
                            ? "border-[var(--sage)] text-[var(--sage)]"
                            : wrongPick
                              ? "border-[var(--accent)] text-[var(--accent)]"
                              : "border-[var(--line)] text-[var(--faint)]",
                        )}
                      >
                        {correctOption ? <Check size={11} /> : wrongPick ? <X size={11} /> : optionLetters[optionIndex]}
                      </span>
                      <span className="text-[11px] leading-[1.7] text-[var(--ink)]">{option}</span>
                    </label>
                  );
                })}
              </div>
              {submitted && (
                <div
                  className={cn(
                    "mt-3 rounded-xl border-l-2 px-4 py-3 text-[10px] leading-[1.8]",
                    isCorrect
                      ? "border-[var(--sage)] bg-[color-mix(in_srgb,var(--sage)_5%,transparent)] text-[var(--muted)]"
                      : "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] text-[var(--muted)]",
                  )}
                >
                  <span className={cn("font-semibold", isCorrect ? "text-[var(--sage)]" : "text-[var(--accent)]")}>
                    {isCorrect ? "答对了。" : `正确答案：${question.options[question.answer]}`}
                  </span>{" "}
                  {question.explanation}
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      <div className="border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-2)_25%,transparent)] p-5 md:px-8">
        {!submitted ? (
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-[9px] leading-relaxed text-[var(--faint)]">
              {allAnswered ? "所有题目都已作答，可以提交了。" : "选择每道题的答案后提交。"}
            </p>
            <button
              type="button"
              onClick={submit}
              disabled={!allAnswered}
              className="btn btn-primary !min-h-10 w-full !px-5 sm:w-auto disabled:cursor-not-allowed disabled:opacity-40"
            >
              提交答案
              <ArrowRight size={13} />
            </button>
          </div>
        ) : (
          <div aria-live="polite">
            {passed ? (
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color-mix(in_srgb,var(--sage)_40%,transparent)] bg-[color-mix(in_srgb,var(--sage)_8%,transparent)] text-[var(--sage)]">
                    <CheckCircle2 size={18} />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--ink)]">
                      通过 · {score} / {total}
                    </p>
                    <p className="mt-1 text-[9px] leading-relaxed text-[var(--faint)]">
                      {isAuthenticated
                        ? saving
                          ? "正在把这次课程保存到你的进度…"
                          : savedPass
                            ? "这节课已标记完成，学习记录已更新。"
                            : saveError ?? "课程已完成。"
                        : "登录后重新提交，这次成绩与课程进度会被保存。"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={retry} className="btn btn-ghost !min-h-9 !px-4 !text-[10px]">
                    <RotateCcw size={11} />
                    再测一次
                  </button>
                  {!isAuthenticated && (
                    <Link
                      href={`/login?next=${encodeURIComponent(loginNextPath)}`}
                      className="btn btn-primary !min-h-9 !px-4 !text-[10px]"
                    >
                      登录以保存进度
                      <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] text-[var(--accent)]">
                    <X size={18} />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--ink)]">
                      还差一点 · {score} / {total}
                    </p>
                    <p className="mt-1 text-[9px] leading-relaxed text-[var(--faint)]">
                      需要答对 {passMark} 题。读一读上面的解释，再试一次。
                    </p>
                  </div>
                </div>
                <button type="button" onClick={retry} className="btn btn-primary !min-h-9 !px-4 !text-[10px]">
                  <RotateCcw size={11} />
                  再试一次
                </button>
              </div>
            )}
            {saving && (
              <p className="mt-3 flex items-center gap-2 text-[9px] text-[var(--faint)]">
                <Loader2 size={10} className="animate-spin" />
                正在保存…
              </p>
            )}
            {saveError && (
              <p className="mt-3 text-[9px] text-[var(--accent)]" role="alert">
                {saveError}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
