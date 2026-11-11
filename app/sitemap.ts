import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

type Route = {
  path: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
};

const ROUTES: Route[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/app", priority: 0.7, changeFrequency: "monthly" },
  { path: "/app/tools", priority: 0.7, changeFrequency: "monthly" },

  // Primary tools
  { path: "/merge-pdf", priority: 0.9, changeFrequency: "monthly" },
  { path: "/split-pdf", priority: 0.9, changeFrequency: "monthly" },
  { path: "/organize-pdf", priority: 0.8, changeFrequency: "monthly" },
  { path: "/compress-pdf", priority: 0.9, changeFrequency: "monthly" },
  { path: "/convert-pdf", priority: 0.8, changeFrequency: "monthly" },
  { path: "/sign-pdf", priority: 0.8, changeFrequency: "monthly" },
  { path: "/protect-pdf", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pdf-metadata", priority: 0.7, changeFrequency: "monthly" },
  { path: "/sanitize-pdf", priority: 0.8, changeFrequency: "monthly" },
  { path: "/verify-pdf", priority: 0.8, changeFrequency: "monthly" },
  { path: "/redact-pdf", priority: 0.9, changeFrequency: "monthly" },
  { path: "/form-pdf", priority: 0.7, changeFrequency: "monthly" },
  { path: "/ocr-pdf", priority: 0.8, changeFrequency: "monthly" },
  { path: "/batch-pdf", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pdf-to-text", priority: 0.8, changeFrequency: "monthly" },

  // Format and intent pages
  { path: "/compress-pdf-to-2mb", priority: 0.9, changeFrequency: "monthly" },
  { path: "/compress-pdf-offline", priority: 0.8, changeFrequency: "monthly" },
  { path: "/redact-pdf-offline", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pdf-to-jpg", priority: 0.8, changeFrequency: "monthly" },
  { path: "/jpg-to-pdf", priority: 0.8, changeFrequency: "monthly" },
  { path: "/offline-pdf-tools", priority: 0.8, changeFrequency: "monthly" },
  { path: "/flows", priority: 0.6, changeFrequency: "monthly" },

  // Comparisons and resources
  { path: "/compare", priority: 0.7, changeFrequency: "monthly" },
  { path: "/compare/smallpdf", priority: 0.7, changeFrequency: "monthly" },
  { path: "/compare/ilovepdf", priority: 0.7, changeFrequency: "monthly" },
  { path: "/compare/adobe-acrobat-online", priority: 0.7, changeFrequency: "monthly" },
  { path: "/docs", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/support", priority: 0.4, changeFrequency: "yearly" },
  { path: "/status", priority: 0.4, changeFrequency: "weekly" },
  { path: "/proof", priority: 0.7, changeFrequency: "monthly" },
  { path: "/pro", priority: 0.5, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.5, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path || "/"}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
