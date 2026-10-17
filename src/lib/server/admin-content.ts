import { words as baseWords } from "@/data/dictionary";
import { grammarLessons as baseLessons } from "@/data/grammar";
import { readingTexts as baseReadingTexts } from "@/data/reading";
import { cultureEntries as baseCultureEntries } from "@/data/culture";
import type { DictionaryWord } from "@/data/dictionary/types";
import type { GrammarLesson } from "@/data/grammar/types";
import type { ReadingText } from "@/data/reading/types";
import type { CultureEntry } from "@/data/culture/types";
import { mergeById } from "@/lib/content-utils";
import type { Database } from "./db-types";
import { readDatabase, updateDatabase } from "./db";

const MAX_CUSTOM_WORDS = 5000;
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
  baseWordIds: string[];
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

const baseWordIds = baseWords.map((word) => word.id);
const baseLessonIds = baseLessons.map((lesson) => lesson.id);
const baseReadingIds = baseReadingTexts.map((text) => text.id);
const baseCultureIds = baseCultureEntries.map((entry) => entry.id);

function snapshot(database: Database): AdminContentSnapshot {
  return {
    customWords: database.customWords,
    customLessons: database.customLessons,
    customReadingTexts: database.customReadingTexts,
    customCultureEntries: database.customCultureEntries,
    readingTexts: mergeById(baseReadingTexts, database.customReadingTexts).sort(
      (left, right) => left.order - right.order,
    ),
    cultureEntries: mergeById(baseCultureEntries, database.customCultureEntries).sort(
      (left, right) => left.order - right.order,
    ),
    baseWordIds,
    baseLessonIds,
    baseReadingIds,
    baseCultureIds,
    counts: {
      customWords: database.customWords.length,
      customLessons: database.customLessons.length,
      customReadingTexts: database.customReadingTexts.length,
      customCultureEntries: database.customCultureEntries.length,
      totalWords: mergeById(baseWords, database.customWords).length,
      totalLessons: mergeById(baseLessons, database.customLessons).length,
      totalReadingTexts: mergeById(baseReadingTexts, database.customReadingTexts).length,
      totalCultureEntries: mergeById(baseCultureEntries, database.customCultureEntries).length,
    },
  };
}

export async function getAdminContentSnapshot(): Promise<AdminContentSnapshot> {
  return snapshot(await readDatabase());
}

export async function saveCustomWords(words: DictionaryWord[]): Promise<AdminContentSnapshot> {
  return updateDatabase((database) => {
    const merged = new Map(database.customWords.map((word) => [word.id, word]));
    for (const word of words) merged.set(word.id, word);
    if (merged.size > MAX_CUSTOM_WORDS) throw new Error("WORD_LIMIT");
    database.customWords = Array.from(merged.values());
    return snapshot(database);
  });
}

export async function deleteCustomWord(id: string): Promise<AdminContentSnapshot> {
  return updateDatabase((database) => {
    const next = database.customWords.filter((word) => word.id !== id);
    if (next.length === database.customWords.length) throw new Error("WORD_NOT_FOUND");
    database.customWords = next;
    return snapshot(database);
  });
}

export async function saveCustomLessons(
  lessons: GrammarLesson[],
): Promise<AdminContentSnapshot> {
  return updateDatabase((database) => {
    const merged = new Map(database.customLessons.map((lesson) => [lesson.id, lesson]));
    for (const lesson of lessons) merged.set(lesson.id, lesson);
    if (merged.size > MAX_CUSTOM_LESSONS) throw new Error("LESSON_LIMIT");
    database.customLessons = Array.from(merged.values());
    return snapshot(database);
  });
}

export async function deleteCustomLesson(id: string): Promise<AdminContentSnapshot> {
  return updateDatabase((database) => {
    const next = database.customLessons.filter((lesson) => lesson.id !== id);
    if (next.length === database.customLessons.length) throw new Error("LESSON_NOT_FOUND");
    database.customLessons = next;
    return snapshot(database);
  });
}

export async function saveCustomReadingTexts(
  texts: ReadingText[],
): Promise<AdminContentSnapshot> {
  return updateDatabase((database) => {
    const merged = new Map(database.customReadingTexts.map((text) => [text.id, text]));
    for (const text of texts) merged.set(text.id, text);
    if (merged.size > MAX_CUSTOM_READING_TEXTS) throw new Error("READING_LIMIT");
    database.customReadingTexts = Array.from(merged.values());
    return snapshot(database);
  });
}

export async function deleteCustomReadingText(id: string): Promise<AdminContentSnapshot> {
  return updateDatabase((database) => {
    const next = database.customReadingTexts.filter((text) => text.id !== id);
    if (next.length === database.customReadingTexts.length) throw new Error("READING_NOT_FOUND");
    database.customReadingTexts = next;
    return snapshot(database);
  });
}

export async function saveCustomCultureEntries(
  entries: CultureEntry[],
): Promise<AdminContentSnapshot> {
  return updateDatabase((database) => {
    const merged = new Map(database.customCultureEntries.map((entry) => [entry.id, entry]));
    for (const entry of entries) merged.set(entry.id, entry);
    if (merged.size > MAX_CUSTOM_CULTURE_ENTRIES) throw new Error("CULTURE_LIMIT");
    database.customCultureEntries = Array.from(merged.values());
    return snapshot(database);
  });
}

export async function deleteCustomCultureEntry(id: string): Promise<AdminContentSnapshot> {
  return updateDatabase((database) => {
    const next = database.customCultureEntries.filter((entry) => entry.id !== id);
    if (next.length === database.customCultureEntries.length) throw new Error("CULTURE_NOT_FOUND");
    database.customCultureEntries = next;
    return snapshot(database);
  });
}
