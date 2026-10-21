import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";

type Mode = "login" | "register";

const copy = {
  login: {
    eyebrow: "MEMBER ROOM · ՀԱՆԴԻՊՈՒՄ",
    word: "Բարև",
    title: "继续你与语言的\n约定。",
    description: "欢迎回来。今天的词还在等你，进度也还留在原来的地方。",
    quote: "Լեզուն սկսվում է տառից։",
    quoteZh: "语言，从一个字母开始。",
    index: "Ա",
    notes: ["每条词都带四语释义与例句", "按自己的节奏复习与阅读", "所有文章留在私人写作室"],
  },
  register: {
    eyebrow: "NEW MEMBER · ՆՈՐ ԱՆԴԱՄ",
    word: "Սկիզբ",
    title: "给语言，\n一个属于你的角落。",
    description: "注册后，你的复习节奏、语法进度与文章，都会安静地留在这里。",
    quote: "Ամեն բառ մի նոր աշխարհ է։",
    quoteZh: "每一个词，都是一个新世界。",
    index: "Բ",
    notes: ["一次注册，保存全部进度", "英语、俄语与中文释义", "没有排名，也没有催促"],
  },
} as const;

export function AuthPageShell({ mode, children }: { mode: Mode; children: ReactNode }) {
  const content = copy[mode];

  return (
    <div className="container-ayb pb-10 pt-[104px] md:pb-14 md:pt-[132px]">
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[9px] font-medium tracking-[0.06em] text-[var(--faint)] transition-colors hover:text-[var(--ink)]"
        >
          <ArrowLeft size={12} />
          回到 Ayb
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[8px] tracking-[0.08em] text-[var(--faint)]">
          <LockKeyhole size={9} />
          PRIVATE SPACE · 本地优先
        </span>
      </div>

      <div className="glass-strong grid overflow-hidden rounded-[36px] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden min-h-[640px] overflow-hidden border-r border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_55%,transparent)] p-10 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div
              className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full opacity-40 blur-[80px]"
              style={{ background: "color-mix(in srgb, var(--accent) 30%, transparent)" }}
            />
            <div
              className="absolute -bottom-32 -right-20 h-[380px] w-[380px] rounded-full opacity-30 blur-[80px]"
              style={{ background: "color-mix(in srgb, var(--apricot) 34%, transparent)" }}
            />
            <div className="absolute right-9 top-10 h-[330px] w-[330px] rounded-full border border-[var(--line)]" />
            <div className="absolute right-[68px] top-[70px] h-[230px] w-[230px] rounded-full border border-dashed border-[var(--line)]" />
            <span className="absolute right-8 top-1/2 -translate-y-1/2 select-none font-display text-[260px] leading-none text-[var(--ink)] opacity-[0.035]">
              {content.index}
            </span>
            <span className="absolute left-[16%] top-[24%] h-2 w-2 rounded-full bg-[var(--accent)] opacity-70" />
            <span className="absolute bottom-[28%] right-[10%] h-1.5 w-1.5 rounded-full bg-[var(--apricot)] opacity-70" />
          </div>

          <div className="relative z-10">
            <p className="eyebrow">{content.eyebrow}</p>
            <p className="mt-14 select-none font-hand text-[96px] leading-none tracking-[-0.01em] text-[var(--accent)] xl:text-[116px]" lang="hy">
              {content.word}
            </p>
            <h2 className="mt-10 max-w-[360px] whitespace-pre-line text-[27px] font-medium leading-[1.3] tracking-[-0.035em] text-[var(--ink)]">
              {content.title}
            </h2>
            <p className="mt-4 max-w-[300px] text-[11px] leading-[1.9] text-[var(--muted)]">
              {content.description}
            </p>
            <div className="mt-8 grid max-w-[300px] gap-2.5 border-t border-[var(--line)] pt-5">
              {content.notes.map((note, index) => (
                <div key={note} className="flex items-baseline gap-3">
                  <span className="font-mono text-[8px] text-[var(--faint)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] leading-relaxed text-[var(--muted)]">{note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 border-t border-[var(--line)] pt-5">
            <p className="font-hand max-w-[300px] text-[24px] leading-[1.5] text-[var(--ink)]" lang="hy">
              {content.quote}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[9px] tracking-[0.04em] text-[var(--faint)]">{content.quoteZh}</p>
              <p className="text-[8px] tracking-[0.14em] text-[var(--faint)]">AYB · 2026</p>
            </div>
          </div>
        </aside>

        <main className="relative px-6 py-10 sm:px-10 sm:py-12 xl:px-16 xl:py-16">
          <div className="mx-auto w-full max-w-[430px]">
            <p className="mb-8 font-display text-[24px] leading-none text-[var(--accent)] lg:hidden" lang="hy">
              {content.word}
            </p>
            {children}
          </div>
        </main>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 px-1 text-[8px] tracking-[0.05em] text-[var(--faint)]">
        <span>AYB — A SMALL STUDIO FOR ARMENIAN.</span>
        <span>词 · 语法 · 写作 · 复习</span>
      </div>
    </div>
  );
}
