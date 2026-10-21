import { grammarLessons as baseLessons } from "@/data/grammar";
import { readingTexts as baseReadingTexts } from "@/data/reading";
import { cultureEntries as baseCultureEntries } from "@/data/culture";
import type { DictionaryWord } from "@/data/dictionary/types";
import type { GrammarLesson } from "@/data/grammar/types";
import type { ReadingText } from "@/data/reading/types";
import type { CultureEntry } from "@/data/culture/types";
import { mergeById } from "@/lib/content-utils";
import {
  getContentCultureEntries,
  getContentReadingTexts,
} from "./content";
import {
  listCustomPayloads,
  withWrite,
  type CustomContentTable,
} from "./db";
import {
  countWords,
  deleteWordOverride,
  listOverriddenWordIds,
  listWordOverrides,
  saveWordOverrides,
} from "./word-db";

const MAX_CUSTOM_LESSONS = 500;
const MAX_CUSTOM_READING_TEXTS = 500;
const MAX_CUSTOM_CULTURE_ENTRIES = 500;

export type AdminContentSnapshot = {
  customWords: DictionaryWord[];
  customLessons: GrammarLesson[];
  customReadingTexts: ReadingText[];
  customCultureEntries: CultureEntry[];
  readingTexts: ReadingText[];
  cultureEntries: CultureEntry[];
  overriddenWordIds: string[];
  baseLessonIds: string[];
  baseReadingIds: string[];
  baseCultureIds: string[];
  counts: {
    customWords: number;
    customLessons: number;
    customReadingTexts: number;
    customCultureEntries: number;
    totalWords: number;
    totalLessons: number;
    totalReadingTexts: number;
    totalCultureEntries: number;
  };
};

const baseLessonIds = baseLessons.map((lesson) => lesson.id);
const baseReadingIds = baseReadingTexts.map((text) => text.id);
const baseCultureIds = baseCultureEntries.map((entry) => entry.id);

export async function getAdminContentSnapshot(): Promise<AdminContentSnapshot> {
  const [
    customWords,
    overriddenWordIds,
    customLessons,
    customReadingTexts,
    customCultureEntries,
    readingTexts,
    cultureEntries,
    totalWords,
  ] = await Promise.all([
    listWordOverrides(),
    listOverriddenWordIds(),
    listCustomPayloads<GrammarLesson>("custom_lessons"),
    listCustomPayloads<ReadingText>("custom_reading_texts"),
    listCustomPayloads<CultureEntry>("custom_culture_entries"),
    getContentReadingTexts(),
    getContentCultureEntries(),
    countWords(),
  ]);

  return {
    customWords,
    customLessons,
    customReadingTexts,
    customCultureEntries,
    readingTexts,
    cultureEntries,
    overriddenWordIds,
    baseLessonIds,
    baseReadingIds,
    baseCultureIds,
    counts: {
      customWords: customWords.length,
      customLessons: customLessons.length,
      customReadingTexts: customReadingTexts.length,
      customCultureEntries: customCultureEntries.length,
      totalWords,
      totalLessons: mergeById(baseLessons, customLessons).length,
      totalReadingTexts: mergeById(baseReadingTexts, customReadingTexts).length,
      totalCultureEntries: mergeById(baseCultureEntries, customCultureEntries).length,
    },
  };
}

export async function saveCustomWords(
  words: DictionaryWord[],
): Promise<AdminContentSnapshot> {
  await saveWordOverrides(words);
  return getAdminContentSnapshot();
}

export async function deleteCustomWord(id: string): Promise<AdminContentSnapshot> {
  await deleteWordOverride(id);
  return getAdminContentSnapshot();
}

async function savePayloads<T extends { id: string }>(
  table: CustomContentTable,
  items: T[],
  limit: number,
  limitError: string,
): Promise<void> {
  await withWrite((db) => {
    const ids = new Set(
      (db.prepare(`SELECT id FROM ${table}`).all() as { id: string }[]).map((row) => row.id),
    );
    for (const item of items) ids.add(item.id);
    if (ids.size > limit) throw new Error(limitError);

    const upsert = db.prepare(`
      INSERT INTO ${table} (id, payload_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `);
    const now = new Date().toISOString();
    for (const item of items) {
      upsert.run(item.id, JSON.stringify(item), now);
    }
  });
}

async function deletePayload(
  table: CustomContentTable,
  id: string,
  notFoundError: string,
): Promise<void> {
  await withWrite((db) => {
    const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    if (Number(result.changes) === 0) throw new Error(notFoundError);
  });
}

export async function saveCustomLessons(
  lessons: GrammarLesson[],
): Promise<AdminContentSnapshot> {
  await savePayloads("custom_lessons", lessons, MAX_CUSTOM_LESSONS, "LESSON_LIMIT");
  return getAdminContentSnapshot();
}

export async function deleteCustomLesson(id: string): Promise<AdminContentSnapshot> {
  await deletePayload("custom_lessons", id, "LESSON_NOT_FOUND");
  return getAdminContentSnapshot();
}

export async function saveCustomReadingTexts(
  texts: ReadingText[],
): Promise<AdminContentSnapshot> {
  await savePayloads(
    "custom_reading_texts",
    texts,
    MAX_CUSTOM_READING_TEXTS,
    "READING_LIMIT",
  );
  return getAdminContentSnapshot();
}

export async function deleteCustomReadingText(id: string): Promise<AdminContentSnapshot> {
  await deletePayload("custom_reading_texts", id, "READING_NOT_FOUND");
  return getAdminContentSnapshot();
}

export async function saveCustomCultureEntries(
  entries: CultureEntry[],
): Promise<AdminContentSnapshot> {
  await savePayloads(
    "custom_culture_entries",
    entries,
    MAX_CUSTOM_CULTURE_ENTRIES,
    "CULTURE_LIMIT",
  );
  return getAdminContentSnapshot();
}

export async function deleteCustomCultureEntry(id: string): Promise<AdminContentSnapshot> {
  await deletePayload("custom_culture_entries", id, "CULTURE_NOT_FOUND");
  return getAdminContentSnapshot();
}
