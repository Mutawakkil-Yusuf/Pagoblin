import { AUTHOR_NAME, REPO_URL } from "@/lib/links";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";

export type FaqItem = { q: string; a: string };

/** FAQPage JSON-LD. Every question and answer is also visible in the page. */
export function faqPageSchema(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbSchema(items: readonly { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Free WebApplication schema for a single on-device tool. */
export function webApplicationSchema(opts: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (runs in a browser)",
    browserRequirements: "Requires JavaScript and WebAssembly",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Person", name: AUTHOR_NAME, sameAs: [REPO_URL] },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export function webPageSchema(opts: {
  name: string;
  description: string;
  path: string;
  type?: "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "TechArticle";
}) {
  return {
    "@context": "https://schema.org",
    "@type": opts.type ?? "WebPage",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}
