import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/track", "/icons/", "/logo.png", "/logo.svg"],
        disallow: ["/workshop/", "/auth/", "/api/", "/invoice/"],
      },
    ],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
