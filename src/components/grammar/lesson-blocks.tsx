import { Lightbulb } from "lucide-react";
import { AudioButton } from "@/components/audio-button";
import type { GrammarBlock, GrammarExample } from "@/data/grammar";
import { cn } from "@/lib/utils";

function ExampleCard({ example }: { example: GrammarExample }) {
  return (
    <div className="group relative overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--line-strong)] md:p-5">
      <span className="absolute inset-y-5 left-0 w-[2px] rounded-r-full bg-[var(--accent)] opacity-60" />
      <div className="flex items-start justify-between gap-4 pl-3">
        <p className="font-arm text-[20px] leading-[1.55] text-[var(--ink)] md:text-[23px]" lang="hy">
          {example.hy}
        </p>
        <div className="shrink-0">
          <AudioButton text={example.hy} label="朗读例句" size="sm" />
        </div>
      </div>
      <p className="mt-2 pl-3 text-[9px] italic tracking-[0.02em] text-[var(--faint)]">
        {example.translit}
      </p>
      <p className="mt-3 pl-3 text-[11px] leading-[1.8] text-[var(--muted)]">{example.zh}</p>
      {example.note && (
        <p className="mt-2 border-t border-[var(--line)] pl-3 pt-2 text-[9px] leading-[1.8] text-[var(--faint)]">
          {example.note}
        </p>
      )}
    </div>
  );
}

export function GrammarBlocks({ blocks }: { blocks: GrammarBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index} className="text-[13px] leading-[2.05] text-[var(--muted)]">
              {block.text}
            </p>
          );
        }

        if (block.type === "note") {
          return (
            <aside
              key={index}
              className="my-6 flex gap-3.5 rounded-[16px] border border-[color-mix(in_srgb,var(--apricot)_30%,transparent)] bg-[color-mix(in_srgb,var(--apricot)_6%,transparent)] p-4 md:p-5"
            >
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[color-mix(in_srgb,var(--apricot)_30%,transparent)] text-[var(--apricot)]">
                <Lightbulb size={13} strokeWidth={1.8} />
              </span>
              <div>
                {block.title && (
                  <p className="text-[10px] font-semibold tracking-[0.05em] text-[var(--ink)]">
                    {block.title}
                  </p>
                )}
                <p className={cn("text-[11px] leading-[1.9] text-[var(--muted)]", block.title && "mt-1.5")}>
                  {block.text}
                </p>
              </div>
            </aside>
          );
        }

        if (block.type === "examples") {
          return (
            <div key={index} className="my-6 space-y-2.5">
              {block.items.map((example) => (
                <ExampleCard key={example.hy} example={example} />
              ))}
            </div>
          );
        }

        if (block.type === "table") {
          return (
            <div key={index} className="my-6">
              {block.caption && <p className="eyebrow mb-2.5">{block.caption}</p>}
              <div className="hide-scrollbar overflow-x-auto rounded-[16px] border border-[var(--line)] bg-[var(--surface)]">
                <table className="w-full min-w-[540px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-2)_42%,transparent)]">
                      {block.headers.map((header) => (
                        <th
                          key={header}
                          className="whitespace-nowrap px-4 py-3 text-[8px] font-semibold tracking-[0.1em] text-[var(--faint)]"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-b border-[var(--line)] last:border-0 hover:bg-[color-mix(in_srgb,var(--surface-2)_28%,transparent)]"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className={cn(
                              "px-4 py-3 text-[11px] leading-[1.65]",
                              cellIndex === 0 ? "text-[var(--ink)]" : "text-[var(--muted)]",
                            )}
                          >
                            {cell || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={index} className="my-5 space-y-2.5 pl-1">
              {block.items.map((item, itemIndex) => (
                <li key={item} className="flex gap-3 text-[12px] leading-[1.85] text-[var(--muted)]">
                  <span className="mt-[2px] shrink-0 font-mono text-[9px] text-[var(--accent)]">
                    {block.ordered ? `${itemIndex + 1}.` : "—"}
                  </span>
                  {item}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "letters") {
          return (
            <div key={index} className="my-6 grid grid-cols-4 gap-1.5 sm:grid-cols-6 xl:grid-cols-8">
              {block.items.map((letter) => (
                <div
                  key={letter.upper}
                  className="group rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-2.5 text-center transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
                >
                  <p className="font-display text-[22px] leading-none text-[var(--ink)]" lang="hy">
                    {letter.upper}
                    <span className="ml-1 text-[17px] text-[var(--muted)]">{letter.lower}</span>
                  </p>
                  <p className="mt-2 truncate text-[8px] text-[var(--faint)]" lang="hy">
                    {letter.name}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[8px] text-[var(--faint)]">
                    {letter.sound}
                  </p>
                </div>
              ))}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
