"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CornerDownLeft,
  Hash,
  Quote,
  Search,
  Shuffle,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AudioButton } from "@/components/audio-button";
import { ArmenianWord } from "@/components/armenian-word";
import { Handwriting } from "@/components/handwriting";
import { Reveal } from "@/components/reveal";
import {
  ARMENIAN_ALPHABET,
  categoryMap,
  dictionaryCategories,
  levelLabels,
  posLabels,
  type CategoryId,
  type DictionaryWord,
  type WordExample,
} from "@/data/dictionary";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

type ExplorerWord = {
  id: string;
  hy: string;
  translit: string;
  en: string;
  zh: string;
  ru: string;
  posLabel: string;
  level: "A1" | "A2" | "B1";
  category: CategoryId;
  example?: WordExample;
  note?: string;
};

function normalize(value: string) {
  return value.normalize("NFC").toLocaleLowerCase("hy").trim();
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function DictionaryExplorer({ words }: { words: DictionaryWord[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [letter, setLetter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedWord, setSelectedWord] = useState<ExplorerWord | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const deferredQuery = useDeferredValue(query);
  const reducedMotion = useReducedMotion();

  const entries = useMemo<ExplorerWord[]>(
    () =>
      words.map((word) => ({
        id: word.id,
        hy: word.hy,
        translit: word.translit,
        en: word.en,
        zh: word.zh,
        ru: word.ru,
        posLabel: posLabels[word.pos],
        level: word.level,
        category: word.category,
        example: word.example,
        note: word.note,
      })),
    [words],
  );

  const orderedWords = useMemo(
    () => [...entries].sort((a, b) => a.hy.localeCompare(b.hy, "hy")),
    [entries],
  );

  const availableLetters = useMemo(
    () =>
      new Set(
        orderedWords
          .map((word) => Array.from(word.hy)[0]?.toUpperCase())
          .filter((letter): letter is string => Boolean(letter)),
      ),
    [orderedWords],
  );

  const visibleAlphabet = useMemo(
    () => ARMENIAN_ALPHABET.filter((item) => availableLetters.has(item)),
    [availableLetters],
  );

  const filteredWords = useMemo(() => {
    const q = normalize(deferredQuery);
    return orderedWords.filter((word) => {
      if (category !== "all" && word.category !== category) return false;
      if (letter !== "all" && Array.from(word.hy)[0]?.toUpperCase() !== letter) return false;
      if (!q) return true;
      const meta = categoryMap[word.category];
      const haystack = normalize(
        [word.hy, word.translit, word.en, word.ru, word.zh, word.posLabel, meta.label, meta.en].join(
          " ",
        ),
      );
      return q.split(/\s+/).every((part) => haystack.includes(part));
    });
  }, [orderedWords, category, deferredQuery, letter]);

  const shownWords = filteredWords.slice(0, visibleCount);
  const hasActiveFilters = Boolean(query) || category !== "all" || letter !== "all";

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredQuery, category, letter]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !selectedWord &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [selectedWord]);

  useEffect(() => {
    if (!selectedWord) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => closeRef.current?.focus(), 60);

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedWord(null);
    }
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [selectedWord]);

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setLetter("all");
    searchRef.current?.focus();
  }

  function surpriseMe() {
    const pool = filteredWords.length > 0 ? filteredWords : orderedWords;
    setSelectedWord(pool[Math.floor(Math.random() * pool.length)]);
  }

  return (
    <div className="relative overflow-hidden pb-20">
      <div className="container-ayb relative pt-[126px] md:pt-[158px]">
        <span
          className="pointer-events-none absolute -right-10 top-16 hidden select-none font-display text-[300px] leading-none text-[var(--ink)] opacity-[0.028] lg:block"
          aria-hidden
        >
          Բ
        </span>
        <span className="pointer-events-none absolute right-[4%] top-[116px] hidden h-40 w-40 rounded-full border border-[var(--line)] lg:block" aria-hidden />
        <span className="pointer-events-none absolute right-[16%] top-[248px] hidden h-1.5 w-1.5 rounded-full bg-[var(--accent)] opacity-70 lg:block" aria-hidden />

        <Reveal>
          <p className="eyebrow">The lexicon · Բառարան</p>
          <div className="mt-5 grid items-end gap-7 md:grid-cols-[1fr_auto]">
            <div>
              <h1 className="max-w-[720px] text-[42px] font-medium leading-[1.08] tracking-[-0.045em] text-[var(--ink)] md:text-[64px]">
                在词与词之间，
                <br />
                找到你的语言。
              </h1>
              <p className="mt-5 max-w-[510px] text-[12px] leading-[1.9] text-[var(--muted)]">
                亚美尼亚语、英语、俄语与中文互查。每个词条都带四语释义、转写、词性与原创例句。
              </p>

            </div>
            <div className="flex items-center gap-7 border-t border-[var(--line)] pt-5 text-[10px] text-[var(--faint)] md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <div>
                <p className="font-display text-[34px] leading-none text-[var(--ink)]">{orderedWords.length}</p>
                <p className="mt-2 tracking-[0.12em]">ENTRIES · 词条</p>
              </div>
              <div>
                <p className="font-display text-[34px] leading-none text-[var(--ink)]">
                  {dictionaryCategories.length}
                </p>
                <p className="mt-2 tracking-[0.12em]">THEMES · 主题</p>
              </div>
              <div>
                <p className="font-display text-[34px] leading-none text-[var(--ink)]">4</p>
                <p className="mt-2 tracking-[0.12em]">LANGUAGES</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10">
            <div className="glass-strong group relative flex items-center rounded-[22px] px-5 transition-shadow focus-within:shadow-[0_28px_70px_-28px_var(--glass-shadow),inset_0_1px_0_var(--glass-inset)] md:px-6">
              <Search
                size={18}
                strokeWidth={1.6}
                className="shrink-0 text-[var(--faint)] transition-colors group-focus-within:text-[var(--accent)]"
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="text"
                placeholder="搜索 հայերեն · barev · hello · вода · 水"
                aria-label="搜索词典"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                className="h-[62px] min-w-0 flex-1 bg-transparent px-4 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--faint)] md:h-[68px] md:text-[14px]"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
                  aria-label="清空搜索"
                >
                  <X size={14} />
                </button>
              ) : (
                <kbd className="hidden h-7 shrink-0 items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 font-mono text-[9px] text-[var(--faint)] sm:flex">
                  <CornerDownLeft size={10} />
                  /
                </kbd>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-[9px] tracking-[0.05em] text-[var(--faint)]">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
                东亚美尼亚语
              </span>
              <span>A1 — B1 常用词表</span>
              <span className="hidden sm:inline">学习型转写，重音通常在最后一个音节</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="hide-scrollbar -mx-5 mt-8 flex gap-1.5 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:gap-1.5 md:overflow-visible md:px-0" role="group" aria-label="按主题筛选">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[9px] font-medium transition-colors md:gap-2 md:px-3 md:text-[10px]",
                category === "all"
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                  : "border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]",
              )}
            >
              全部
              <span className={cn("text-[8px]", category === "all" ? "opacity-60" : "text-[var(--faint)]")}>
                {orderedWords.length}
              </span>
            </button>
            {dictionaryCategories.map((item) => {
              const active = category === item.id;
              const count = orderedWords.filter((word) => word.category === item.id).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(active ? "all" : item.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[9px] font-medium transition-all md:gap-2 md:px-3 md:text-[10px]",
                    active
                      ? "text-[var(--ink)]"
                      : "border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]",
                  )}
                  aria-pressed={active}
                  style={
                    active
                      ? {
                          borderColor: `color-mix(in srgb, ${item.accent} 55%, transparent)`,
                          background: `color-mix(in srgb, ${item.accent} 10%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: item.accent }}
                    aria-hidden
                  />
                  {item.label}
                  <span className={cn("text-[8px]", active ? "opacity-55" : "text-[var(--faint)]")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-5 flex items-center gap-3 border-t border-[var(--line)] pt-4">
            <span className="eyebrow hidden shrink-0 sm:block">字母 · Alphabet</span>
            <div className="hide-scrollbar flex flex-1 items-center gap-1 overflow-x-auto py-0.5">
              <button
                type="button"
                onClick={() => setLetter("all")}
                className={cn(
                  "h-7 shrink-0 rounded-md px-2 font-mono text-[9px] tracking-wide transition-colors",
                  letter === "all"
                    ? "bg-[var(--surface-2)] text-[var(--ink)]"
                    : "text-[var(--faint)] hover:bg-[var(--surface)] hover:text-[var(--ink)]",
                )}
              >
                ALL
              </button>
              {visibleAlphabet.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLetter(letter === item ? "all" : item)}
                  className={cn(
                    "grid h-7 min-w-7 shrink-0 place-items-center rounded-md px-1.5 font-arm text-[12px] transition-colors",
                    letter === item
                      ? "bg-[var(--accent)] text-[#fff8ef]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                  )}
                  aria-label={`只看 ${item} 开头的词`}
                  aria-pressed={letter === item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] text-[var(--faint)]">
              <BookOpen size={13} strokeWidth={1.7} />
            </span>
            <div>
              <p className="text-[11px] font-medium text-[var(--ink)]">
                {hasActiveFilters ? "筛选结果" : "全部词条"}
                <span className="ml-2 font-arm text-[12px] text-[var(--faint)]">
                  {filteredWords.length}
                </span>
              </p>
              <p className="mt-0.5 text-[9px] tracking-[0.04em] text-[var(--faint)]">
                {hasActiveFilters
                  ? [
                      query ? `“${query}”` : null,
                      category !== "all" ? categoryMap[category as CategoryId].label : null,
                      letter !== "all" ? `${letter} 开头` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "按亚美尼亚字母顺序排列"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line)] px-3 text-[9px] text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                <X size={11} />
                清空筛选
              </button>
            )}
            <button
              type="button"
              onClick={surpriseMe}
              className="inline-flex h-8 items-center gap-2 rounded-full border border-[var(--line)] px-3 text-[9px] text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
            >
              <Shuffle size={11} />
              随便看看
            </button>
          </div>
        </div>

        {shownWords.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {shownWords.map((word, index) => {
              const meta = categoryMap[word.category];
              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => setSelectedWord(word)}
                  className="surface-card word-fit-container group relative overflow-hidden rounded-[24px] p-5 text-left transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_var(--glass-shadow)] md:p-6"
                  aria-label={`查看词条 ${word.hy}`}
                >
                  <span
                    className="absolute left-0 top-6 h-8 w-[2px] rounded-r-full opacity-70 transition-all duration-300 group-hover:h-12 group-hover:opacity-100"
                    style={{ background: meta.accent }}
                    aria-hidden
                  />
                  <span className="absolute right-4 top-4 text-[8px] font-mono tracking-[0.08em] text-[var(--faint)] opacity-50">
                    {String(index + 1).padStart(3, "0")}
                  </span>

                  <div className="flex items-start justify-between gap-4 pr-7">
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-display tracking-[-0.015em] text-[var(--ink)]"
                        lang="hy"
                      >
                        <ArmenianWord text={word.hy} max={39} min={23} />
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] text-[var(--faint)]">
                        <span className="tracking-[0.05em]">{word.translit}</span>
                        <span className="h-[2px] w-[2px] rounded-full bg-[var(--faint)]" />
                        <span>{word.posLabel}</span>
                        <span className="h-[2px] w-[2px] rounded-full bg-[var(--faint)]" />
                        <span style={{ color: meta.accent }}>{meta.label}</span>
                      </div>
                      <Handwriting
                        text={word.hy}
                        className="mt-2"
                        textClassName="text-[22px] leading-[1.4]"
                        iconSize={11}
                      />
                    </div>
                    <span className="mt-1 rounded-full border border-[var(--line)] px-2 py-1 text-[8px] font-semibold tracking-[0.08em] text-[var(--faint)]">
                      {word.level}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-2 border-t border-[var(--line)] pt-4">
                    {[
                      { label: "中", value: word.zh, lang: "zh", primary: true },
                      { label: "EN", value: word.en, lang: "en", primary: false },
                      { label: "RU", value: word.ru, lang: "ru", primary: false },
                    ]
                      .filter((row) => row.value)
                      .map((row) => (
                        <div key={row.label} className="flex items-baseline gap-3">
                          <span className="w-5 shrink-0 text-[8px] font-semibold tracking-[0.1em] text-[var(--faint)]">
                            {row.label}
                          </span>
                          <span
                            className={cn(
                              "truncate",
                              row.primary
                                ? "text-[13px] font-medium text-[var(--ink)]"
                                : "text-[11px] text-[var(--muted)]",
                            )}
                            lang={row.lang}
                          >
                            {row.value}
                          </span>
                        </div>
                      ))}
                  </div>

                  {word.example ? (
                    <div className="mt-4 flex items-center gap-2.5 border-t border-[var(--line)] pt-3.5">
                      <Quote size={10} className="shrink-0 text-[var(--faint)]" />
                      <span className="truncate font-hand text-[16px] text-[var(--muted)]" lang="hy">
                        {word.example.hy}
                      </span>
                      <span className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--faint)] transition-all group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                        <ArrowUpRight size={10} />
                      </span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="glass-soft flex flex-col items-center justify-center rounded-[28px] px-6 py-20 text-center">
            <span className="font-hand text-[64px] leading-none text-[var(--accent)] opacity-80" lang="hy">
              Չգտնվեց
            </span>
            <p className="mt-5 text-[14px] font-medium text-[var(--ink)]">没有找到这个词。</p>
            <p className="mt-2 max-w-[320px] text-[11px] leading-relaxed text-[var(--faint)]">
              试试更短的关键词，或换一种语言：հայերեն、hello、вода、水。
            </p>

            <button type="button" onClick={clearFilters} className="btn btn-ghost mt-6 !min-h-10 !px-5">
              清空筛选
            </button>
          </div>
        )}

        {shownWords.length > 0 && filteredWords.length > shownWords.length && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="btn btn-ghost"
            >
              加载更多
              <span className="font-mono text-[9px] text-[var(--faint)]">
                {shownWords.length} / {filteredWords.length}
              </span>
            </button>
            <p className="text-[9px] tracking-[0.06em] text-[var(--faint)]">还有 {filteredWords.length - shownWords.length} 个词条</p>
          </div>
        )}

        <div className="mt-14 flex flex-col items-start justify-between gap-5 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center">
          <p className="max-w-[560px] text-[9px] leading-[1.8] text-[var(--faint)]">
            词表为 Ayb 学习词表，只保留适合学习的完整词条，已去除缩写、字母、屈折形式与生僻专名。
            释义参考英文维基词典与常用俄亚、英亚词典整理，例句为学习场景原创。
            建议在正式发布前由亚美尼亚语母语者复核。发音优先播放预生成的参考音，缺失时回退到浏览器语音合成。
          </p>
          <Link href="/grammar" className="arrow-link shrink-0">
            去读语法
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {selectedWord && (
          <motion.div
            className="fixed inset-0 z-[90] overflow-y-auto bg-[rgba(5,4,3,0.62)] p-3 backdrop-blur-md md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setSelectedWord(null)}
            role="presentation"
          >
            <div className="flex min-h-full items-center justify-center">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="word-dialog-title"
                initial={reducedMotion ? false : { opacity: 0, y: 26, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.99 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                className="modal-glass relative my-4 w-full max-w-[700px] overflow-hidden rounded-[30px]"
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="h-[3px] w-full"
                  style={{ background: categoryMap[selectedWord.category].accent }}
                />
                <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4 md:px-8">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: categoryMap[selectedWord.category].accent }}
                    />
                    <span className="eyebrow">
                      {categoryMap[selectedWord.category].hy} ·{" "}
                      {categoryMap[selectedWord.category].label}
                    </span>
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setSelectedWord(null)}
                    aria-label="关闭词条"
                    className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="word-fit-container px-6 pb-8 pt-6 md:px-8 md:pb-10">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[8px] font-semibold tracking-[0.1em] text-[var(--muted)]">
                      {selectedWord.level} · {levelLabels[selectedWord.level]}
                    </span>
                    <AudioButton text={selectedWord.hy} label="朗读词条" />
                  </div>

                  <h2
                    id="word-dialog-title"
                    className="mt-5 font-display tracking-[-0.01em] text-[var(--ink)]"
                    lang="hy"
                  >
                    <ArmenianWord text={selectedWord.hy} max={68} min={30} />
                  </h2>
                  <p className="mt-3 text-[11px] tracking-[0.05em] text-[var(--faint)]">
                    {selectedWord.translit}
                    <span className="mx-2 opacity-50">·</span>
                    {selectedWord.posLabel}
                  </p>
                  <Handwriting
                    text={selectedWord.hy}
                    className="mt-3"
                    textClassName="text-[32px] leading-[1.4]"
                    iconSize={15}
                  />

                  <div className="mt-7 grid gap-0 rounded-[16px] border border-[var(--line)] bg-[var(--surface)] px-5">
                    {[
                      { label: "中", value: selectedWord.zh, lang: "zh", primary: true },
                      { label: "EN", value: selectedWord.en, lang: "en", primary: false },
                      { label: "RU", value: selectedWord.ru, lang: "ru", primary: false },
                    ]
                      .filter((row) => row.value)
                      .map((row) => (
                      <div
                        key={row.label}
                        className="flex items-baseline gap-5 border-b border-[var(--line)] py-3.5 last:border-0"
                      >
                        <span className="w-5 shrink-0 text-[8px] font-semibold tracking-[0.12em] text-[var(--faint)]">
                          {row.label}
                        </span>
                        <span
                          className={cn(
                            row.primary
                              ? "text-[14px] font-medium text-[var(--ink)]"
                              : "text-[12px] text-[var(--muted)]",
                          )}
                          lang={row.lang}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedWord.example ? (
                  <div className="mt-6 rounded-[18px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-2)_42%,transparent)] p-5 md:p-6">
                    <div className="flex items-center justify-between">
                      <span className="eyebrow">例句 · In a sentence</span>
                      <AudioButton text={selectedWord.example.hy} label="朗读例句" size="sm" />
                    </div>
                    <p
                      className="mt-5 font-arm text-[21px] leading-[1.6] text-[var(--ink)] md:text-[24px]"
                      lang="hy"
                    >
                      {selectedWord.example.hy}
                    </p>
                    <Handwriting
                      text={selectedWord.example.hy}
                      className="mt-2"
                      textClassName="text-[23px] leading-[1.75]"
                      iconSize={12}
                    />
                    <p className="mt-2 text-[9px] italic tracking-[0.03em] text-[var(--faint)]">
                      {selectedWord.example.translit}
                    </p>
                    <div className="mt-4 space-y-1.5 border-l border-[var(--accent)] pl-4">
                      <p className="text-[11px] leading-relaxed text-[var(--muted)]">
                        {selectedWord.example.zh}
                      </p>
                      <p className="text-[10px] leading-relaxed text-[var(--faint)]" lang="en">
                        {selectedWord.example.en}
                      </p>
                      {selectedWord.example.ru ? (
                        <p className="text-[10px] leading-relaxed text-[var(--faint)]" lang="ru">
                          {selectedWord.example.ru}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  ) : null}

                  {selectedWord.note && (
                    <div className="mt-5 flex gap-3 rounded-[14px] border border-[var(--line)] p-4">
                      <Sparkles size={14} className="mt-0.5 shrink-0 text-[var(--apricot)]" />
                      <div>
                        <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--faint)]">
                          学习提示 · NOTE
                        </p>
                        <p className="mt-1.5 text-[11px] leading-[1.8] text-[var(--muted)]">
                          {selectedWord.note}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-7 flex flex-col items-start justify-between gap-4 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 text-[9px] text-[var(--faint)]">
                      <Hash size={10} />
                      {selectedWord.id}
                    </div>
                    <Link
                      href={`/review?word=${selectedWord.id}`}
                      className="btn btn-primary !min-h-10 !px-5"
                    >
                      在复习中练习
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
