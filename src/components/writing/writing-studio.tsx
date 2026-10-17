"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  AlertCircle,
  Check,
  Download,
  Eye,
  Feather,
  FilePlus2,
  Files,
  Loader2,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type WritingStatus = "draft" | "final";

type WritingDocument = {
  id: string;
  title: string;
  titleZh: string;
  body: string;
  translation: string;
  tags: string[];
  status: WritingStatus;
  createdAt: string;
  updatedAt: string;
};

type Fields = Pick<WritingDocument, "title" | "titleZh" | "body" | "translation" | "tags" | "status">;

type SaveState = "saved" | "dirty" | "saving" | "error";

const prompts = [
  {
    label: "从今天开始",
    text: "Այսօր ես ...",
    hint: "用一个简单的句子，记下今天的一件小事。",
  },
  {
    label: "给一个词写信",
    text: "Սիրելի բառ, ...",
    hint: "挑一个最近学会的词，假装你在给它写信。",
  },
  {
    label: "描述一张照片",
    text: "Այս նկարում ...",
    hint: "不追求完整，只写下你看见的颜色和声音。",
  },
];

function toFields(document: WritingDocument | null): Fields {
  if (!document) {
    return {
      title: "",
      titleZh: "",
      body: "",
      translation: "",
      tags: [],
      status: "draft",
    };
  }
  return {
    title: document.title,
    titleZh: document.titleZh,
    body: document.body,
    translation: document.translation,
    tags: document.tags,
    status: document.status,
  };
}

function countText(text: string) {
  const chars = Array.from(text.replace(/\s/g, "")).length;
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  return { chars, words };
}

function noteTitle(document: Pick<WritingDocument, "title"> | Fields) {
  return document.title.trim() || "无题";
}

function formatDate(iso: string) {
  return iso.slice(0, 10).replaceAll("-", ".");
}

function isBlank(fields: Fields) {
  return (
    !fields.title.trim() &&
    !fields.titleZh.trim() &&
    !fields.body.trim() &&
    !fields.translation.trim() &&
    fields.tags.length === 0
  );
}

export function WritingStudio({
  initialWritings,
  userName,
}: {
  initialWritings: WritingDocument[];
  userName: string;
}) {
  const initialDocument = initialWritings[0] ?? null;
  const [documents, setDocuments] = useState<WritingDocument[]>(initialWritings);
  const [activeId, setActiveId] = useState<string | null>(initialDocument?.id ?? null);
  const [fields, setFields] = useState<Fields>(() => toFields(initialDocument));
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formRef = useRef<Fields>(fields);
  const activeIdRef = useRef<string | null>(activeId);
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const saveChainRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const activeDocument = useMemo(
    () => documents.find((document) => document.id === activeId) ?? null,
    [activeId, documents],
  );

  const displayDocuments = useMemo(
    () =>
      documents.map((document) =>
        document.id === activeId ? { ...document, ...fields } : document,
      ),
    [activeId, documents, fields],
  );

  const stats = useMemo(() => {
    const totalChars = displayDocuments.reduce(
      (total, document) => total + countText(document.body).chars,
      0,
    );
    return {
      count: displayDocuments.length,
      finals: displayDocuments.filter((document) => document.status === "final").length,
      totalChars,
    };
  }, [displayDocuments]);

  const bodyCount = countText(fields.body);
  const isCurrentEmpty = isBlank(fields);
  const canFinalize = Boolean(fields.body.trim());

  const applyFields = useCallback((patch: Partial<Fields>) => {
    const next = { ...formRef.current, ...patch };
    formRef.current = next;
    setFields(next);
    revisionRef.current += 1;
    setRevision(revisionRef.current);
    setSaveState("dirty");
  }, []);

  const queueSave = useCallback(async (): Promise<boolean> => {
    const documentId = activeIdRef.current;
    if (!documentId) return true;

    const snapshot = { ...formRef.current, tags: [...formRef.current.tags] };
    const revisionAtStart = revisionRef.current;

    const run = saveChainRef.current.then(async () => {
      if (activeIdRef.current === documentId) setSaveState("saving");
      try {
        const response = await fetch(`/api/writings/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
        });
        const data = (await response.json().catch(() => ({}))) as {
          writing?: WritingDocument;
          error?: string;
        };
        if (!response.ok || !data.writing) {
          throw new Error(data.error ?? "文章保存失败。");
        }

        setDocuments((current) =>
          current
            .map((document) => (document.id === documentId ? data.writing! : document))
            .sort(
              (left, right) =>
                new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
            ),
        );

        if (activeIdRef.current === documentId) {
          savedRevisionRef.current = Math.max(savedRevisionRef.current, revisionAtStart);
          setError(null);
          setSaveState(revisionRef.current === revisionAtStart ? "saved" : "dirty");
        }
        return true;
      } catch (cause) {
        if (activeIdRef.current === documentId) {
          setSaveState("error");
          setError(cause instanceof Error ? cause.message : "文章保存失败。");
        }
        return false;
      }
    });

    saveChainRef.current = run;
    return run;
  }, []);

  useEffect(() => {
    if (revision === 0 || !activeId) return;
    const timer = window.setTimeout(() => {
      void queueSave();
    }, 1300);
    return () => window.clearTimeout(timer);
  }, [revision, activeId, queueSave]);

  useEffect(() => {
    if (mode !== "edit" || !bodyRef.current) return;
    const element = bodyRef.current;
    element.style.height = "auto";
    element.style.height = `${Math.max(340, element.scrollHeight)}px`;
  }, [fields.body, mode, activeId]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (revisionRef.current > savedRevisionRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    function handleSaveShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void queueSave();
      }
    }
    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [queueSave]);

  function loadDocument(document: WritingDocument) {
    activeIdRef.current = document.id;
    setActiveId(document.id);
    const next = toFields(document);
    formRef.current = next;
    setFields(next);
    revisionRef.current = 0;
    savedRevisionRef.current = 0;
    setRevision(0);
    setSaveState("saved");
    setError(null);
    setMode("edit");
    setTagInput("");
  }

  async function flushCurrent(): Promise<boolean> {
    if (!activeIdRef.current) return true;
    return queueSave();
  }

  async function chooseDocument(document: WritingDocument) {
    if (switching || creating || deleting || document.id === activeIdRef.current) return;
    setSwitching(true);
    const saved = await flushCurrent();
    if (saved) loadDocument(document);
    setSwitching(false);
  }

  async function createDocument(initialBody = "") {
    if (creating || switching || deleting) return;
    if (activeIdRef.current && isCurrentEmpty) {
      titleRef.current?.focus();
      return;
    }

    const saved = await flushCurrent();
    if (!saved) return;

    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/writings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "",
          titleZh: "",
          body: initialBody,
          translation: "",
          tags: [],
          status: "draft",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        writing?: WritingDocument;
        error?: string;
      };
      if (!response.ok || !data.writing) throw new Error(data.error ?? "新建文章失败。");

      setDocuments((current) => [data.writing!, ...current]);
      loadDocument(data.writing);
      window.setTimeout(() => titleRef.current?.focus(), 80);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "新建文章失败。");
    } finally {
      setCreating(false);
    }
  }

  async function deleteDocument() {
    if (!activeIdRef.current || deleting) return;
    const idToDelete = activeIdRef.current;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/writings/${idToDelete}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "删除文章失败。");

      const remaining = documents.filter((document) => document.id !== idToDelete);
      setDocuments(remaining);
      setConfirmDelete(false);

      if (remaining[0]) {
        loadDocument(remaining[0]);
      } else {
        activeIdRef.current = null;
        setActiveId(null);
        const empty = toFields(null);
        formRef.current = empty;
        setFields(empty);
        revisionRef.current = 0;
        savedRevisionRef.current = 0;
        setRevision(0);
        setSaveState("saved");
        setMode("edit");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "删除文章失败。");
    } finally {
      setDeleting(false);
    }
  }

  function changeStatus(status: WritingStatus) {
    if (status === "final" && !formRef.current.body.trim()) {
      setError("先写一点内容，再把文章标记为完成。");
      return;
    }
    setError(null);
    applyFields({ status });
  }

  function addTag() {
    const nextTag = tagInput.replace(/^#+/, "").trim();
    if (!nextTag) return;
    if (formRef.current.tags.includes(nextTag)) {
      setTagInput("");
      return;
    }
    if (formRef.current.tags.length >= 8) {
      setError("最多可以添加 8 个标签。");
      return;
    }
    applyFields({ tags: [...formRef.current.tags, nextTag] });
    setTagInput("");
  }

  function handleTagKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
    if (event.key === "Backspace" && !tagInput && formRef.current.tags.length > 0) {
      applyFields({ tags: formRef.current.tags.slice(0, -1) });
    }
  }

  function removeTag(tag: string) {
    applyFields({ tags: formRef.current.tags.filter((item) => item !== tag) });
  }

  function insertPrompt(text: string) {
    const current = formRef.current.body;
    const body = current.trim() ? `${current.replace(/\s+$/, "")}\n\n${text}` : text;
    applyFields({ body });
    setMode("edit");
  }

  function exportDocument() {
    if (!activeDocument) return;
    const lines = [
      fields.title.trim() || "无题",
      fields.titleZh.trim(),
      "",
      fields.body,
      fields.translation.trim() ? "\n\n---\n\n中文对照\n\n" + fields.translation : "",
    ];
    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(fields.title.trim() || "ayb-writing").replace(/[\\/:*?"<>|]/g, "-")}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const saveLabel =
    saveState === "saving"
      ? "正在保存…"
      : saveState === "dirty"
        ? "有未保存的修改"
        : saveState === "error"
          ? "保存失败"
          : "已保存";

  const showWorkspace = Boolean(activeId);

  return (
    <div className="pb-16">
      <div className="container-ayb pt-[108px] md:pt-[128px]">
        <header className="flex flex-col justify-between gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Grich · Գրիչ · Writing room</p>
            <h1 className="mt-4 text-[38px] font-medium leading-[1.08] tracking-[-0.045em] text-[var(--ink)] md:text-[52px]">
              把语言，
              <br className="sm:hidden" />
              写成自己的句子。
            </h1>
            <p className="mt-3 max-w-[520px] text-[11px] leading-[1.9] text-[var(--muted)]">
              {userName}，这里的每一篇都只属于你。没有字数目标，也没有读者打分。先写下一个简单的句子。
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-5 sm:flex">
              <div>
                <p className="text-[20px] leading-none text-[var(--ink)]">{stats.count}</p>
                <p className="mt-1.5 text-[8px] tracking-[0.08em] text-[var(--faint)]">篇文章</p>
              </div>
              <span className="h-8 w-[1px] bg-[var(--line)]" />
              <div>
                <p className="text-[20px] leading-none text-[var(--ink)]">{stats.finals}</p>
                <p className="mt-1.5 text-[8px] tracking-[0.08em] text-[var(--faint)]">已完成</p>
              </div>
              <span className="h-8 w-[1px] bg-[var(--line)]" />
              <div>
                <p className="text-[20px] leading-none text-[var(--ink)]">{stats.totalChars}</p>
                <p className="mt-1.5 text-[8px] tracking-[0.08em] text-[var(--faint)]">字符</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void createDocument()}
              disabled={creating || switching}
              className="btn btn-primary"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              新建文章
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] px-4 py-3 text-[10px] text-[var(--ink)]"
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
            {error}
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-[var(--faint)] hover:text-[var(--ink)]"
              aria-label="关闭提示"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {!showWorkspace ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <DocumentSidebar
                documents={displayDocuments}
                activeId={activeId}
                onSelect={chooseDocument}
                onCreate={() => void createDocument()}
                disabled={creating || switching}
              />
            </aside>
            <section className="surface-card relative flex min-h-[540px] flex-col items-center justify-center overflow-hidden rounded-[24px] px-6 text-center">
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
                style={{ background: "var(--accent)" }}
              />
              <span className="font-display text-[88px] leading-none text-[var(--accent)] opacity-70" lang="hy">
                Գ
              </span>
              <h2 className="mt-4 text-[26px] font-medium tracking-[-0.03em] text-[var(--ink)]">
                第一句话，不必完美。
              </h2>
              <p className="mt-3 max-w-[360px] text-[11px] leading-[1.9] text-[var(--muted)]">
                新建一篇草稿，用你认识的词写下一句话。写错也没关系，语言是在使用里慢慢长出来的。
              </p>
              <button
                type="button"
                onClick={() => void createDocument()}
                disabled={creating}
                className="btn btn-primary mt-7"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Feather size={14} />}
                {creating ? "正在准备…" : "新建第一篇"}
              </button>
              <div className="mt-9 grid max-w-[500px] gap-2 text-left sm:grid-cols-3">
                {prompts.map((prompt) => (
                  <button
                    key={prompt.label}
                    type="button"
                    onClick={() => void createDocument(prompt.text)}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 text-left transition-colors hover:border-[var(--line-strong)]"
                  >
                    <p className="font-arm text-[13px] text-[var(--ink)]" lang="hy">{prompt.text}</p>
                    <p className="mt-1 text-[9px] text-[var(--faint)]">{prompt.label}</p>
                    <p className="mt-1.5 text-[8px] leading-[1.6] text-[var(--faint)]">{prompt.hint}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <>
            <div className="hide-scrollbar mt-5 flex gap-2 overflow-x-auto lg:hidden">
              {displayDocuments.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => chooseDocument(document)}
                  disabled={switching}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-[9px] transition-colors",
                    document.id === activeId
                      ? "border-[var(--line-strong)] bg-[var(--surface-2)] text-[var(--ink)]"
                      : "border-[var(--line)] text-[var(--muted)]",
                  )}
                >
                  {noteTitle(document)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void createDocument()}
                disabled={creating}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-[var(--line-strong)] px-3 py-1.5 text-[9px] text-[var(--faint)]"
              >
                <Plus size={10} />
                新建
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <DocumentSidebar
                  documents={displayDocuments}
                  activeId={activeId}
                  onSelect={chooseDocument}
                  onCreate={() => void createDocument()}
                  disabled={creating || switching}
                />
              </aside>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        saveState === "error"
                          ? "bg-[var(--accent)]"
                          : saveState === "saved"
                            ? "bg-[var(--sage)]"
                            : "bg-[var(--apricot)]",
                      )}
                    />
                    <span className="text-[9px] text-[var(--faint)]">
                      {saveLabel}
                      {switching ? " · 正在切换" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex rounded-full border border-[var(--line)] bg-[var(--surface)] p-0.5">
                      <button
                        type="button"
                        onClick={() => setMode("edit")}
                        className={cn(
                          "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[9px] transition-colors",
                          mode === "edit"
                            ? "bg-[var(--ink)] text-[var(--paper)]"
                            : "text-[var(--faint)] hover:text-[var(--ink)]",
                        )}
                        aria-pressed={mode === "edit"}
                      >
                        <PencilLine size={10} />
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("preview")}
                        className={cn(
                          "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[9px] transition-colors",
                          mode === "preview"
                            ? "bg-[var(--ink)] text-[var(--paper)]"
                            : "text-[var(--faint)] hover:text-[var(--ink)]",
                        )}
                        aria-pressed={mode === "preview"}
                      >
                        <Eye size={10} />
                        预览
                      </button>
                    </div>

                    <span className="h-5 w-[1px] bg-[var(--line)]" />

                    <button
                      type="button"
                      onClick={exportDocument}
                      title="导出为文本"
                      aria-label="导出为文本"
                      className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] text-[var(--faint)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      title="删除文章"
                      aria-label="删除文章"
                      className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] text-[var(--faint)] transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:text-[var(--accent)]"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void queueSave()}
                      disabled={saveState === "saving"}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-3 text-[9px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)] disabled:opacity-55"
                    >
                      {saveState === "saving" ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                      保存
                    </button>
                  </div>
                </div>

                <div className="surface-card writing-paper mt-3 overflow-hidden rounded-[24px]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3 md:px-8">
                    <div className="flex items-center gap-3">
                      <span className="eyebrow">Private note · 私人文章</span>
                      <span className="text-[8px] text-[var(--faint)]">{formatDate(activeDocument?.createdAt ?? new Date().toISOString())}</span>
                    </div>
                    <div className="flex rounded-full border border-[var(--line)] p-0.5">
                      <button
                        type="button"
                        onClick={() => changeStatus("draft")}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[8px] transition-colors",
                          fields.status === "draft"
                            ? "bg-[var(--surface-2)] text-[var(--ink)]"
                            : "text-[var(--faint)] hover:text-[var(--ink)]",
                        )}
                      >
                        草稿
                      </button>
                      <button
                        type="button"
                        onClick={() => changeStatus("final")}
                        disabled={!canFinalize}
                        title={canFinalize ? "标记为完成" : "先写一点内容"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[8px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                          fields.status === "final"
                            ? "bg-[color-mix(in_srgb,var(--sage)_14%,transparent)] text-[var(--sage)]"
                            : "text-[var(--faint)] hover:text-[var(--ink)]",
                        )}
                      >
                        {fields.status === "final" && <Check size={9} />}
                        完成
                      </button>
                    </div>
                  </div>

                  {mode === "edit" ? (
                    <div>
                      <div className="px-5 pb-6 pt-7 md:px-10 md:pb-7 md:pt-9">
                        <input
                          ref={titleRef}
                          value={fields.title}
                          onChange={(event) => applyFields({ title: event.target.value })}
                          placeholder="无题"
                          aria-label="文章标题"
                          maxLength={160}
                          className="writing-font w-full bg-transparent text-[32px] leading-[1.2] tracking-[-0.025em] text-[var(--ink)] outline-none placeholder:text-[var(--faint)] md:text-[40px]"
                        />
                        <input
                          value={fields.titleZh}
                          onChange={(event) => applyFields({ titleZh: event.target.value })}
                          placeholder="中文标题 / 副标题（可选）"
                          aria-label="中文标题"
                          maxLength={160}
                          className="mt-3 w-full bg-transparent text-[11px] tracking-[0.02em] text-[var(--muted)] outline-none placeholder:text-[var(--faint)]"
                        />
                      </div>

                      <div className="border-t border-[var(--line)] px-5 py-7 md:px-10 md:py-8">
                        <textarea
                          ref={bodyRef}
                          value={fields.body}
                          onChange={(event) => applyFields({ body: event.target.value })}
                          placeholder={"从这里开始写下第一句。\n\n可以先用很简单的句子：Ես այսօր ..."}
                          aria-label="亚美尼亚语正文"
                          spellCheck={false}
                          maxLength={60_000}
                          className="writing-font min-h-[340px] w-full resize-none overflow-hidden bg-transparent text-[16px] leading-[2] tracking-[0.005em] text-[var(--ink)] outline-none placeholder:text-[var(--faint)] md:text-[17px]"
                        />
                      </div>

                      <div className="border-t border-[var(--line)] px-5 py-5 md:px-10">
                        <div className="flex items-center justify-between">
                          <p className="eyebrow">中文对照 · Optional</p>
                          <p className="text-[8px] text-[var(--faint)]">帮助未来的你想起这一段</p>
                        </div>
                        <textarea
                          value={fields.translation}
                          onChange={(event) => applyFields({ translation: event.target.value })}
                          placeholder="写下中文翻译，或只是记录当时的想法…"
                          aria-label="中文对照"
                          spellCheck={false}
                          maxLength={30_000}
                          rows={4}
                          className="mt-3 w-full resize-y bg-transparent text-[12px] leading-[1.9] text-[var(--muted)] outline-none placeholder:text-[var(--faint)]"
                        />
                      </div>

                      <div className="border-t border-[var(--line)] px-5 py-4 md:px-10">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[8px] font-semibold tracking-[0.08em] text-[var(--faint)]">标签</span>
                          {fields.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-[8px] text-[var(--muted)]"
                            >
                              #{tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                aria-label={`移除标签 ${tag}`}
                                className="text-[var(--faint)] hover:text-[var(--ink)]"
                              >
                                <X size={8} />
                              </button>
                            </span>
                          ))}
                          <input
                            value={tagInput}
                            onChange={(event) => setTagInput(event.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onBlur={addTag}
                            placeholder={fields.tags.length >= 8 ? "已达到标签上限" : "添加标签，按 Enter"}
                            aria-label="添加标签"
                            disabled={fields.tags.length >= 8}
                            maxLength={20}
                            className="min-w-[130px] flex-1 bg-transparent py-1 text-[9px] text-[var(--ink)] outline-none placeholder:text-[var(--faint)] disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3 md:px-10">
                        <p className="text-[8px] tracking-[0.06em] text-[var(--faint)]">
                          {bodyCount.words} 词 · {bodyCount.chars} 字符
                        </p>
                        <div className="flex items-center gap-4">
                          <p className="text-[8px] tracking-[0.04em] text-[var(--faint)]">
                            Ctrl / ⌘ + S 保存
                          </p>
                          <p className="text-[8px] tracking-[0.04em] text-[var(--faint)]">
                            仅自己可见
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <article className="writing-font px-5 py-8 md:px-12 md:py-12">
                      <header className="border-b border-[var(--line)] pb-6">
                        <p className="font-ui text-[9px] tracking-[0.08em] text-[var(--faint)]">
                          {fields.status === "final" ? "FINISHED NOTE" : "DRAFT"}
                        </p>
                        <h2 className="mt-4 text-[34px] leading-[1.25] tracking-[-0.025em] text-[var(--ink)] md:text-[42px]">
                          {fields.title.trim() || "无题"}
                        </h2>
                        {fields.titleZh.trim() && (
                          <p className="mt-2 font-ui text-[12px] text-[var(--muted)]">{fields.titleZh}</p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-2 font-ui text-[8px] text-[var(--faint)]">
                          <span>{formatDate(activeDocument?.createdAt ?? new Date().toISOString())}</span>
                          {fields.tags.map((tag) => (
                            <span key={tag} className="rounded-full border border-[var(--line)] px-2 py-0.5">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </header>
                      <div className="min-h-[280px] whitespace-pre-wrap py-8 text-[17px] leading-[2.1] text-[var(--ink)] md:text-[18px]">
                        {fields.body || <span className="text-[var(--faint)]">还没有写下正文。</span>}
                      </div>
                      {fields.translation.trim() && (
                        <div className="border-t border-[var(--line)] pt-6">
                          <p className="font-ui eyebrow">中文对照</p>
                          <p className="mt-3 whitespace-pre-wrap font-ui text-[11px] leading-[1.95] text-[var(--muted)]">
                            {fields.translation}
                          </p>
                        </div>
                      )}
                    </article>
                  )}
                </div>

                <p className="mt-3 text-[8px] leading-relaxed text-[var(--faint)]">
                  自动保存会在一段时间没有输入后运行。文章是私人的，不会出现在公开页面上。
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-[rgba(5,4,3,.62)] p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="surface-card w-full max-w-[420px] rounded-[22px] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_32%,transparent)] text-[var(--accent)]">
              <Trash2 size={16} />
            </span>
            <h2 id="delete-title" className="mt-4 text-[20px] font-medium tracking-[-0.02em] text-[var(--ink)]">
              删除这篇文章？
            </h2>
            <p className="mt-2 text-[10px] leading-[1.8] text-[var(--muted)]">
              「{noteTitle(fields)}」会从你的写作室永久删除，无法恢复。
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="btn btn-ghost !min-h-9 !px-4 !text-[10px]"
              >
                留着
              </button>
              <button
                type="button"
                onClick={deleteDocument}
                disabled={deleting}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-[10px] font-semibold text-[#fff8ef] transition-colors hover:bg-[var(--accent-2)] disabled:opacity-60"
              >
                {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                永久删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentSidebar({
  documents,
  activeId,
  onSelect,
  onCreate,
  disabled,
}: {
  documents: WritingDocument[];
  activeId: string | null;
  onSelect: (document: WritingDocument) => void;
  onCreate: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="surface-card overflow-hidden rounded-[22px] lg:sticky lg:top-[96px]">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Files size={12} className="text-[var(--faint)]" />
          <span className="text-[9px] font-semibold tracking-[0.1em] text-[var(--muted)]">WRITINGS</span>
        </div>
        <button
          type="button"
          onClick={onCreate}
          disabled={disabled}
          aria-label="新建文章"
          className="grid h-7 w-7 place-items-center rounded-full border border-[var(--line)] text-[var(--faint)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)] disabled:opacity-40"
        >
          <Plus size={12} />
        </button>
      </div>
      <div className="max-h-[480px] space-y-1 overflow-y-auto p-2">
        {documents.map((document) => {
          const chars = countText(document.body).chars;
          return (
            <button
              key={document.id}
              type="button"
              onClick={() => onSelect(document)}
              disabled={disabled}
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-60",
                document.id === activeId
                  ? "border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
                  : "border-transparent hover:border-[var(--line)] hover:bg-[var(--surface)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[8px] text-[var(--faint)]">
                  <span
                    className={cn(
                      "h-1 w-1 rounded-full",
                      document.status === "final" ? "bg-[var(--sage)]" : "bg-[var(--faint)]",
                    )}
                  />
                  {document.status === "final" ? "完成" : "草稿"} · {formatDate(document.updatedAt)}
                </span>
                {document.id === activeId && (
                  <span className="text-[8px] text-[var(--accent)]">正在编辑</span>
                )}
              </div>
              <p className="mt-1.5 truncate text-[11px] font-medium text-[var(--ink)]">
                {noteTitle(document)}
              </p>
              <p className="mt-1 text-[8px] text-[var(--faint)]">{chars} 字符</p>
            </button>
          );
        })}
        {documents.length === 0 && (
          <div className="px-3 py-8 text-center">
            <FilePlus2 size={16} className="mx-auto text-[var(--faint)]" />
            <p className="mt-2 text-[9px] text-[var(--faint)]">还没有文章</p>
          </div>
        )}
      </div>
      <div className="border-t border-[var(--line)] p-3">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
          <div className="flex items-center gap-1.5 text-[var(--apricot)]">
            <Sparkles size={11} />
            <p className="text-[8px] font-semibold tracking-[0.08em]">SMALL PROMPT</p>
          </div>
          <p className="mt-2 font-arm text-[13px] leading-[1.6] text-[var(--ink)]" lang="hy">
            Այսօր ես տեսա ...
          </p>
          <p className="mt-1.5 text-[9px] leading-[1.7] text-[var(--faint)]">
            今天，我看见了……
          </p>
        </div>
      </div>
    </div>
  );
}
