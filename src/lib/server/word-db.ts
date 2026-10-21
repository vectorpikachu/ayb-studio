import type {
  CategoryId,
  DictionaryWord,
  PartOfSpeech,
  WordExample,
  WordLevel,
} from "@/data/dictionary/types";
import { getDb, withWrite } from "./db";
import { insertWordOverride, MAX_WORD_OVERRIDES } from "./word-seed";

type WordRow = {
  id: string;
  hy: string;
  translit: string;
  pos: string;
  level: string;
  category: string;
  en: string;
  ru: string;
  zh: string;
  example_json: string | null;
  note: string | null;
};

const EFFECTIVE_SELECT = `
  SELECT
    s.id AS id,
    CASE WHEN o.id IS NULL THEN s.hy ELSE o.hy END AS hy,
    CASE WHEN o.id IS NULL THEN s.translit ELSE o.translit END AS translit,
    CASE WHEN o.id IS NULL THEN s.pos ELSE o.pos END AS pos,
    CASE WHEN o.id IS NULL THEN s.level ELSE o.level END AS level,
    CASE WHEN o.id IS NULL THEN s.category ELSE o.category END AS category,
    CASE WHEN o.id IS NULL THEN s.en ELSE o.en END AS en,
    CASE WHEN o.id IS NULL THEN s.ru ELSE o.ru END AS ru,
    CASE WHEN o.id IS NULL THEN s.zh ELSE o.zh END AS zh,
    CASE WHEN o.id IS NULL THEN s.example_json ELSE o.example_json END AS example_json,
    CASE WHEN o.id IS NULL THEN s.note ELSE o.note END AS note
  FROM words s
  LEFT JOIN word_overrides o ON o.id = s.id
`;

const OVERRIDE_SELECT = `
  SELECT
    o.id, o.hy, o.translit, o.pos, o.level, o.category, o.en, o.ru, o.zh,
    o.example_json, o.note
  FROM word_overrides o
`;

function parseExample(value: string | null): WordExample | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as WordExample;
  } catch {
    return undefined;
  }
}

function toDictionaryWord(row: WordRow): DictionaryWord {
  return {
    id: row.id,
    hy: row.hy,
    translit: row.translit,
    pos: row.pos as PartOfSpeech,
    level: row.level as WordLevel,
    category: row.category as CategoryId,
    en: row.en,
    ru: row.ru,
    zh: row.zh,
    example: parseExample(row.example_json),
    note: row.note ?? undefined,
  };
}

export async function getWordCatalog(): Promise<DictionaryWord[]> {
  const db = await getDb();
  const seedRows = db
    .prepare(`${EFFECTIVE_SELECT} ORDER BY s.sort_order`)
    .all() as unknown as WordRow[];
  const overrideRows = db
    .prepare(`
      ${OVERRIDE_SELECT}
      WHERE NOT EXISTS (SELECT 1 FROM words s WHERE s.id = o.id)
      ORDER BY o.rowid
    `)
    .all() as unknown as WordRow[];
  return [...seedRows, ...overrideRows].map(toDictionaryWord);
}

export async function getWordById(id: string): Promise<DictionaryWord | undefined> {
  const db = await getDb();
  const seedRow = db
    .prepare(`${EFFECTIVE_SELECT} WHERE s.id = ?`)
    .get(id) as unknown as WordRow | undefined;
  if (seedRow) return toDictionaryWord(seedRow);

  const overrideRow = db
    .prepare(`${OVERRIDE_SELECT} WHERE o.id = ?`)
    .get(id) as unknown as WordRow | undefined;
  return overrideRow ? toDictionaryWord(overrideRow) : undefined;
}

export async function countWords(): Promise<number> {
  const db = await getDb();
  const row = db
    .prepare(`
      SELECT
        (SELECT COUNT(*) FROM words) +
        (SELECT COUNT(*) FROM word_overrides o
          WHERE NOT EXISTS (SELECT 1 FROM words s WHERE s.id = o.id)) AS n
    `)
    .get() as { n: number } | undefined;
  return Number(row?.n ?? 0);
}

export async function listWordOverrides(): Promise<DictionaryWord[]> {
  const db = await getDb();
  const rows = db
    .prepare(`${OVERRIDE_SELECT} ORDER BY o.rowid`)
    .all() as unknown as WordRow[];
  return rows.map(toDictionaryWord);
}

export async function listOverriddenWordIds(): Promise<string[]> {
  const db = await getDb();
  const rows = db
    .prepare(`
      SELECT o.id FROM word_overrides o
      INNER JOIN words s ON s.id = o.id
      ORDER BY o.rowid
    `)
    .all() as { id: string }[];
  return rows.map((row) => row.id);
}

export async function saveWordOverrides(words: DictionaryWord[]): Promise<void> {
  await withWrite((db) => {
    const now = new Date().toISOString();
    for (const word of words) insertWordOverride(db, word, now);
    const row = db.prepare("SELECT COUNT(*) AS n FROM word_overrides").get() as
      | { n: number }
      | undefined;
    if (Number(row?.n ?? 0) > MAX_WORD_OVERRIDES) throw new Error("WORD_LIMIT");
  });
}

export async function deleteWordOverride(id: string): Promise<void> {
  await withWrite((db) => {
    const result = db.prepare("DELETE FROM word_overrides WHERE id = ?").run(id);
    if (Number(result.changes) === 0) throw new Error("WORD_NOT_FOUND");
  });
}
