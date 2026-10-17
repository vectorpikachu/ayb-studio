import type { DictionaryWord } from "@/data/dictionary/types";
import type { GrammarLesson } from "@/data/grammar/types";

export type AdminContentCounts = {
  customWords: number;
  customLessons: number;
  totalWords: number;
  totalLessons: number;
};

/**
 * A small helper that can be shared by the admin UI and server-side content
 * loaders. It is deliberately dependency free so it also runs in tests.
 */
export function mergeById<T extends { id: string }>(base: T[], custom: T[]): T[] {
  const merged = new Map<string, T>();
  for (const item of base) merged.set(item.id, item);
  for (const item of custom) merged.set(item.id, item);
  return Array.from(merged.values());
}

export function countMergedWords(base: DictionaryWord[], custom: DictionaryWord[]) {
  return mergeById(base, custom).length;
}

export function countMergedLessons(base: GrammarLesson[], custom: GrammarLesson[]) {
  return mergeById(base, custom).length;
}
