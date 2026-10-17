export type CultureCategory = "history" | "culture" | "people" | "geography";

export type CultureSection = {
  id: string;
  heading: string;
  paragraphs: string[];
};

export type CultureEntry = {
  id: string;
  order: number;
  category: CultureCategory;
  title: string;
  titleHy: string;
  subtitle: string;
  summary: string;
  sections: CultureSection[];
  facts?: { label: string; value: string }[];
  related?: { href: string; label: string }[];
};
