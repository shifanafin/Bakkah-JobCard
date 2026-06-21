import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://bakkah.ae";
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/track`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
