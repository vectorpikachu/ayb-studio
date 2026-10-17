import type { MetadataRoute } from "next";
import { grammarLessons } from "@/data/grammar";
import { getSiteUrl } from "@/lib/server/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getSiteUrl();
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
  ];
}
