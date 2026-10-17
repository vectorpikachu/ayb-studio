"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Download,
  FileJson,
  GraduationCap,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  categoryMap,
  levelLabels,
  posLabels,
  type DictionaryWord,
} from "@/data/dictionary";
import type { GrammarLesson } from "@/data/grammar";
import { cn } from "@/lib/utils";

type AdminSnapshot = {
  customWords: DictionaryWord[];
  customLessons: GrammarLesson[];
  baseWordIds: string[];
  baseLessonIds: string[];
  counts: {
    customWords: number;
    customLessons: number;
    totalWords: number;
    totalLessons: number;
  };
};

type Tab = "words" | "lessons";
type DeleteTarget = { tab: Tab; id: string; label: string; override: boolean } | null;

export function AdminContentStudio({
  initial,
  adminName,
  welcome = false,
}: {
  initial: AdminSnapshot;
  adminName: string;
  welcome?: boolean;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [showWelcome, setShowWelcome] = useState(welcome);
  const [tab, setTab] = useState<Tab>("words");
  const [rawFile, setRawFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseWordIds = new Set(snapshot.baseWordIds);
  const baseLessonIds = new Set(snapshot.baseLessonIds);

  function resetUpload() {
    setRawFile(null);
    setFileName(null);
    setPendingCount(null);
    setError(null);
    setNotice(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function switchTab(next: Tab) {
    if (next === tab) return;
    setTab(next);
    resetUpload();
  }

  async function acceptFile(file: File | undefined) {
    if (!file) return;
    resetUpload();
    if (file.size > 2_000_000) {
      setError("文件不能超过 2MB。");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".json")) {
      setError("请上传 .json 文件。");
      return;
    }

    setReading(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" && parsed !== null
          ? (parsed as Record<string, unknown>)[tab === "words" ? "words" : "lessons"]
          : null;
      if (!Array.isArray(list)) {
        throw new Error(
          tab === "words"
            ? "文件需要是词条数组，或包含 words 数组的对象。"
            : "文件需要是课程数组，或包含 lessons 数组的对象。",
        );
      }
      if (list.length === 0) throw new Error("文件中没有可导入的内容。");
      setRawFile(text);
      setFileName(file.name);
      setPendingCount(list.length);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法读取这个文件。");
    } finally {
      setReading(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void acceptFile(event.dataTransfer.files[0]);
  }

  async function upload() {
    if (!rawFile || uploading) return;
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/${tab === "words" ? "words" : "lessons"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: rawFile,
      });
      const data = (await response.json().catch(() => ({}))) as AdminSnapshot & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "导入失败。");
      setSnapshot(data);
      setNotice(
        tab === "words"
          ? `已保存 ${pendingCount} 个词条。词典现在共有 ${data.counts.totalWords} 个词。`
          : `已保存 ${pendingCount} 节课。语法地图现在共有 ${data.counts.totalLessons} 节课。`,
      );
      setRawFile(null);
      setFileName(null);
      setPendingCount(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "导入失败。");
    } finally {
      setUploading(false);
    }
  }

  async function removeCustomContent() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setError(null);
    setNotice(null);
    try {
      const endpoint =
        deleteTarget.tab === "words"
          ? `/api/admin/words/${deleteTarget.id}`
          : `/api/admin/lessons/${deleteTarget.id}`;
      const response = await fetch(endpoint, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as AdminSnapshot & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "删除失败。");
      setSnapshot(data);
      setDeleteTarget(null);
      setNotice(
        deleteTarget.override
          ? "自定义覆盖已移除，原来的内置内容已恢复。"
          : "自定义内容已删除。",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "删除失败。");
    } finally {
      setDeleting(false);
    }
  }

  function downloadCurrent() {
    const data =
      tab === "words" ? { words: snapshot.customWords } : { lessons: snapshot.customLessons };
    const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ayb-${tab}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const currentCount = tab === "words" ? snapshot.customWords.length : snapshot.customLessons.length;
  const customItems = tab === "words" ? snapshot.customWords : snapshot.customLessons;

  return (
    <div className="pb-16">
      <div className="container-ayb pt-[104px] md:pt-[124px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[9px] tracking-[0.04em] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft size={12} />
            回到学习室
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1.5 text-[9px] tracking-[0.05em] text-[var(--muted)]">
            <ShieldCheck size={11} className="text-[var(--sage)]" />
            管理员空间 · {adminName}
          </span>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-7 border-b border-[var(--line)] pb-8 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Content studio · Բովանդակություն</p>
            <h1 className="mt-4 text-[38px] font-medium leading-[1.08] tracking-[-0.045em] text-[var(--ink)] md:text-[52px]">
              内容管理。
            </h1>
            <p className="mt-3 max-w-[560px] text-[11px] leading-[1.9] text-[var(--muted)]">
              上传词典词条或语法课程。内容会即时进入这个实例的词典、复习与语法页面。
              上传具有覆盖性：使用相同的 id，可以替换内置内容。
            </p>
          </div>
          <div className="grid grid-cols-4 gap-5 rounded-[16px] border border-[var(--line)] bg-[var(--elevated)] px-5 py-4">
            <Stat value={snapshot.counts.totalWords} label="词条" />
            <Stat value={snapshot.counts.customWords} label="自定义" />
            <Stat value={snapshot.counts.totalLessons} label="语法课" />
            <Stat value={snapshot.counts.customLessons} label="自定义" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link href="/admin/library" className="btn btn-ghost !min-h-9 !px-4 !text-[10px]">
            课文与文化库
            <ArrowUpRight size={12} />
          </Link>
          <p className="text-[9px] text-[var(--faint)]">
            在另一个编辑器中增删改课文、历史、文化、人物与地理条目。
          </p>
        </div>

        {showWelcome && (
          <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-[color-mix(in_srgb,var(--sage)_32%,transparent)] bg-[color-mix(in_srgb,var(--sage)_7%,transparent)] px-4 py-3.5">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[var(--sage)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-[var(--ink)]">
                你已经是这个实例的管理员。
              </p>
              <p className="mt-1 text-[10px] leading-[1.8] text-[var(--muted)]">
                先下载模板，或直接把 JSON 拖进下面的上传区。内容会立即出现在词典、复习与语法页面；相同的 id 会覆盖内置内容。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              aria-label="关闭管理员提示"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--faint)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2">
          <TabButton active={tab === "words"} onClick={() => switchTab("words")} icon={BookOpen}>
            词典词条
          </TabButton>
          <TabButton
            active={tab === "lessons"}
            onClick={() => switchTab("lessons")}
            icon={GraduationCap}
          >
            语法课程
          </TabButton>
        </div>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0">
            <section className="surface-card overflow-hidden rounded-[22px]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4 md:px-6">
                <div>
                  <p className="text-[12px] font-medium text-[var(--ink)]">
                    {tab === "words" ? "上传词典 JSON" : "上传语法 JSON"}
                  </p>
                  <p className="mt-1 text-[9px] text-[var(--faint)]">
                    {tab === "words"
                      ? "1–500 个词条，单个 id 相同即覆盖。"
                      : "1–50 节课，每节课至少包含 1 道测验题。"}
                  </p>
                </div>
                <a
                  href={tab === "words" ? "/templates/word-upload.json" : "/templates/lesson-upload.json"}
                  download
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line)] px-3 text-[9px] text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                >
                  <Download size={11} />
                  下载模板
                </a>
              </div>

              <div className="p-4 md:p-6">
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "relative flex min-h-[170px] flex-col items-center justify-center rounded-[16px] border border-dashed px-5 py-8 text-center transition-colors",
                    dragging
                      ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
                      : "border-[var(--line-strong)] bg-[var(--surface)]",
                  )}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={(event) => void acceptFile(event.target.files?.[0])}
                    className="sr-only"
                    id="admin-json-upload"
                  />
                  {reading ? (
                    <Loader2 size={22} className="animate-spin text-[var(--faint)]" />
                  ) : rawFile ? (
                    <>
                      <FileJson size={24} className="text-[var(--sage)]" />
                      <p className="mt-3 max-w-full truncate text-[11px] font-medium text-[var(--ink)]">
                        {fileName}
                      </p>
                      <p className="mt-1 text-[9px] text-[var(--faint)]">
                        检测到 {pendingCount} 条内容，等待导入
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={upload}
                          disabled={uploading}
                          className="btn btn-primary !min-h-9 !px-4 !text-[10px]"
                        >
                          {uploading ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                          {uploading ? "正在导入…" : "确认导入"}
                        </button>
                        <button
                          type="button"
                          onClick={resetUpload}
                          disabled={uploading}
                          className="btn btn-ghost !min-h-9 !px-3 !text-[10px]"
                        >
                          取消
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={24} className="text-[var(--faint)]" />
                      <p className="mt-3 text-[11px] font-medium text-[var(--ink)]">
                        把 JSON 文件拖到这里
                      </p>
                      <p className="mt-1 text-[9px] text-[var(--faint)]">
                        或选择一个 2MB 以内的 .json 文件
                      </p>
                      <label
                        htmlFor="admin-json-upload"
                        className="mt-4 inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-[var(--line-strong)] px-4 text-[10px] text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        <FileJson size={12} />
                        选择文件
                      </label>
                    </>
                  )}
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] px-4 py-3 text-[10px] leading-relaxed text-[var(--ink)]"
                  >
                    <AlertCircle size={13} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                    <span className="min-w-0 flex-1">{error}</span>
                    <button type="button" onClick={() => setError(null)} aria-label="关闭错误">
                      <X size={11} className="text-[var(--faint)]" />
                    </button>
                  </div>
                )}
                {notice && (
                  <div
                    role="status"
                    className="mt-4 flex items-start gap-2 rounded-xl border border-[color-mix(in_srgb,var(--sage)_35%,transparent)] bg-[color-mix(in_srgb,var(--sage)_6%,transparent)] px-4 py-3 text-[10px] leading-relaxed text-[var(--ink)]"
                  >
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[var(--sage)]" />
                    <span className="min-w-0 flex-1">{notice}</span>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
                <div>
                  <p className="text-[11px] font-medium text-[var(--ink)]">当前自定义内容</p>
                  <p className="mt-1 text-[9px] text-[var(--faint)]">
                    {currentCount} 条 · 相同 id 覆盖内置内容
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadCurrent}
                    disabled={currentCount === 0}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line)] px-3 text-[9px] text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download size={11} />
                    导出当前内容
                  </button>
                  <Link
                    href={tab === "words" ? "/dictionary" : "/grammar"}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--line)] px-3 text-[9px] text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                  >
                    查看页面
                    <ArrowUpRight size={11} />
                  </Link>
                </div>
              </div>

              {customItems.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[var(--line-strong)] px-5 py-16 text-center">
                  <Sparkles size={18} className="mx-auto text-[var(--faint)]" />
                  <p className="mt-3 text-[11px] text-[var(--muted)]">还没有自定义内容。</p>
                  <p className="mt-1 text-[9px] text-[var(--faint)]">
                    下载上面的模板，修改后上传，就可以看到它出现在公开页面里。
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {tab === "words"
                    ? snapshot.customWords.map((word) => (
                        <WordRow
                          key={word.id}
                          word={word}
                          override={baseWordIds.has(word.id)}
                          onDelete={() =>
                            setDeleteTarget({
                              tab: "words",
                              id: word.id,
                              label: word.hy,
                              override: baseWordIds.has(word.id),
                            })
                          }
                        />
                      ))
                    : snapshot.customLessons.map((lesson) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          override={baseLessonIds.has(lesson.id)}
                          onDelete={() =>
                            setDeleteTarget({
                              tab: "lessons",
                              id: lesson.id,
                              label: lesson.title,
                              override: baseLessonIds.has(lesson.id),
                            })
                          }
                        />
                      ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-3 lg:sticky lg:top-[96px]">
            <div className="rounded-[20px] border border-[var(--line)] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-[var(--sage)]" />
                <p className="eyebrow">Permissions</p>
              </div>
              <p className="mt-3 text-[10px] leading-[1.8] text-[var(--muted)]">
                只有管理员可以上传或删除内容。生产环境中，首个注册账户会成为管理员；
                如果数据库里已有用户但没有管理员，最早的用户会被提升为管理员。
              </p>
            </div>

            <div className="rounded-[20px] border border-[var(--line)] p-5">
              <p className="eyebrow">词典 JSON</p>
              <p className="mt-3 text-[10px] leading-[1.8] text-[var(--muted)]">
                顶层可以为数组，或包含 <code className="text-[var(--ink)]">words</code> 的对象。
                必备字段：id、hy、translit、pos、level、category、en、ru、zh、example。
              </p>
              <p className="mt-3 text-[9px] leading-[1.7] text-[var(--faint)]">
                可选字段：note。词条会出现在词典搜索与复习队列中。
              </p>
            </div>

            <div className="rounded-[20px] border border-[var(--line)] p-5">
              <p className="eyebrow">语法 JSON</p>
              <p className="mt-3 text-[10px] leading-[1.8] text-[var(--muted)]">
                顶层可以为数组，或包含 <code className="text-[var(--ink)]">lessons</code> 的对象。
                每节课包含 sections、blocks、takeaways 与至少一道 quiz。
              </p>
              <p className="mt-3 text-[9px] leading-[1.7] text-[var(--faint)]">
                支持的 block：paragraph、note、examples、table、list、letters。
                下载模板可以看到完整结构。
              </p>
            </div>

            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-5">
              <p className="eyebrow">数据范围 · Scope</p>
              <p className="mt-3 text-[9px] leading-[1.8] text-[var(--faint)]">
                上传写入当前安装实例的本地数据库，会立即对所有账户生效。
                打包成桌面应用后，每个安装拥有自己的数据；若要让所有用户同步收到内容，需要另外部署云端内容服务。
              </p>
            </div>
          </aside>
        </div>
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-[rgba(5,4,3,.55)] p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-delete-title"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="surface-card w-full max-w-[420px] rounded-[22px] p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_32%,transparent)] text-[var(--accent)]">
              <Trash2 size={16} />
            </span>
            <h2 id="admin-delete-title" className="mt-4 text-[20px] font-medium text-[var(--ink)]">
              {deleteTarget.override ? "移除这条覆盖？" : "删除自定义内容？"}
            </h2>
            <p className="mt-2 text-[10px] leading-[1.8] text-[var(--muted)]">
              「{deleteTarget.label}」{deleteTarget.override ? "将恢复为原有的内置内容。" : "会从当前实例中删除。"}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="btn btn-ghost !min-h-9 !px-4 !text-[10px]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={removeCustomContent}
                disabled={deleting}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-[10px] font-semibold text-[#fff8ef] disabled:opacity-60"
              >
                {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-[44px]">
      <p className="text-[19px] leading-none text-[var(--ink)]">{value}</p>
      <p className="mt-1.5 text-[8px] tracking-[0.06em] text-[var(--faint)]">{label}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof BookOpen;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[10px] transition-colors",
        active
          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
          : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]",
      )}
      aria-pressed={active}
    >
      <Icon size={12} />
      {children}
    </button>
  );
}

function WordRow({
  word,
  override,
  onDelete,
}: {
  word: DictionaryWord;
  override: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="surface-card flex items-start justify-between gap-4 rounded-[16px] p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-arm text-[22px] leading-none text-[var(--ink)]" lang="hy">
            {word.hy}
          </p>
          <span className="text-[9px] text-[var(--faint)]">{word.translit}</span>
          {override ? (
            <span className="rounded-full border border-[color-mix(in_srgb,var(--apricot)_35%,transparent)] px-2 py-0.5 text-[8px] text-[var(--apricot)]">
              覆盖内置
            </span>
          ) : (
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[8px] text-[var(--faint)]">
              自定义
            </span>
          )}
        </div>
        <p className="mt-1.5 truncate text-[10px] text-[var(--muted)]">
          {word.zh} · {word.en} · {word.ru}
        </p>
        <p className="mt-1 text-[8px] tracking-[0.04em] text-[var(--faint)]">
          {word.id} · {categoryMap[word.category].label} · {posLabels[word.pos]} ·{" "}
          {levelLabels[word.level]}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`删除词条 ${word.hy}`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--faint)] transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:text-[var(--accent)]"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function LessonRow({
  lesson,
  override,
  onDelete,
}: {
  lesson: GrammarLesson;
  override: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="surface-card flex items-start justify-between gap-4 rounded-[16px] p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-[13px] font-medium text-[var(--ink)]">{lesson.title}</p>
          <span className="font-arm text-[10px] text-[var(--faint)]" lang="hy">
            {lesson.titleHy}
          </span>
          {override ? (
            <span className="rounded-full border border-[color-mix(in_srgb,var(--apricot)_35%,transparent)] px-2 py-0.5 text-[8px] text-[var(--apricot)]">
              覆盖内置
            </span>
          ) : (
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[8px] text-[var(--faint)]">
              自定义
            </span>
          )}
        </div>
        <p className="mt-1.5 truncate text-[9px] text-[var(--muted)]">
          {lesson.subtitle}
        </p>
        <p className="mt-1 text-[8px] tracking-[0.04em] text-[var(--faint)]">
          {lesson.id} · {lesson.level} · #{lesson.order} · {lesson.quiz.length} 题
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`删除课程 ${lesson.title}`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--faint)] transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:text-[var(--accent)]"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
