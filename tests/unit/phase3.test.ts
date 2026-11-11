import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { COMPARISON_ROWS, COMPETITORS, competitorFor } from "@/lib/compare/data";
import { pageMetadata } from "@/lib/seo/meta";
import {
  breadcrumbSchema,
  faqPageSchema,
  webApplicationSchema,
  webPageSchema,
} from "@/lib/seo/schema";
import { PRIMARY_TOOL_PATHS, TOOL_SEO, relatedToolsFor } from "@/lib/seo/tools";
import { absoluteUrl, SITE_URL } from "@/lib/site";

describe("Phase 3 distribution surface", () => {
  it("publishes the comparison, docs and intent routes in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const path of [
      "/compare",
      "/compare/smallpdf",
      "/compare/ilovepdf",
      "/compare/adobe-acrobat-online",
      "/docs",
      "/faq",
      "/support",
      "/status",
      "/redact-pdf-offline",
      "/compress-pdf-offline",
      "/offline-pdf-tools",
      "/compress-pdf-to-2mb",
    ]) {
      expect(urls).toContain(`${SITE_URL}${path}`);
    }
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith(SITE_URL))).toBe(true);
  });

  it("keeps the launch kit out of the indexable sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith("/launch"))).toBe(false);
  });

  it("has three competitors with complete comparison rows", () => {
    expect(COMPETITORS.map((c) => c.slug)).toEqual([
      "smallpdf",
      "ilovepdf",
      "adobe-acrobat-online",
    ]);
    expect(COMPARISON_ROWS.length).toBeGreaterThanOrEqual(8);
    for (const row of COMPARISON_ROWS) {
      expect(row.label.length).toBeGreaterThan(0);
      for (const competitor of COMPETITORS) {
        expect(row.values[competitor.slug].length).toBeGreaterThan(0);
      }
      expect(row.values.pagoblin.length).toBeGreaterThan(0);
    }
    for (const competitor of COMPETITORS) {
      expect(competitorFor(competitor.slug)).toBe(competitor);
      expect(competitor.faq.length).toBeGreaterThanOrEqual(3);
      expect(competitor.bestFor.length).toBeGreaterThanOrEqual(2);
      expect(competitor.pagoblinFor.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps every related-tool link valid and non-circular", () => {
    for (const path of PRIMARY_TOOL_PATHS) {
      const tool = TOOL_SEO[path];
      expect(tool, path).toBeDefined();
      expect(tool.href).toBe(path);
      expect(tool.related.length).toBeGreaterThanOrEqual(2);
      for (const href of tool.related) {
        expect(TOOL_SEO[href], `${path} -> ${href}`).toBeDefined();
        expect(href).not.toBe(path);
      }
    }
    expect(relatedToolsFor("/redact-pdf").map((tool) => tool.href)).toContain(
      "/redact-pdf-offline",
    );
    expect(relatedToolsFor("/not-a-tool")).toEqual([]);
  });

  it("builds valid FAQ, breadcrumb and application schema", () => {
    const faq = faqPageSchema([{ q: "Are files uploaded?", a: "No." }]);
    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "Are files uploaded?",
      acceptedAnswer: { "@type": "Answer", text: "No." },
    });

    const crumbs = breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Compare", path: "/compare" },
    ]);
    expect(crumbs["@type"]).toBe("BreadcrumbList");
    expect(crumbs.itemListElement[1]).toMatchObject({
      position: 2,
      name: "Compare",
      item: `${SITE_URL}/compare`,
    });

    const app = webApplicationSchema({
      name: "Merge PDFs — Pagoblin",
      description: "Combine files.",
      path: "/merge-pdf",
    });
    expect(app["@type"]).toBe("WebApplication");
    expect(app.offers).toMatchObject({ price: "0" });
    expect(app.isAccessibleForFree).toBe(true);

    const page = webPageSchema({
      name: "Docs",
      description: "How to use Pagoblin.",
      path: "/docs",
      type: "TechArticle",
    });
    expect(page["@type"]).toBe("TechArticle");
  });

  it("generates canonical and social metadata for content pages", () => {
    const meta = pageMetadata({
      title: "Compare Pagoblin",
      description: "An honest comparison.",
      path: "/compare",
    });
    expect(meta.alternates?.canonical).toBe("/compare");
    expect(meta.openGraph?.url).toBe(absoluteUrl("/compare"));
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("uses the Vercel deployment URL until a custom domain exists", () => {
    expect(SITE_URL).toBe("https://pagoblin.vercel.app");
    expect(absoluteUrl("/docs")).toBe("https://pagoblin.vercel.app/docs");
  });
});
