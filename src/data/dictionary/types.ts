export type CategoryId =
  | "essentials"
  | "people"
  | "food"
  | "nature"
  | "places"
  | "body"
  | "time"
  | "description"
  | "actions"
  | "culture";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "phrase"
  | "pronoun"
  | "interjection"
  | "numeral"
  | "particle";

export type WordLevel = "A1" | "A2" | "B1";

export type WordExample = {
  hy: string;
  translit: string;
  en: string;
  zh: string;
};

export type DictionaryWord = {
  id: string;
  hy: string;
  translit: string;
  pos: PartOfSpeech;
  level: WordLevel;
  category: CategoryId;
  en: string;
  ru: string;
  zh: string;
  example: WordExample;
  note?: string;
};

export type DictionaryCategory = {
  id: CategoryId;
  label: string;
  en: string;
  hy: string;
  description: string;
  accent: string;
};
