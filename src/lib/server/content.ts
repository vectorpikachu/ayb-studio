import { words as baseWords, type DictionaryWord, type PartOfSpeech } from "@/data/dictionary";
import { lexiconWords, type LexiconWord } from "@/data/lexicon";
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
import { practicalTranslit } from "@/lib/practical-translit";
import { readDatabase } from "./db";

function extendedLevel(rank: number): "A1" | "A2" | "B1" {
  if (rank <= 300) return "A1";
  if (rank <= 600) return "A2";
  return "B1";
}

function toDictionaryWord(entry: LexiconWord): DictionaryWord {
  return {
    id: entry.id,
    hy: entry.hy,
    translit: entry.translit,
    pos: entry.pos as PartOfSpeech,
    level: extendedLevel(entry.rank),
    category: entry.category,
    en: entry.en,
    ru: entry.ru,
    zh: entry.zh,
    example: entry.example,
  };
}

function normalizeTranslit(word: DictionaryWord): DictionaryWord {
  return {
    ...word,
    translit: practicalTranslit(word.hy),
    example: word.example
      ? { ...word.example, translit: practicalTranslit(word.example.hy) }
      : undefined,
  };
}

export async function getContentWords(): Promise<DictionaryWord[]> {
  const database = await readDatabase();
  const extendedWords = lexiconWords.map(toDictionaryWord);
  return mergeById([...baseWords, ...extendedWords], database.customWords).map(normalizeTranslit);
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
