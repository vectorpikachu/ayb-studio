import { cultureEntries } from "./entries";
import type { CultureCategory, CultureEntry } from "./types";

export type {
  CultureCategory,
  CultureEntry,
  CultureSection,
} from "./types";

export { cultureEntries };

export const cultureCategoryLabels: Record<
  CultureCategory,
  { label: string; hy: string; description: string }
> = {
  history: {
    label: "历史",
    hy: "Պատմություն",
    description: "王朝、战争、记忆与那些改变了语言的事情。",
  },
  culture: {
    label: "文化",
    hy: "Մշակույթ",
    description: "石头、声音、面包与日常里的仪式。",
  },
  people: {
    label: "人物",
    hy: "Մարդիկ",
    description: "字母、诗歌与启蒙背后的人。",
  },
  geography: {
    label: "地理",
    hy: "Աշխարհագրություն",
    description: "山、湖、城市，以及它们如何塑造想象。",
  },
};

export const cultureCategories = (
  Object.keys(cultureCategoryLabels) as CultureCategory[]
).map((category) => ({
  id: category,
  ...cultureCategoryLabels[category],
  count: cultureEntries.filter((entry) => entry.category === category).length,
}));

export function getCultureEntry(id: string): CultureEntry | undefined {
  return cultureEntries.find((entry) => entry.id === id);
}

export function sortCultureEntries(entries: CultureEntry[]): CultureEntry[] {
  return [...entries].sort((left, right) => left.order - right.order);
}

export function getAdjacentCultureEntries(entries: CultureEntry[], id: string) {
  const index = entries.findIndex((entry) => entry.id === id);
  return {
    previous: index > 0 ? entries[index - 1] : null,
    next: index >= 0 && index < entries.length - 1 ? entries[index + 1] : null,
  };
}
