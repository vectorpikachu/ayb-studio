import type { MetadataRoute } from "next";
import {
  getContentCultureEntries,
  getContentGrammarLessons,
  getContentReadingTexts,
} from "@/lib/server/content";
import { getSiteUrl } from "@/lib/server/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [baseUrl, grammarLessons, readingTexts, cultureEntries] = await Promise.all([
    getSiteUrl(),
    getContentGrammarLessons(),
    getContentReadingTexts(),
    getContentCultureEntries(),
  ]);
  const now = new Date();
  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/dictionary`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/grammar`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...grammarLessons.map((lesson) => ({
      url: `${baseUrl}/grammar/${lesson.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${baseUrl}/reading`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...readingTexts.map((text) => ({
      url: `${baseUrl}/reading/${text.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${baseUrl}/culture`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...cultureEntries.map((entry) => ({
      url: `${baseUrl}/culture/${entry.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
