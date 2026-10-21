import { createHash } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { words as baseWords } from "@/data/dictionary";
import type { DictionaryWord, PartOfSpeech } from "@/data/dictionary/types";
import { lexiconWords, type LexiconWord } from "@/data/lexicon";
import { bulkWords, type BulkWord } from "@/data/bulk";

/**
 * Bump this when the seed transformation changes (POS mapping, level rules,
 * ordering). The hash is persisted so an existing database is rebuilt on the
 * next start without touching admin overrides.
 */
const WORD_SEED_VERSION = 1;

export const MAX_WORD_OVERRIDES = 5000;

type WordSeedSource = "curated" | "common" | "wiktionary";

export type WordSeedRow = {
  id: string;
  hy: string;
  translit: string;
  pos: string;
  level: string;
  category: string;
  en: string;
  ru: string;
  zh: string;
  exampleJson: string | null;
  note: string | null;
  frequencyRank: number | null;
  sortOrder: number;
  source: WordSeedSource;
};

function extendedLevel(rank: number): "A1" | "A2" | "B1" {
  if (rank <= 300) return "A1";
  if (rank <= 600) return "A2";
  return "B1";
}

const BULK_POS: Record<string, PartOfSpeech> = {
  noun: "noun",
  verb: "verb",
  adj: "adjective",
  adv: "adverb",
  pron: "pronoun",
  det: "determiner",
  num: "numeral",
  conj: "conjunction",
  prep: "preposition",
  postp: "postposition",
  intj: "interjection",
  particle: "particle",
};

function exampleJson(word: DictionaryWord): string | null {
  return word.example ? JSON.stringify(word.example) : null;
}

function fromCurated(word: DictionaryWord): Omit<WordSeedRow, "sortOrder"> {
  return {
    id: word.id,
    hy: word.hy,
    translit: word.translit,
    pos: word.pos,
    level: word.level,
    category: word.category,
    en: word.en,
    ru: word.ru,
    zh: word.zh,
    exampleJson: exampleJson(word),
    note: word.note ?? null,
    frequencyRank: null,
    source: "curated",
  };
}

function fromLexicon(entry: LexiconWord): Omit<WordSeedRow, "sortOrder"> {
  return {
    id: entry.id,
    hy: entry.hy,
    translit: entry.translit,
    pos: entry.pos,
    level: extendedLevel(entry.rank),
    category: entry.category,
    en: entry.en,
    ru: entry.ru,
    zh: entry.zh,
    exampleJson: JSON.stringify(entry.example),
    note: null,
    frequencyRank: entry.rank,
    source: "common",
  };
}

function fromBulk(entry: BulkWord): Omit<WordSeedRow, "sortOrder"> {
  return {
    id: entry.id,
    hy: entry.hy,
    translit: entry.translit,
    pos: BULK_POS[entry.pos] ?? "noun",
    level: entry.level,
    category: entry.category,
    en: entry.en,
    ru: "",
    zh: "",
    exampleJson: null,
    note: null,
    frequencyRank: entry.rank,
    source: "wiktionary",
  };
}

export function buildWordSeedRows(): WordSeedRow[] {
  const merged = new Map<string, Omit<WordSeedRow, "sortOrder">>();

  // Matches the old mergeById(allWords, custom) behavior: a later source
  // replaces the value but the id keeps its first position.
  for (const word of baseWords) merged.set(word.id, fromCurated(word));
  for (const word of lexiconWords) merged.set(word.id, fromLexicon(word));
  for (const word of bulkWords) merged.set(word.id, fromBulk(word));

  return Array.from(merged.values()).map((row, index) => ({
    ...row,
    sortOrder: index,
  }));
}

function seedHash(rows: WordSeedRow[]): string {
  return createHash("sha256")
    .update(`v${WORD_SEED_VERSION}\n`)
    .update(JSON.stringify(rows))
    .digest("hex");
}

export function syncWordSeeds(db: DatabaseSync): void {
  const rows = buildWordSeedRows();
  const hash = seedHash(rows);
  const current = db
    .prepare("SELECT value FROM app_meta WHERE key = ?")
    .get("words_seed_hash") as { value: string } | undefined;
  if (current?.value === hash) return;

  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("DELETE FROM words").run();
    const insert = db.prepare(`
      INSERT INTO words (
        id, hy, translit, pos, level, category, en, ru, zh,
        example_json, note, frequency_rank, sort_order, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const row of rows) {
      insert.run(
        row.id,
        row.hy,
        row.translit,
        row.pos,
        row.level,
        row.category,
        row.en,
        row.ru,
        row.zh,
        row.exampleJson,
        row.note,
        row.frequencyRank,
        row.sortOrder,
        row.source,
      );
    }
    db.prepare(`
      INSERT INTO app_meta (key, value) VALUES ('words_seed_hash', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(hash);
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The original error is more useful.
    }
    throw error;
  }
}

export function insertWordOverride(
  db: DatabaseSync,
  word: DictionaryWord,
  updatedAt: string,
): void {
  db.prepare(`
    INSERT INTO word_overrides (
      id, hy, translit, pos, level, category, en, ru, zh,
      example_json, note, frequency_rank, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
    ON CONFLICT(id) DO UPDATE SET
      hy = excluded.hy,
      translit = excluded.translit,
      pos = excluded.pos,
      level = excluded.level,
      category = excluded.category,
      en = excluded.en,
      ru = excluded.ru,
      zh = excluded.zh,
      example_json = excluded.example_json,
      note = excluded.note,
      updated_at = excluded.updated_at
  `).run(
    word.id,
    word.hy,
    word.translit,
    word.pos,
    word.level,
    word.category,
    word.en,
    word.ru,
    word.zh,
    exampleJson(word),
    word.note ?? null,
    updatedAt,
  );
}
