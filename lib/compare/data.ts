/**
 * Comparison data kept deliberately conservative. We compare the service
 * model, not volatile prices or feature counts, and every competitor page
 * points readers at the provider's own current terms.
 */
export type CompetitorSlug = "smallpdf" | "ilovepdf" | "adobe-acrobat-online";
export type ComparisonColumn = "pagoblin" | CompetitorSlug;

export type Competitor = {
  slug: CompetitorSlug;
  name: string;
  url: string;
  summary: string;
  model: string;
  bestFor: readonly string[];
  pagoblinFor: readonly string[];
  notes: readonly string[];
  faq: readonly { q: string; a: string }[];
};

export type ComparisonRow = {
  label: string;
  values: Record<ComparisonColumn, string>;
};

export const LAST_CHECKED = "November 2026";

export const COMPETITORS: readonly Competitor[] = [
  {
    slug: "smallpdf",
    name: "Smallpdf",
    url: "https://smallpdf.com",
    summary: "A polished, cloud-based PDF suite with a broad tool set and paid plans.",
    model:
      "Smallpdf processes files on its servers. That keeps the browser light, but it also means the file leaves your device.",
    bestFor: [
      "You want one polished suite for many document tasks.",
      "You need team or business features and vendor support.",
      "You are comfortable uploading the file to a cloud service.",
    ],
    pagoblinFor: [
      "The file is sensitive and should not leave your device.",
      "You need the job done offline or on a locked-down network.",
      "You want to read and audit the code that handles the file.",
    ],
    notes: [
      "Smallpdf is a mature product; its free limits, account rules and retention policy can change. Check smallpdf.com before relying on them.",
      "This comparison describes the service model, not every feature or price.",
    ],
    faq: [
      {
        q: "Is Pagoblin a drop-in replacement for Smallpdf?",
        a: "Not for every job. Pagoblin covers 15 everyday tools on your device. If you need Office conversion, cloud storage, team administration or e-signature audit trails, a cloud suite is the better fit. We would rather say that than pretend.",
      },
      {
        q: "Does Smallpdf upload files?",
        a: "Yes. Smallpdf is a cloud service: the file is sent to its servers for processing. The exact retention period and account rules are set by Smallpdf and can change; check its privacy policy.",
      },
      {
        q: "Why does Pagoblin not list Smallpdf prices?",
        a: "Prices vary by region, plan and promotion. A stale table would mislead you, so the link goes to Smallpdf's current pricing instead.",
      },
      {
        q: "Can I check Pagoblin's privacy claim?",
        a: "Yes. The source is public under AGPL-3.0, and /proof shows the live network monitor, the exact Content-Security-Policy and the build's source hash.",
      },
    ],
  },
  {
    slug: "ilovepdf",
    name: "iLovePDF",
    url: "https://www.ilovepdf.com",
    summary: "A popular cloud PDF suite with a wide set of tools and a free tier.",
    model:
      "iLovePDF processes files on its servers. It is built around a web workflow, with paid plans for heavier use.",
    bestFor: [
      "You want a familiar web suite with many PDF utilities.",
      "You need cloud workflows or team features.",
      "Uploading the file to a service is acceptable for the job.",
    ],
    pagoblinFor: [
      "The document should stay on your device from start to finish.",
      "You want to work on a plane, in a cafe with bad Wi-Fi, or on an air-gapped machine.",
      "You prefer no account, no daily task meter and no upsell.",
    ],
    notes: [
      "iLovePDF's free limits, account rules and retention policy can change. Check ilovepdf.com before relying on them.",
      "This comparison describes the service model, not every feature or price.",
    ],
    faq: [
      {
        q: "What is the main difference between Pagoblin and iLovePDF?",
        a: "Where the file goes. iLovePDF processes on its servers; Pagoblin processes in your browser on your device. That changes privacy, offline behaviour and what happens when the service is unavailable.",
      },
      {
        q: "Does iLovePDF upload files?",
        a: "Yes. It is a cloud service, so the file is sent to iLovePDF's servers for processing. Its retention and account rules are set by iLovePDF; check its current privacy policy.",
      },
      {
        q: "Which one is faster?",
        a: "It depends on the file and the device. A server can be faster for a heavy job on a weak phone; a local tool avoids the upload and download entirely. We do not claim Pagoblin wins every speed test.",
      },
      {
        q: "Can I use Pagoblin offline?",
        a: "Yes, after the first load or install. The app shell is cached, and Settings → Work offline downloads the heavier engines. OCR language packs are cached the first time you use them.",
      },
    ],
  },
  {
    slug: "adobe-acrobat-online",
    name: "Adobe Acrobat online",
    url: "https://www.adobe.com/acrobat/online.html",
    summary: "Adobe's online PDF tools, backed by the wider Acrobat ecosystem.",
    model:
      "Adobe's online tools process files on Adobe's servers. Acrobat desktop is a separate product with its own install and licence.",
    bestFor: [
      "You already use Acrobat or Creative Cloud.",
      "You need deep PDF editing, e-signature workflows or enterprise administration.",
      "You want vendor support and a long-established brand.",
    ],
    pagoblinFor: [
      "You want a free local job without an Adobe account.",
      "You need to work offline.",
      "You want to inspect the source that handles your file.",
    ],
    notes: [
      "Adobe's free online tools and account requirements change; check adobe.com for the current terms.",
      "Acrobat desktop is not the same product as Adobe Acrobat online. This page compares the online tools.",
    ],
    faq: [
      {
        q: "Is Pagoblin an Acrobat replacement?",
        a: "No. Acrobat is a deep document platform with editing, e-signature workflows, enterprise administration and desktop software. Pagoblin is a focused, local toolkit for everyday jobs. If you need Acrobat's advanced workflows, use Acrobat.",
      },
      {
        q: "Does Adobe Acrobat online upload files?",
        a: "Yes. The online tools send the file to Adobe's servers. Account requirements and retention terms are set by Adobe and can change; check its current privacy policy.",
      },
      {
        q: "Why is Pagoblin free?",
        a: "The browser tools run on your device, so there is no server bill for each job. The project is open source. A one-time Pro licence is planned for future extras such as a native desktop app and Teams self-hosting, but it is not for sale yet.",
      },
      {
        q: "Can I use Pagoblin for work documents?",
        a: "Yes, if the tool fits the job and your organisation allows browser-based software. The files stay on the device. For regulated workflows that require an audit trail or certified signatures, use a product designed for that.",
      },
    ],
  },
] as const;

export const COMPARISON_ROWS: readonly ComparisonRow[] = [
  {
    label: "Where the file is processed",
    values: {
      pagoblin: "On your device, in the browser",
      smallpdf: "On Smallpdf's servers",
      ilovepdf: "On iLovePDF's servers",
      "adobe-acrobat-online": "On Adobe's servers",
    },
  },
  {
    label: "Upload required",
    values: {
      pagoblin: "No",
      smallpdf: "Yes",
      ilovepdf: "Yes",
      "adobe-acrobat-online": "Yes",
    },
  },
  {
    label: "Works offline",
    values: {
      pagoblin: "Yes, after the first load or install",
      smallpdf: "No",
      ilovepdf: "No",
      "adobe-acrobat-online": "No for the online tools",
    },
  },
  {
    label: "Account",
    values: {
      pagoblin: "None",
      smallpdf: "Free tools available; account and plan requirements vary",
      ilovepdf: "Free tools available; account and plan requirements vary",
      "adobe-acrobat-online": "Adobe account generally required; check current terms",
    },
  },
  {
    label: "Free tier",
    values: {
      pagoblin: "Every current tool, no daily task cap",
      smallpdf: "Free tasks with limits; paid plan for more",
      ilovepdf: "Free tasks with limits; paid plan for more",
      "adobe-acrobat-online": "Limited free tools; paid plan for more",
    },
  },
  {
    label: "Batch processing",
    values: {
      pagoblin: "Yes, local queue with zip output",
      smallpdf: "Plan-dependent; check current terms",
      ilovepdf: "Plan-dependent; check current terms",
      "adobe-acrobat-online": "Plan-dependent; check current terms",
    },
  },
  {
    label: "OCR",
    values: {
      pagoblin: "Yes, local Tesseract",
      smallpdf: "Available; plan and limits vary",
      ilovepdf: "Available; plan and limits vary",
      "adobe-acrobat-online": "Available; plan and limits vary",
    },
  },
  {
    label: "Desktop app",
    values: {
      pagoblin: "Installable PWA; native desktop not shipped yet",
      smallpdf: "Web app; check current desktop offerings",
      ilovepdf: "Web app; check current desktop offerings",
      "adobe-acrobat-online": "Acrobat desktop is a separate product",
    },
  },
  {
    label: "Open source",
    values: {
      pagoblin: "Yes, AGPL-3.0",
      smallpdf: "No",
      ilovepdf: "No",
      "adobe-acrobat-online": "No",
    },
  },
  {
    label: "Ads and upsells",
    values: {
      pagoblin: "None",
      smallpdf: "Free tier may show upsells; check current site",
      ilovepdf: "Free tier may show upsells; check current site",
      "adobe-acrobat-online": "Free tier may show upsells; check current site",
    },
  },
  {
    label: "Price model",
    values: {
      pagoblin: "Free core; Pro planned, not on sale",
      smallpdf: "Free tier plus subscription",
      ilovepdf: "Free tier plus subscription",
      "adobe-acrobat-online": "Free tools plus subscription",
    },
  },
  {
    label: "Data retention",
    values: {
      pagoblin: "No upload, so no server copy",
      smallpdf: "See provider's privacy policy",
      ilovepdf: "See provider's privacy policy",
      "adobe-acrobat-online": "See provider's privacy policy",
    },
  },
] as const;

export function competitorFor(slug: string): Competitor | undefined {
  return COMPETITORS.find((item) => item.slug === slug);
}
