import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pagoblin.app"; // set for the canonical domain
  const routes = [
    "",
    "/app",
    "/app/tools",
    "/merge-pdf",
    "/split-pdf",
    "/organize-pdf",
    "/compress-pdf",
    "/compress-pdf-to-2mb",
    "/convert-pdf",
    "/pdf-to-jpg",
    "/jpg-to-pdf",
    "/pdf-to-text",
    "/sign-pdf",
    "/protect-pdf",
    "/pdf-metadata",
    "/redact-pdf",
    "/form-pdf",
    "/ocr-pdf",
    "/batch-pdf",
    "/flows",
    "/pro",
    "/about",
    "/privacy",
    "/terms",
  ];
  const now = new Date();
  return routes.map((r) => ({
    url: `${base}${r || "/"}`,
    lastModified: now,
    changeFrequency: r === "" ? "weekly" : "monthly",
    priority: r === "" ? 1 : r.startsWith("/app") ? 0.6 : 0.8,
  }));
}
