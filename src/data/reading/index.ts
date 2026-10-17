import { myMorning } from "./01-my-morning";
import { woundsOfArmenia } from "./02-wounds-of-armenia";
import { charentsHayastani } from "./03-charents";
import type { ReadingText } from "./types";

export type {
  ReadingGrammarPoint,
  ReadingLevel,
  ReadingParagraph,
  ReadingText,
  ReadingWord,
} from "./types";

export const readingTexts: ReadingText[] = [myMorning, woundsOfArmenia, charentsHayastani];

export const readingLevelLabels = {
  A1: "基础",
  A2: "进阶",
  B1: "深入",
  B2: "精进",
} as const;

const textMap = new Map(readingTexts.map((text) => [text.id, text]));

export function getReadingText(id: string): ReadingText | undefined {
  return textMap.get(id);
}

export function getAdjacentReadingTexts(id: string) {
  const index = readingTexts.findIndex((text) => text.id === id);
  return {
    previous: index > 0 ? readingTexts[index - 1] : null,
    next: index >= 0 && index < readingTexts.length - 1 ? readingTexts[index + 1] : null,
  };
}

export function countArmenianWords(text: ReadingText): number {
  return text.paragraphs.reduce(
    (total, paragraph) => total + paragraph.hy.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
}
