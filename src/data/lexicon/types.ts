import type { CategoryId } from "../dictionary/types";

export type LexiconExample = {
  hy: string;
  translit: string;
  en: string;
  zh: string;
  ru: string;
};

export type LexiconWord = {
  id: string;
  hy: string;
  translit: string;
  en: string;
  pos: string;
  rank: number;
  category: CategoryId;
  zh: string;
  ru: string;
  example: LexiconExample;
};
