import { alphabetAndSounds } from "./01-alphabet";
import { helloAndPronouns } from "./02-hello";
import { toBe } from "./03-to-be";
import { nounsPluralDefinite } from "./04-nouns";
import { presentContinuous } from "./05-present";
import { questionsNegation } from "./06-questions";
import { numbersAdjectivesTime } from "./07-numbers";
import { pastAndFuture } from "./08-past-future";
import { casesAndPostpositions } from "./09-cases";
import { sevenCases } from "./10-seven-cases";
import { caseStems } from "./11-case-stems";
import { relativeClauses } from "./12-relative-clauses";
import { conditionalsSubjunctive } from "./13-conditionals";
import { passiveCausative } from "./14-passive-causative";
import { reportedSpeech } from "./15-reported-speech";
import type { GrammarLesson } from "./types";

export type {
  GrammarBlock,
  GrammarExample,
  GrammarLesson,
  GrammarLevel,
  GrammarSection,
  QuizQuestion,
} from "./types";

export const grammarLessons: GrammarLesson[] = [
  alphabetAndSounds,
  helloAndPronouns,
  toBe,
  nounsPluralDefinite,
  presentContinuous,
  questionsNegation,
  numbersAdjectivesTime,
  pastAndFuture,
  casesAndPostpositions,
  sevenCases,
  caseStems,
  relativeClauses,
  conditionalsSubjunctive,
  passiveCausative,
  reportedSpeech,
];

export const grammarLevelLabels = {
  A1: "基础",
  A2: "进阶",
  B1: "深入",
  B2: "精进",
} as const;

export const totalGrammarMinutes = grammarLessons.reduce(
  (total, lesson) => total + lesson.minutes,
  0,
);

const lessonMap = new Map(grammarLessons.map((lesson) => [lesson.id, lesson]));

export function getGrammarLesson(id: string): GrammarLesson | undefined {
  return lessonMap.get(id);
}

export function getAdjacentLessons(id: string) {
  const index = grammarLessons.findIndex((lesson) => lesson.id === id);
  return {
    previous: index > 0 ? grammarLessons[index - 1] : null,
    next: index >= 0 && index < grammarLessons.length - 1 ? grammarLessons[index + 1] : null,
  };
}

export const grammarLevelGroups = (["A1", "A2", "B1", "B2"] as const).map((level) => ({
  level,
  label: grammarLevelLabels[level],
  lessons: grammarLessons.filter((lesson) => lesson.level === level),
}));
