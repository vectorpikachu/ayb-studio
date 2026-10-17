import { words as baseWords, type DictionaryWord } from "@/data/dictionary";
import {
  grammarLessons as baseLessons,
  grammarLevelLabels,
  type GrammarLesson,
} from "@/data/grammar";
import { readingTexts as baseReadingTexts } from "@/data/reading";
import type { ReadingText } from "@/data/reading/types";
import { cultureEntries as baseCultureEntries } from "@/data/culture";
import type { CultureEntry } from "@/data/culture/types";
import { mergeById } from "@/lib/content-utils";
import { readDatabase } from "./db";

export async function getContentWords(): Promise<DictionaryWord[]> {
  const database = await readDatabase();
  return mergeById(baseWords, database.customWords);
}

export async function getContentWordById(id: string): Promise<DictionaryWord | undefined> {
  const words = await getContentWords();
  return words.find((word) => word.id === id);
}

export async function getContentGrammarLessons(): Promise<GrammarLesson[]> {
  const database = await readDatabase();
  return mergeById(baseLessons, database.customLessons).sort(
    (left, right) => left.order - right.order,
  );
}

export async function getContentGrammarLesson(id: string): Promise<GrammarLesson | undefined> {
  const lessons = await getContentGrammarLessons();
  return lessons.find((lesson) => lesson.id === id);
}

export function buildGrammarGroups(lessons: GrammarLesson[]) {
  return (["A1", "A2", "B1", "B2"] as const).map((level) => ({
    level,
    label: grammarLevelLabels[level],
    lessons: lessons.filter((lesson) => lesson.level === level),
  }));
}

export function findAdjacentLessons(lessons: GrammarLesson[], id: string) {
  const index = lessons.findIndex((lesson) => lesson.id === id);
  return {
    previous: index > 0 ? lessons[index - 1] : null,
    next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null,
  };
}

export async function getContentReadingTexts(): Promise<ReadingText[]> {
  const database = await readDatabase();
  return mergeById(baseReadingTexts, database.customReadingTexts).sort(
    (left, right) => left.order - right.order,
  );
}

export async function getContentReadingText(id: string): Promise<ReadingText | undefined> {
  const texts = await getContentReadingTexts();
  return texts.find((text) => text.id === id);
}

export async function getContentCultureEntries(): Promise<CultureEntry[]> {
  const database = await readDatabase();
  return mergeById(baseCultureEntries, database.customCultureEntries).sort(
    (left, right) => left.order - right.order,
  );
}

export async function getContentCultureEntry(id: string): Promise<CultureEntry | undefined> {
  const entries = await getContentCultureEntries();
  return entries.find((entry) => entry.id === id);
}
