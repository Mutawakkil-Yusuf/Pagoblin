import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Pagoblin — private PDF tools that never ask for your files",
} as const;

/** Shared metadata for content pages, so canonical and social tags agree. */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(opts.path);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      type: opts.type ?? "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [OG_IMAGE.url],
    },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
