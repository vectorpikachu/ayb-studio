import { words as baseWords } from "@/data/dictionary";
import { grammarLessons as baseLessons } from "@/data/grammar";
import type { DictionaryWord } from "@/data/dictionary/types";
import type { GrammarLesson } from "@/data/grammar/types";
import { mergeById } from "@/lib/content-utils";
import type { Database } from "./db-types";
import { readDatabase, updateDatabase } from "./db";

const MAX_CUSTOM_WORDS = 5000;
const MAX_CUSTOM_LESSONS = 500;

export type AdminContentSnapshot = {
  customWords: DictionaryWord[];
  customLessons: GrammarLesson[];
  baseWordIds: string[];
  baseLessonIds: string[];
  counts: {
    customWords: number;
    customLessons: number;
    totalWords: number;
    totalLessons: number;
  };
};

const baseWordIds = baseWords.map((word) => word.id);
const baseLessonIds = baseLessons.map((lesson) => lesson.id);

function snapshot(database: Database): AdminContentSnapshot {
  return {
    customWords: database.customWords,
    customLessons: database.customLessons,
    baseWordIds,
    baseLessonIds,
    counts: {
      customWords: database.customWords.length,
      customLessons: database.customLessons.length,
      totalWords: mergeById(baseWords, database.customWords).length,
      totalLessons: mergeById(baseLessons, database.customLessons).length,
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
