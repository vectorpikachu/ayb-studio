import type { DictionaryWord } from "./types";
import { actions } from "./actions";
import { body } from "./body";
import { culture } from "./culture";
import { description } from "./description";
import { essentials } from "./essentials";
import { food } from "./food";
import { nature } from "./nature";
import { people } from "./people";
import { places } from "./places";
import { time } from "./time";

export type {
  CategoryId,
  DictionaryCategory,
  DictionaryWord,
  PartOfSpeech,
  WordExample,
  WordLevel,
} from "./types";

export {
  ARMENIAN_ALPHABET,
  categoryMap,
  dictionaryCategories,
  levelLabels,
  posLabels,
} from "./meta";

export const words: DictionaryWord[] = [
  ...essentials,
  ...people,
  ...food,
  ...nature,
  ...places,
  ...body,
  ...time,
  ...description,
  ...actions,
  ...culture,
];

const wordsById = new Map(words.map((word) => [word.id, word]));

export function getWordById(id: string): DictionaryWord | undefined {
  return wordsById.get(id);
}

export function getCategoryCount(categoryId: string): number {
  return words.filter((word) => word.category === categoryId).length;
}

const dailyWordIds = [
  "nurr",
  "barev",
  "ser",
  "arev",
  "tsov",
  "girk",
  "yerevan",
  "tsiran",
  "lusin",
  "sirt",
  "hayeren",
  "lerr",
  "grich",
  "hats",
];

export function getWordOfTheDay(date = new Date(), source: DictionaryWord[] = words): DictionaryWord {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  const id = dailyWordIds[day % dailyWordIds.length];
  return source.find((word) => word.id === id) ?? source[0] ?? words[0];
}
