import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Cloud,
  Feather,
  LockKeyhole,
  PenLine,
  Quote,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/reveal";

const traits = [
  {
    icon: Cloud,
    title: "自动保存",
    body: "停下来喝一口茶的工夫，文字已经被安静地保存。",
  },
  {
    icon: PenLine,
    title: "中文对照",
    body: "为亚美尼亚语正文补一段中文，让未来的自己还能读懂当时的心情。",
  },
  {
    icon: LockKeyhole,
    title: "私人空间",
    body: "文章只属于你。没有公开主页，也没有陌生人的评分。",
  },
];

export function WriteGuest() {
  return (
    <div className="overflow-hidden pb-16">
      <section className="container-ayb relative pb-10 pt-[120px] md:pt-[150px]">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <Reveal>
            <p className="eyebrow">Grich · Գրիչ · Writing room</p>
            <h1 className="mt-5 max-w-[580px] text-[42px] font-medium leading-[1.06] tracking-[-0.05em] text-[var(--ink)] md:text-[62px]">
              把学过的语言，
              <br />
              写进自己的句子。
            </h1>
            <p className="mt-6 max-w-[470px] text-[12px] leading-[1.95] text-[var(--muted)]">
              写作室不是考场。它是一张安静的书桌：你学会的词、记得的语法，都可以在这里慢慢变成自己的表达。哪怕只写一句，也算开始。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register?next=/write" className="btn btn-primary">
                创建账户，开始写
                <ArrowRight size={14} />
              </Link>
              <Link href="/login?next=/write" className="btn btn-ghost">
                已有账户，登录
                <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[9px] tracking-[0.05em] text-[var(--faint)]">
              <span className="flex items-center gap-1.5">
                <Cloud size={11} />
                自动保存
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={11} />
                草稿与完成
              </span>
              <span className="flex items-center gap-1.5">
                <LockKeyhole size={11} />
                仅自己可见
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="relative mx-auto w-full max-w-[500px]">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="absolute -right-3 top-[8%] h-20 w-20 rounded-full border border-[var(--line)]" />
              <div className="absolute -left-5 bottom-[18%] h-28 w-28 rounded-full border border-dashed border-[var(--line)]" />
              <div className="absolute right-[16%] top-[2%] h-2 w-2 rounded-full bg-[var(--accent)]" />
            </div>

            <div className="absolute inset-x-6 top-5 h-[520px] -rotate-[3deg] rounded-[24px] border border-[var(--line)] bg-[var(--surface-2)] opacity-50" />
            <div className="absolute inset-x-3 top-2 h-[530px] rotate-[1.2deg] rounded-[24px] border border-[var(--line)] bg-[var(--surface)] opacity-80" />

            <div className="surface-card writing-paper relative rounded-[24px] p-5 shadow-[0_35px_100px_rgba(0,0,0,.24)] md:p-7">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--sage)]" />
                  <span className="text-[8px] tracking-[0.12em] text-[var(--faint)]">PRIVATE NOTE · DRAFT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[var(--faint)]" />
                  <span className="h-1 w-1 rounded-full bg-[var(--faint)]" />
                  <span className="h-1 w-1 rounded-full bg-[var(--faint)]" />
                </div>
              </div>

              <div className="px-1 py-7 md:px-3 md:py-9">
                <p className="writing-font text-[36px] leading-[1.2] tracking-[-0.02em] text-[var(--ink)]" lang="hy">
                  Իմ առավոտը
                </p>
                <p className="mt-2 text-[10px] text-[var(--muted)]">我的早晨</p>
                <div className="mt-7 space-y-4 writing-font text-[17px] leading-[2] text-[var(--ink)]" lang="hy">
                  <p>Այսօր ես շուտ արթնացա։</p>
                  <p>Դրսում արևը պայծառ էր, և սուրճը տաք էր։</p>
                </div>
                <div className="mt-6 border-t border-[var(--line)] pt-4">
                  <p className="text-[8px] tracking-[0.1em] text-[var(--faint)]">中文对照</p>
                  <p className="mt-2 text-[10px] leading-[1.8] text-[var(--muted)]">
                    今天我醒得很早。外面阳光明亮，咖啡是热的。
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {["晨间", "A1", "日常"].map((tag) => (
                    <span key={tag} className="rounded-full border border-[var(--line)] px-2 py-1 text-[8px] text-[var(--faint)]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--line)] px-1 pt-4">
                <span className="flex items-center gap-1.5 text-[8px] text-[var(--faint)]">
                  <Check size={9} className="text-[var(--sage)]" />
                  已自动保存
                </span>
                <span className="text-[8px] tracking-[0.06em] text-[var(--faint)]">2026.10.18</span>
              </div>
            </div>

            <div className="orbit-chip absolute -bottom-8 right-2 hidden sm:block">
              <strong>1 sentence</strong>
              <span>IS ENOUGH · ԲԱՎԱԿԱՆ Է</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-ayb mt-24 md:mt-32">
        <Reveal>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">A room of your own · ՔՈ ՍԵՆՅԱԿԸ</p>
              <h2 className="mt-3 text-[28px] font-medium tracking-[-0.035em] text-[var(--ink)] md:text-[36px]">
                安静地写，慢慢地长。
              </h2>
            </div>
            <Link href="/login?next=/write" className="arrow-link hidden sm:inline-flex">
              进入写作室
              <ArrowRight size={12} />
            </Link>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {traits.map((trait, index) => {
            const Icon = trait.icon;
            return (
              <Reveal key={trait.title} delay={index * 0.06}>
                <div className="surface-card h-full rounded-[22px] p-6">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--accent)]">
                    <Icon size={14} />
                  </span>
                  <h3 className="mt-7 text-[16px] font-medium text-[var(--ink)]">{trait.title}</h3>
                  <p className="mt-2.5 text-[10px] leading-[1.9] text-[var(--muted)]">{trait.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 md:flex-row md:items-center md:p-8">
            <div className="flex items-start gap-3">
              <Quote size={16} className="mt-1 shrink-0 text-[var(--accent)]" />
              <div>
                <p className="font-display text-[20px] leading-[1.5] text-[var(--ink)] md:text-[24px]" lang="hy">
                  Մի բառից էլ կարող է սկսվել մի պատմություն։
                </p>
                <p className="mt-2 text-[10px] text-[var(--faint)]">一个故事，也可以从一个词开始。</p>
              </div>
            </div>
            <Link href="/register?next=/write" className="btn btn-primary shrink-0">
              <Feather size={14} />
              开始第一篇
            </Link>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-6 flex items-center gap-2 text-[8px] tracking-[0.06em] text-[var(--faint)]">
            <Sparkles size={10} className="text-[var(--apricot)]" />
            A SMALL STUDIO FOR YOUR OWN WORDS.
          </div>
        </Reveal>
      </section>
    </div>
  );
}
