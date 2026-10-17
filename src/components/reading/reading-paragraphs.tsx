"use client";

import { useState } from "react";
import { Languages, PencilLine, Type } from "lucide-react";
import { AudioButton } from "@/components/audio-button";
import type { ReadingParagraph } from "@/data/reading";
import { cn } from "@/lib/utils";

type ScriptMode = "print" | "hand";

export function ReadingParagraphs({ paragraphs }: { paragraphs: ReadingParagraph[] }) {
  const [script, setScript] = useState<ScriptMode>("print");
  const [showZh, setShowZh] = useState(true);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4 md:px-8">
        <span className="eyebrow">Text · Տեքստ</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex rounded-full border border-[var(--glass-edge)] bg-[var(--surface)] p-0.5 shadow-[inset_0_1px_0_var(--glass-inset)]">
            <button
              type="button"
              onClick={() => setScript("print")}
              aria-pressed={script === "print"}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[9px] transition-colors",
                script === "print"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--faint)] hover:text-[var(--ink)]",
              )}
            >
              <Type size={10} />
              印刷
            </button>
            <button
              type="button"
              onClick={() => setScript("hand")}
              aria-pressed={script === "hand"}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[9px] transition-colors",
                script === "hand"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--faint)] hover:text-[var(--ink)]",
              )}
            >
              <PencilLine size={10} />
              手写
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowZh((value) => !value)}
            aria-pressed={showZh}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[9px] transition-colors",
              showZh
                ? "border-[var(--line-strong)] bg-[var(--surface-2)] text-[var(--ink)]"
                : "border-[var(--glass-edge)] text-[var(--faint)] hover:text-[var(--ink)]",
            )}
          >
            <Languages size={10} />
            中文对照
          </button>
        </div>
      </div>

      <div className="px-5 py-6 md:px-8 md:py-8">
        <div className="space-y-8">
          {paragraphs.map((paragraph, index) => (
            <div key={paragraph.hy}>
              <div className="flex items-start justify-between gap-3">
                <p
                  className={cn(
                    "min-w-0 flex-1 text-[var(--ink)]",
                    script === "hand"
                      ? "font-hand text-[25px] leading-[2] md:text-[28px]"
                      : "font-arm text-[22px] leading-[1.85] md:text-[25px]",
                  )}
                  lang="hy"
                >
                  {paragraph.hy}
                </p>
                <div className="mt-1 shrink-0">
                  <AudioButton text={paragraph.hy} label={`朗读第 ${index + 1} 段`} size="sm" />
                </div>
              </div>
              {paragraph.modernHy && (
                <div className="mt-3 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3">
                  <p className="text-[8px] font-semibold tracking-[0.14em] text-[var(--faint)]">
                    MODERN · 现代亚美尼亚语
                  </p>
                  <p className="mt-1.5 font-arm text-[15px] leading-[1.75] text-[var(--muted)]" lang="hy">
                    {paragraph.modernHy}
                  </p>
                </div>
              )}
              {showZh && (
                <p className="mt-2.5 border-l border-[var(--accent)] pl-3.5 text-[11px] leading-[1.9] text-[var(--muted)]">
                  {paragraph.zh}
                </p>
              )}
              {paragraph.note && (
                <p className="mt-2 pl-3.5 text-[9px] leading-[1.8] text-[var(--faint)]">
                  {paragraph.note}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-8 border-t border-[var(--line)] pt-4 text-[9px] leading-[1.8] text-[var(--faint)]">
          手写模式使用 Poqrik dzeragir 连笔字体；它和印刷体差别较大，适合练习辨认。朗读由浏览器语音合成提供。
        </p>
      </div>
    </div>
  );
}
