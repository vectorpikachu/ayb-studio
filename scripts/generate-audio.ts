/**
 * Pre-render every Armenian string the site can speak into public/audio.
 *
 * The browser has no reliable Armenian voice (Chrome on Linux has none, and
 * Windows/Edge ship no hy-AM voice), so AudioButton plays these files first and
 * only falls back to speechSynthesis. eSpeak NG is used because it is the only
 * offline engine with an Eastern Armenian voice; it is a reference voice, not
 * a native speaker.
 *
 * Run: npx tsx scripts/generate-audio.ts
 * Env: ESPEAK_BIN, ESPEAK_DATA, LAME_BIN, ESPEAK_LIBS, FORCE=1
 */
import { execFile } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { audioKey } from "../src/lib/audio-key";
import { words } from "../src/data/dictionary";
import { readingTexts } from "../src/data/reading";
import { grammarLessons } from "../src/data/grammar";

const ESPEAK = process.env.ESPEAK_BIN ?? "espeak-ng";
const LAME = process.env.LAME_BIN ?? "lame";
const ESPEAK_DATA = process.env.ESPEAK_DATA;
const ESPEAK_LIBS = process.env.ESPEAK_LIBS;
const OUT = path.resolve("public/audio");
const FORCE = process.env.FORCE === "1";

function collectHy(value: unknown, out: Set<string>, seen = new Set<unknown>()) {
  if (typeof value === "string") {
    const text = value.replace(/\s+/g, " ").trim();
    if (text.length > 1 && /[\u0531-\u0587]/.test(text)) out.add(text);
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) collectHy(item, out, seen);
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (key === "hy" || key === "titleHy" || key === "modernHy") collectHy(item, out, seen);
  }
}

function run(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    if (ESPEAK_DATA) env.ESPEAK_DATA_PATH = ESPEAK_DATA;
    if (ESPEAK_LIBS) {
      env.LD_LIBRARY_PATH = [ESPEAK_LIBS, env.LD_LIBRARY_PATH].filter(Boolean).join(":");
    }
    const espeak = execFile(
      ESPEAK,
      ["-v", "hy", "-s", "150", "-p", "45", "--stdout", input],
      { env, maxBuffer: 1024 * 1024 * 8, encoding: "buffer" },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        const lame = execFile(
          LAME,
          ["-b", "32", "-m", "m", "-", output],
          { env, maxBuffer: 1024 * 1024 * 8 },
          (lameError, _stdout, stderr) => {
            if (lameError) reject(new Error(stderr || lameError.message));
            else resolve();
          },
        );
        lame.stdin?.end(stdout as Buffer);
      },
    );
    espeak.stdin?.end();
  });
}

async function main() {
  const texts = new Set<string>();
  for (const word of words) {
    texts.add(word.hy);
    if (word.example?.hy) texts.add(word.example.hy);
  }
  for (const reading of readingTexts) {
    texts.add(reading.titleHy);
    for (const paragraph of reading.paragraphs) {
      texts.add(paragraph.hy);
      if (paragraph.modernHy) texts.add(paragraph.modernHy);
    }
  }
  collectHy(grammarLessons, texts);

  try {
    const lexiconPath = "../src/data/lexicon";
    const { lexiconWords } = await import(lexiconPath);
    for (const entry of lexiconWords) {
      texts.add(entry.hy);
      texts.add(entry.example.hy);
    }
  } catch {
    // The lexicon is optional; generate audio for what exists today.
  }

  await mkdir(OUT, { recursive: true });
  const existing = new Set(await readdir(OUT));
  const list = [...texts].map((text) => ({ text, key: audioKey(text) }));
  const missing = list.filter((entry) => FORCE || !existing.has(entry.key + ".mp3"));

  console.log(list.length + " unique texts, " + missing.length + " to render");
  let done = 0;
  let failed = 0;
  const total = missing.length;

  const workers = Array.from({ length: 4 }, async () => {
    for (;;) {
      const entry = missing.shift();
      if (!entry) return;
      try {
        await run(entry.text, path.join(OUT, entry.key + ".mp3"));
      } catch (error) {
        failed += 1;
        console.error("failed", entry.text.slice(0, 30), (error as Error).message);
      }
      done += 1;
      if (done % 50 === 0) console.log(done + "/" + total + " rendered");
    }
  });
  await Promise.all(workers);

  const keys = [...new Set(list.map((entry) => entry.key))].sort();
  await writeFile(
    path.join(OUT, "manifest.json"),
    JSON.stringify({ voice: "espeak-ng hy", generatedAt: new Date().toISOString(), keys }),
  );
  await writeFile(
    path.join(OUT, "README.md"),
    [
      "# Audio",
      "",
      "Machine-generated Eastern Armenian reference audio.",
      "",
      "- Engine: eSpeak NG hy (GPL), encoded to 32 kbps MP3 with LAME.",
      "- Source text: Ayb content (dictionary, reading, grammar) and the open lexicon subset.",
      "- Files are named by a stable FNV-1a key of the text; see src/lib/audio-key.ts.",
      "- Missing files simply fall back to the browser speechSynthesis.",
      "",
      "Regenerate: npx tsx scripts/generate-audio.ts (set FORCE=1 to overwrite).",
      "",
    ].join("\n"),
  );
  console.log("manifest " + keys.length + " keys, " + failed + " failed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

