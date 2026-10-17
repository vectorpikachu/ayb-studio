import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Feather,
  Hash,
  Layers,
  Sparkles,
} from "lucide-react";
import { AudioButton } from "@/components/audio-button";
import { Reveal } from "@/components/reveal";
import { getWordOfTheDay, posLabels } from "@/data/dictionary";
import { getCurrentUser } from "@/lib/server/auth";

const features = [
  {
    number: "01",
    hij: "Բառարան",
    title: "四语词典",
    en: "Lexicon",
    description:
      "亚美尼亚语、英语、俄语与中文互查。每个词都配有转写、词性与一段自然例句。",
    href: "/dictionary",
    icon: BookOpen,
    accent: "var(--accent)",
    visual: (
      <div className="relative flex h-full items-center justify-center">
        <span className="absolute left-5 top-3 text-[10px] tracking-[0.18em] text-[var(--faint)]">
          Ա → A → А → 亚
        </span>
        <div className="relative flex items-end gap-1">
          <span className="font-display text-[76px] leading-[0.9] text-[var(--ink)] md:text-[94px]">
            Ա
          </span>
          <span className="mb-2 flex flex-col gap-1.5">
            {["ա", "A", "А", "亚"].map((letter, index) => (
              <span
                key={letter}
                className="grid h-5 w-5 place-items-center rounded-[5px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] text-[8px] text-[var(--muted)]"
                style={{ opacity: 1 - index * 0.14 }}
              >
                {letter}
              </span>
            ))}
          </span>
        </div>
        <span className="absolute bottom-2 left-5 font-arm text-[11px] tracking-wide text-[var(--faint)]">
          բառ, բառեր, բառից…
        </span>
      </div>
    ),
  },
  {
    number: "02",
    hij: "Կրկնություն",
    title: "间隔复习",
    en: "Recite",
    description:
      "用翻卡与四档评分安排复习节奏。每个单词都带着例句回来，而不是孤零零地出现。",
    href: "/review",
    icon: Layers,
    accent: "var(--apricot)",
    visual: (
      <div className="relative flex h-full items-center justify-center pt-5">
        <div className="absolute h-[106px] w-[168px] -rotate-[7deg] rounded-xl border border-[var(--line)] bg-[var(--surface-2)] opacity-55" />
        <div className="absolute h-[106px] w-[168px] rotate-[4deg] rounded-xl border border-[var(--line)] bg-[var(--surface)] opacity-80" />
        <div className="relative flex h-[106px] w-[168px] flex-col justify-between rounded-xl border border-[var(--line-strong)] bg-[var(--elevated)] p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[8px] tracking-[0.16em] text-[var(--faint)]">DUE TODAY</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--apricot)]" />
          </div>
          <div>
            <p className="font-arm text-[27px] leading-none text-[var(--ink)]">շնորհակալություն</p>
            <p className="mt-1.5 text-[8px] tracking-[0.08em] text-[var(--faint)]">
              shnorhakalutyun · thank you
            </p>
          </div>
        </div>
        <div className="absolute bottom-3 right-5 flex gap-1">
          {["1", "2", "3", "4"].map((step) => (
            <span
              key={step}
              className="grid h-5 w-5 place-items-center rounded-md border border-[var(--line)] text-[8px] text-[var(--faint)]"
            >
              {step}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: "03",
    hij: "Քերականություն",
    title: "语法地图",
    en: "Grammar",
    description:
      "从字母表到格变化，八节循序渐进的语法课。解释、对照表、例句与课后小测，完整而轻巧。",
    href: "/grammar",
    icon: Hash,
    accent: "var(--azure)",
    visual: (
      <div className="flex h-full flex-col justify-center gap-2 px-4 pt-3">
        {[
          ["ես", "եմ", "I am"],
          ["դու", "ես", "you are"],
          ["նա", "է", "he / she is"],
        ].map(([pronoun, verb, gloss], index) => (
          <div key={pronoun} className="flex items-center gap-3">
            <span className="w-9 font-arm text-[14px] text-[var(--ink)]">{pronoun}</span>
            <span className="h-[1px] flex-1 bg-[var(--line)]" />
            <span
              className="font-arm text-[14px]"
              style={{ color: index === 1 ? "var(--azure)" : "var(--muted)" }}
            >
              {verb}
            </span>
            <span className="w-[66px] text-right text-[8px] tracking-wide text-[var(--faint)]">
              {gloss}
            </span>
          </div>
        ))}
        <div className="mt-2 flex items-center gap-2 text-[8px] tracking-[0.12em] text-[var(--faint)]">
          <span className="h-[1px] w-7 bg-[var(--line-strong)]" />
          PRESENT · ՆԵՐԿԱ
        </div>
      </div>
    ),
  },
];

export default async function HomePage() {
  const word = getWordOfTheDay();
  const user = await getCurrentUser();

  return (
    <div className="overflow-hidden">
      <section className="container-ayb relative pb-10 pt-[128px] md:pb-14 md:pt-[170px]">
        <div className="grid items-center gap-8 lg:grid-cols-[1.06fr_0.94fr] lg:gap-10">
          <div className="relative z-10">
            <Reveal>
              <div className="mb-7 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--elevated)_55%,transparent)] px-3 py-1.5 text-[9px] font-semibold tracking-[0.16em] text-[var(--muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  {user ? `WELCOME BACK · ${user.name.toUpperCase()}` : "AYB · ARMENIAN STUDIO"}
                </span>
                <span className="hidden text-[9px] tracking-[0.15em] text-[var(--faint)] sm:inline">
                  EST. 405 AD · ՄԵՍՐՈՊ ՄԱՇՏՈՑ
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="hero-title max-w-[650px] text-[var(--ink)]">
                从第一个字母，
                <br />
                学会
                <span className="relative inline-block">
                  <span className="relative z-10">亚美尼亚语</span>
                  <span
                    className="absolute -bottom-1 left-0 h-[7px] w-full -rotate-[1.5deg] rounded-full opacity-70 md:h-[10px]"
                    style={{
                      background:
                        "linear-gradient(90deg, color-mix(in srgb, var(--accent) 50%, transparent), color-mix(in srgb, var(--apricot) 20%, transparent))",
                    }}
                    aria-hidden
                  />
                </span>
                。
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-7 max-w-[480px] text-[13px] leading-[1.85] text-[var(--muted)] md:text-[14px]">
                Ayb 是一间安静的亚美尼亚语学习室。用词、语法与写作，慢慢靠近一门有一千六百年文字传统的语言。
                <span className="mt-2 block text-[12px] text-[var(--faint)]">
                  Learn Armenian, letter by letter.
                </span>
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href={user ? "/review" : "/register"} className="btn btn-primary">
                  {user ? "继续今日复习" : "开始学习"}
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
                <Link href="/dictionary" className="btn btn-ghost">
                  先逛词典
                  <ArrowUpRight size={14} strokeWidth={1.8} />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-12 flex items-center gap-5 text-[9px] tracking-[0.1em] text-[var(--faint)]">
                <div className="flex items-center gap-2">
                  <span className="font-arm text-[13px] text-[var(--muted)]">38</span>
                  个字母
                </div>
                <span className="h-3 w-[1px] bg-[var(--line)]" />
                <div className="flex items-center gap-2">
                  <span className="font-arm text-[13px] text-[var(--muted)]">4</span>
                  种语言互查
                </div>
                <span className="h-3 w-[1px] bg-[var(--line)]" />
                <span>每天 10 分钟</span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12} y={12} className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
            <div className="hero-art" aria-hidden>
              <div className="hero-ring hero-ring-1" />
              <div className="hero-ring hero-ring-2" />
              <div className="hero-disc">
                <span className="absolute top-[17%] text-[8px] font-semibold tracking-[0.3em] text-[var(--faint)]">
                  THE FIRST LETTER
                </span>
                <span className="hero-letter">Ա</span>
              </div>

              <div className="orbit-chip chip-a">
                <strong>բարև</strong>
                <span>barev · hello</span>
              </div>
              <div className="orbit-chip chip-b">
                <strong>շնորհակալություն</strong>
                <span>thank you</span>
              </div>
              <div className="orbit-chip chip-c">
                <strong>38</strong>
                <span>LETTERS · ՏԱՌ</span>
              </div>
              <span className="orbit-dot dot-a" />
              <span className="orbit-dot dot-b" />
              <span className="orbit-dot dot-c" />
            </div>

            <div className="mx-auto mt-1 flex max-w-[340px] items-center justify-between gap-4 text-[9px] tracking-[0.06em] text-[var(--faint)]">
              <span className="font-arm text-[10px]">Լեզուն սկսվում է տառից։</span>
              <span className="hidden sm:block">THE LANGUAGE BEGINS WITH A LETTER.</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.08} className="relative z-10 mt-14 md:mt-20">
          <section
            aria-labelledby="daily-word"
            className="surface-card relative overflow-hidden rounded-[26px] md:rounded-[30px]"
          >
            <div
              className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full opacity-30 blur-3xl"
              style={{ background: "var(--accent)" }}
            />
            <div className="relative grid md:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 md:p-10 lg:p-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <h2 id="daily-word" className="eyebrow !text-[var(--muted)]">
                      每日一词 · Word of the day
                    </h2>
                  </div>
                  <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[8px] font-semibold tracking-[0.12em] text-[var(--faint)]">
                    {word.level} · {posLabels[word.pos]}
                  </span>
                </div>

                <div className="mt-8 flex items-end gap-5">
                  <p className="font-display text-[72px] leading-[0.8] tracking-[-0.02em] text-[var(--ink)] md:text-[94px]">
                    {word.hy}
                  </p>
                  <div className="mb-1">
                    <p className="text-[11px] tracking-[0.08em] text-[var(--faint)]">
                      {word.translit}
                    </p>
                    <AudioButton text={word.hy} label="朗读每日一词" className="mt-2 h-8 w-8" size="sm" />
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-[12px]">
                  <p>
                    <span className="mr-2 text-[8px] tracking-[0.12em] text-[var(--faint)]">EN</span>
                    <span className="text-[var(--ink)]">{word.en}</span>
                  </p>
                  <p>
                    <span className="mr-2 text-[8px] tracking-[0.12em] text-[var(--faint)]">RU</span>
                    <span className="text-[var(--ink)]">{word.ru}</span>
                  </p>
                  <p>
                    <span className="mr-2 text-[8px] tracking-[0.12em] text-[var(--faint)]">中</span>
                    <span className="text-[var(--ink)]">{word.zh}</span>
                  </p>
                </div>

                <Link href="/dictionary" className="arrow-link mt-8">
                  查看完整词条
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="relative flex flex-col justify-between border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--surface-2)_40%,transparent)] p-6 md:border-l md:border-t-0 md:p-10 lg:p-12">
                <div>
                  <span className="eyebrow">例句 · In a sentence</span>
                  <p className="mt-5 font-arm text-[22px] leading-[1.55] text-[var(--ink)] md:text-[25px]">
                    {word.example.hy}
                  </p>
                  <p className="mt-2 text-[10px] italic tracking-[0.03em] text-[var(--faint)]">
                    {word.example.translit}
                  </p>
                  <div className="mt-5 space-y-1.5 border-l border-[var(--accent)] pl-4">
                    <p className="text-[11px] leading-relaxed text-[var(--muted)]">
                      {word.example.zh}
                    </p>
                    <p className="text-[10px] leading-relaxed text-[var(--faint)]">
                      {word.example.en}
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex items-end justify-between">
                  <p className="font-arm text-[10px] text-[var(--faint)]">մեկ բառ, մի աշխարհ։</p>
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--faint)]">
                    <ArrowDown size={14} strokeWidth={1.5} />
                  </span>
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      </section>

      <section className="container-ayb mt-24 md:mt-32">
        <Reveal>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">The toolkit · Գործիքներ</p>
              <h2 className="mt-4 max-w-[620px] text-[30px] font-medium leading-[1.25] tracking-[-0.035em] text-[var(--ink)] md:text-[42px]">
                三件小事，
                <br className="sm:hidden" />
                慢慢把语言放进口袋。
              </h2>
            </div>
            <p className="max-w-[290px] text-[11px] leading-[1.8] text-[var(--faint)] sm:text-right">
              没有排行榜，没有催促。
              <br />
              只有你与语言之间，刚刚好的距离。
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.href} delay={index * 0.08}>
                <Link
                  href={feature.href}
                  className="surface-card group flex h-full min-h-[420px] flex-col overflow-hidden rounded-[24px] transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:border-[var(--line-strong)] hover:shadow-[0_24px_70px_rgba(0,0,0,.12)]"
                >
                  <div className="flex items-center justify-between px-6 pt-6">
                    <span className="text-[9px] font-semibold tracking-[0.18em] text-[var(--faint)]">
                      {feature.number}
                    </span>
                    <span
                      className="grid h-8 w-8 place-items-center rounded-full border"
                      style={{
                        color: feature.accent,
                        borderColor: "var(--line)",
                        background: `color-mix(in srgb, ${feature.accent} 8%, transparent)`,
                      }}
                    >
                      <Icon size={14} strokeWidth={1.7} />
                    </span>
                  </div>

                  <div className="h-[190px] overflow-hidden">{feature.visual}</div>

                  <div className="flex flex-1 flex-col justify-end border-t border-[var(--line)] p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-arm text-[11px] text-[var(--faint)]">{feature.hij}</span>
                      <span className="text-[8px] tracking-[0.16em] text-[var(--faint)]">
                        {feature.en.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="mt-2 text-[20px] font-medium tracking-[-0.02em] text-[var(--ink)]">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-[11px] leading-[1.8] text-[var(--muted)]">
                      {feature.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-semibold text-[var(--ink)]">
                      进入
                      <span className="grid h-5 w-5 place-items-center rounded-full border border-[var(--line-strong)] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                        <ArrowRight size={10} />
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="container-ayb mt-24 md:mt-32">
        <Reveal>
          <div className="relative grid overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--elevated)] md:grid-cols-[1fr_0.9fr]">
            <div
              className="pointer-events-none absolute -left-28 top-0 h-72 w-72 rounded-full opacity-20 blur-[90px]"
              style={{ background: "var(--accent)" }}
            />
            <div className="relative z-10 p-8 md:p-12 lg:p-16">
              <div className="flex items-center gap-3">
                <Feather size={14} className="text-[var(--accent)]" />
                <p className="eyebrow">Grich · Գրիչ · Writing room</p>
              </div>
              <h2 className="mt-6 max-w-[430px] text-[32px] font-medium leading-[1.22] tracking-[-0.04em] text-[var(--ink)] md:text-[44px]">
                写下第一句，
                <br />
                语言就属于你了。
              </h2>
              <p className="mt-5 max-w-[380px] text-[12px] leading-[1.9] text-[var(--muted)]">
                一个不被打扰的写作空间。保存你的句子、段落与小文章，在真实的表达里，把学过的词重新遇见。
              </p>
              <Link href="/write" className="btn btn-ghost mt-8">
                <Feather size={14} />
                进入写作室
              </Link>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[9px] tracking-[0.08em] text-[var(--faint)]">
                <span>AUTOSAVE</span>
                <span>DRAFT / FINAL</span>
                <span>YOUR OWN WORDS</span>
              </div>
            </div>

            <div className="relative flex min-h-[360px] items-center justify-center border-t border-[var(--line)] p-8 md:border-l md:border-t-0 md:p-12">
              <div className="absolute inset-0 opacity-40">
                <div
                  className="absolute right-8 top-8 h-52 w-52 rounded-full border"
                  style={{ borderColor: "var(--line)" }}
                />
                <div
                  className="absolute right-20 top-20 h-28 w-28 rounded-full border"
                  style={{ borderColor: "var(--line)" }}
                />
              </div>
              <div className="relative w-full max-w-[330px] rotate-[-2deg] rounded-[18px] border border-[var(--line-strong)] bg-[var(--paper)] p-6 shadow-[0_30px_70px_rgba(0,0,0,.22)] transition-transform duration-500 ease-[var(--ease-out-expo)] hover:rotate-0">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <span className="text-[8px] tracking-[0.16em] text-[var(--faint)]">NOTE · 001</span>
                  <span className="font-arm text-[9px] text-[var(--faint)]">17.10.2026</span>
                </div>
                <p className="mt-5 font-display text-[22px] leading-[1.35] text-[var(--ink)]">
                  Այսօր ես սովորեցի մի նոր բառ։
                </p>
                <p className="mt-2 font-arm text-[12px] leading-[1.7] text-[var(--muted)]">
                  Այն փոքր է, ինչպես սերմը, բայց բացում է մի նոր աշխարհ։
                </p>
                <div className="mt-5 space-y-1.5">
                  <p className="text-[9px] italic text-[var(--faint)]">
                    Aysor yes sovorets’i mi nor barr.
                  </p>
                  <p className="text-[9px] text-[var(--faint)]">
                    Today I learned a new word. It is small, like a seed, but it opens a new world.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[8px] tracking-[0.12em] text-[var(--faint)]">AYB · GRICH</span>
                  <Sparkles size={11} className="text-[var(--accent)]" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container-ayb mt-28 md:mt-40">
        <Reveal>
          <div className="mx-auto max-w-[900px] text-center">
            <span className="font-display text-[70px] leading-[0.4] text-[var(--accent)] opacity-60">
              “
            </span>
            <blockquote className="mt-3">
              <p className="font-display text-[30px] leading-[1.35] tracking-[-0.015em] text-[var(--ink)] md:text-[44px]">
                Ես իմ անուշ Հայաստանի
                <br />
                արևահամ բարն եմ սիրում։
              </p>
              <p className="mx-auto mt-7 max-w-[540px] text-[11px] leading-[1.9] text-[var(--muted)]">
                我爱我甜蜜的亚美尼亚，那被阳光浸透的语言。
                <span className="mt-1 block text-[10px] text-[var(--faint)]">
                  I love the sun-tasting word of my sweet Armenia.
                </span>
              </p>
              <footer className="mt-6 flex items-center justify-center gap-3 text-[9px] tracking-[0.14em] text-[var(--faint)]">
                <span className="h-[1px] w-8 bg-[var(--line-strong)]" />
                ԵՂԻՇԵ ՉԱՐԵՆՑ · YEGHISHE CHARENTS
                <span className="h-[1px] w-8 bg-[var(--line-strong)]" />
              </footer>
            </blockquote>
          </div>
        </Reveal>
      </section>

      <section className="container-ayb mt-24 md:mt-32">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 border-t border-[var(--line)] pt-8 sm:flex-row sm:items-center">
            <p className="text-[11px] leading-[1.8] text-[var(--faint)]">
              准备好了吗？从一个词开始。
              <span className="mt-0.5 block font-arm text-[12px] text-[var(--muted)]">
                Սկսենք մի բառից։
              </span>
            </p>
            <Link href={user ? "/review" : "/register"} className="btn btn-primary">
              {user ? "回到今天的学习" : "创建你的学习空间"}
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
