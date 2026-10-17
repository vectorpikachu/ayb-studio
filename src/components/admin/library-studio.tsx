"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Download, FileJson, Loader2, Plus, Trash2 } from "lucide-react";
import type { AdminContentSnapshot } from "@/lib/server/admin-content";
import type { ReadingText } from "@/data/reading/types";
import type { CultureEntry } from "@/data/culture/types";
import { cn } from "@/lib/utils";

type Kind = "reading" | "culture";

const readingTemplate: ReadingText = {
  id: "new-reading",
  order: 100,
  level: "A2",
  minutes: 10,
  title: "新课文",
  titleHy: "Նոր տեքստ",
  subtitle: "一句话说明这篇课文",
  description: "在管理员空间里编辑，然后保存。",
  kind: "original",
  paragraphs: [{ hy: "Այստեղ գրեք հայերեն տեքստը։", zh: "在这里写中文对照。" }],
  vocabulary: [{ hy: "բառ", translit: "barr", zh: "词" }],
  grammarPoints: [
    {
      title: "语法点",
      explanation: "解释这个语法点。",
      examples: [{ hy: "Օրինակ։", zh: "例子。" }],
    },
  ],
  takeaways: ["读完之后记住什么。"],
};

const cultureTemplate: CultureEntry = {
  id: "new-culture-entry",
  order: 100,
  category: "history",
  title: "新条目",
  titleHy: "Նոր նյութ",
  subtitle: "一句话说明",
  summary: "在管理员空间里编辑，然后保存。",
  sections: [
    {
      id: "section-1",
      heading: "第一节",
      paragraphs: ["在这里写正文。"],
    },
  ],
  facts: [{ label: "关键事实", value: "值" }],
  related: [],
};

type Snapshot = AdminContentSnapshot & { error?: string };

export function LibraryStudio({
  initial,
  adminName,
}: {
  initial: AdminContentSnapshot;
  adminName: string;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [kind, setKind] = useState<Kind>("reading");
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.readingTexts[0]?.id ?? null,
  );
  const [draft, setDraft] = useState(() =>
    initial.readingTexts[0] ? JSON.stringify(initial.readingTexts[0], null, 2) : "",
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const entries = kind === "reading" ? snapshot.readingTexts : snapshot.cultureEntries;
  const customIds = useMemo(
    () =>
      new Set(
        (kind === "reading" ? snapshot.customReadingTexts : snapshot.customCultureEntries).map(
          (entry) => entry.id,
        ),
      ),
    [kind, snapshot],
  );
  const baseIds = useMemo(
    () =>
      new Set(
        kind === "reading" ? snapshot.baseReadingIds : snapshot.baseCultureIds,
      ),
    [kind, snapshot],
  );

  function selectEntry(id: string) {
    const entry = entries.find((candidate) => candidate.id === id);
    if (!entry) return;
    setSelectedId(id);
    setDraft(JSON.stringify(entry, null, 2));
    setNotice(null);
    setError(null);
  }

  function switchKind(next: Kind) {
    if (next === kind) return;
    setKind(next);
    const list = next === "reading" ? snapshot.readingTexts : snapshot.cultureEntries;
    const first = list[0];
    setSelectedId(first?.id ?? null);
    setDraft(first ? JSON.stringify(first, null, 2) : "");
    setNotice(null);
    setError(null);
  }

  function newEntry() {
    const template = kind === "reading" ? readingTemplate : cultureTemplate;
    const stamp = Date.now().toString(36);
    setSelectedId(null);
    setDraft(
      JSON.stringify(
        {
          ...template,
          id: `${kind === "reading" ? "reading" : "culture"}-${stamp}`,
          order: 100 + entries.length,
        },
        null,
        2,
      ),
    );
    setNotice(null);
    setError(null);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const parsed = JSON.parse(draft) as ReadingText | CultureEntry;
      const response = await fetch(
        kind === "reading" ? "/api/admin/reading" : "/api/admin/culture",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            kind === "reading" ? { texts: [parsed] } : { entries: [parsed] },
          ),
        },
      );
      const data = (await response.json().catch(() => ({}))) as Snapshot;
      if (!response.ok) throw new Error(data.error ?? "保存失败。");
      setSnapshot(data);
      setSelectedId(parsed.id);
      setDraft(JSON.stringify(parsed, null, 2));
      setNotice("已保存。内置内容若使用相同 id，会被这条自定义内容覆盖。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selectedId || deleting || !customIds.has(selectedId)) return;
    setDeleting(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/admin/${kind === "reading" ? "reading" : "culture"}/${selectedId}`,
        { method: "DELETE" },
      );
      const data = (await response.json().catch(() => ({}))) as Snapshot;
      if (!response.ok) throw new Error(data.error ?? "删除失败。");
      setSnapshot(data);
      const list = kind === "reading" ? data.readingTexts : data.cultureEntries;
      const first = list[0];
      setSelectedId(first?.id ?? null);
      setDraft(first ? JSON.stringify(first, null, 2) : "");
      setNotice(
        baseIds.has(selectedId)
          ? "自定义覆盖已删除，内置内容已恢复。"
          : "自定义内容已删除。",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "删除失败。");
    } finally {
      setDeleting(false);
    }
  }

  function download() {
    const blob = new Blob([`${draft}\n`], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ayb-${kind}-${selectedId ?? "new"}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const selectedIsCustom = selectedId ? customIds.has(selectedId) : false;

  return (
    <div className="pb-16">
      <div className="container-ayb pt-[104px] md:pt-[124px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[9px] tracking-[0.04em] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft size={12} />
            返回词条与语法管理
          </Link>
          <span className="text-[9px] tracking-[0.05em] text-[var(--faint)]">
            管理员 · {adminName}
          </span>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-6 border-b border-[var(--line)] pb-8 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Library studio · Գրադարան</p>
            <h1 className="mt-4 text-[38px] font-medium leading-[1.08] tracking-[-0.045em] text-[var(--ink)] md:text-[52px]">
              课文与文化。
            </h1>
            <p className="mt-3 max-w-[600px] text-[11px] leading-[1.9] text-[var(--muted)]">
              编辑一篇课文或一个文化条目，保存后会立即出现在前台。内置内容可以被同 id 的自定义内容覆盖，删除覆盖即可恢复。
            </p>
          </div>
          <div className="grid grid-cols-4 gap-5 rounded-[16px] border border-[var(--line)] bg-[var(--elevated)] px-5 py-4">
            <Stat value={snapshot.counts.totalReadingTexts} label="课文" />
            <Stat value={snapshot.counts.customReadingTexts} label="课文自定义" />
            <Stat value={snapshot.counts.totalCultureEntries} label="文化" />
            <Stat value={snapshot.counts.customCultureEntries} label="文化自定义" />
          </div>
        </div>

        <div className="mt-6 flex gap-1.5">
          {(["reading", "culture"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchKind(item)}
              className={cn(
                "rounded-full px-4 py-2 text-[10px] font-medium transition-colors",
                kind === item
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]",
              )}
            >
              {item === "reading" ? "课文" : "文化"}
            </button>
          ))}
        </div>

        {notice && (
          <div role="status" className="mt-5 flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--sage)_35%,transparent)] bg-[color-mix(in_srgb,var(--sage)_6%,transparent)] px-4 py-3 text-[10px] text-[var(--ink)]">
            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[var(--sage)]" />
            {notice}
          </div>
        )}
        {error && (
          <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] px-4 py-3 text-[10px] text-[var(--ink)]">
            <AlertCircle size={13} className="mt-0.5 shrink-0 text-[var(--accent)]" />
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="surface-card overflow-hidden rounded-[22px]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3.5">
              <span className="text-[9px] font-semibold tracking-[0.1em] text-[var(--muted)]">
                {kind === "reading" ? "TEXTS" : "ENTRIES"}
              </span>
              <button
                type="button"
                onClick={newEntry}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-[8px] text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                <Plus size={10} />
                新建
              </button>
            </div>
            <div className="max-h-[560px] space-y-1 overflow-y-auto p-2">
              {entries.map((entry) => {
                const custom = customIds.has(entry.id);
                const active = entry.id === selectedId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => selectEntry(entry.id)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                      active
                        ? "border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
                        : "border-transparent hover:border-[var(--line)] hover:bg-[var(--surface)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[8px] text-[var(--faint)]">
                        {custom ? "自定义" : "内置"} · #{entry.order}
                      </span>
                      <span className="font-mono text-[8px] text-[var(--faint)]">
                        {kind === "reading"
                          ? `${(entry as ReadingText).level} · ${(entry as ReadingText).minutes}min`
                          : (entry as CultureEntry).category}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-[11px] font-medium text-[var(--ink)]">
                      {entry.title}
                    </p>
                    <p className="mt-0.5 truncate font-arm text-[10px] text-[var(--faint)]" lang="hy">
                      {entry.titleHy}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="surface-card overflow-hidden rounded-[22px]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileJson size={12} className="text-[var(--faint)]" />
                  <span className="text-[9px] font-semibold tracking-[0.08em] text-[var(--muted)]">
                    JSON EDITOR
                  </span>
                  {selectedId && (
                    <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-mono text-[8px] text-[var(--faint)]">
                      {selectedId}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={download}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-[8px] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    <Download size={10} />
                    下载
                  </button>
                  {selectedIsCustom && (
                    <button
                      type="button"
                      onClick={() => void remove()}
                      disabled={deleting}
                      className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] px-2.5 py-1 text-[8px] text-[var(--accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] disabled:opacity-50"
                    >
                      {deleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                      {baseIds.has(selectedId ?? "") ? "恢复内置" : "删除"}
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                spellCheck={false}
                className="hide-scrollbar min-h-[540px] w-full resize-y bg-transparent p-4 font-mono text-[11px] leading-[1.7] text-[var(--ink)] outline-none"
                aria-label={`${kind === "reading" ? "课文" : "文化条目"} JSON`}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-3">
                <p className="text-[8px] leading-[1.7] text-[var(--faint)]">
                  {kind === "reading"
                    ? "字段参考现有课文；保存后立即出现在 /reading。"
                    : "分类只能是 history / culture / people / geography。"}
                </p>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving || !draft.trim()}
                  className="btn btn-primary !min-h-9 !px-4 !text-[10px]"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : null}
                  {saving ? "保存中…" : "保存内容"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-[20px] leading-none text-[var(--ink)]">{value}</p>
      <p className="mt-1 text-[8px] text-[var(--faint)]">{label}</p>
    </div>
  );
}
