import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/server/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/dictionary", "/grammar"],
      disallow: ["/api/", "/review", "/write", "/login", "/register"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
