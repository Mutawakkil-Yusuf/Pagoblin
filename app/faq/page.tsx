import type { Metadata } from "next";
import Link from "next/link";
import { AppPage } from "@/components/nav/AppPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { StaticFaq } from "@/components/site/StaticFaq";
import { pageMetadata } from "@/lib/seo/meta";
import { breadcrumbSchema, faqPageSchema, webPageSchema } from "@/lib/seo/schema";

export const metadata: Metadata = pageMetadata({
  title: "FAQ — privacy, offline use, limits and Pro",
  description:
    "Answers to the questions people ask most about Pagoblin: are files uploaded, does it work offline, is it free, what are the limits, and what happens with Pro.",
  path: "/faq",
});

const PRIVACY_FAQ = [
  {
    q: "Are my files uploaded?",
    a: "No. Every tool runs in your browser, on your device. There is no upload step and no server that sees your PDFs. The Content-Security-Policy also forbids outbound connections.",
  },
  {
    q: "Do you keep a copy of my documents?",
    a: "There is no server copy to keep. The file is read into the tab, processed locally, and handed back as a download or share. Saved flows are stored in your browser's IndexedDB on that device.",
  },
  {
    q: "Do you use analytics or cookies?",
    a: "This build sets no cookies and ships no analytics. If the optional Plausible integration is enabled by the operator, it receives page URLs and aggregate counts only — never file names, file contents or an identity.",
  },
  {
    q: "Can I check the privacy claim?",
    a: "Yes. /proof shows a live network monitor, the exact CSP and the build's source hash. The full source is public under AGPL-3.0.",
  },
];

const OFFLINE_FAQ = [
  {
    q: "Does Pagoblin work offline?",
    a: "Yes, after the page has loaded once. The app shell is cached. Settings → Work offline downloads the heavier engines so they are ready before the connection drops. OCR language packs are cached the first time you use them.",
  },
  {
    q: "Do I have to install it?",
    a: "No. You can use Pagoblin in a browser tab. Installing it as a PWA gives you an app icon and a more reliable offline start.",
  },
  {
    q: "Where are my saved flows stored?",
    a: "In your browser's IndexedDB, on that device only. Clearing site data removes them. They are not synced or backed up to a server.",
  },
  {
    q: "Why is a large file slow on my phone?",
    a: "The work happens on your device, so memory and CPU are the limit. Close other tabs, use a smaller page range, or move to a laptop for very large files.",
  },
];

const TOOL_FAQ = [
  {
    q: "Is Pagoblin really free?",
    a: "Yes. Every current tool, including batch processing and OCR, is free with no watermark, no daily task cap and no account. A one-time Pro licence is planned for future extras, but nothing is for sale today.",
  },
  {
    q: "Is there a file size limit?",
    a: "There is no hard limit. Very large PDFs are bounded by device memory. Pagoblin warns before a job that may be too heavy.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. The interface is responsive and installable. Large jobs are still better on a laptop, but everyday merges, splits, compressions and signatures work on a phone.",
  },
  {
    q: "Does it work with scanned PDFs?",
    a: "Yes. Use OCR to make a scan searchable. Handwriting and very small print are harder for any OCR engine.",
  },
  {
    q: "Can I fill PDF forms?",
    a: "Yes, for AcroForm text fields, checkboxes, radio groups, dropdowns and option lists. XFA-only forms are not supported; the page tells you when it detects one.",
  },
  {
    q: "Can I edit the text of a PDF?",
    a: "No. Pagoblin is a toolkit for merging, splitting, compressing, converting, signing, redacting, forms and OCR. It is not a full PDF text editor.",
  },
];

const PRO_FAQ = [
  {
    q: "What is Pagoblin Pro?",
    a: "A planned one-time licence for future extras such as a native desktop app and Teams self-hosting. It is not a subscription and it is not for sale yet. The free browser tools stay free.",
  },
  {
    q: "Will batch processing and OCR stay free?",
    a: "Yes. They are free today and there is no plan to put the current browser tools behind a paywall. If that ever changes, it will be announced clearly before it happens, not slipped in.",
  },
  {
    q: "Do I need an account for Pro?",
    a: "No. The plan is an offline licence key, not an account. There is no team dashboard, no cloud storage and no login wall.",
  },
  {
    q: "Can I pay now?",
    a: "No. There is no checkout and no pre-order. When Pro exists, the price and terms will be shown before anything is charged.",
  },
];

const ALL_FAQ = [...PRIVACY_FAQ, ...OFFLINE_FAQ, ...TOOL_FAQ, ...PRO_FAQ];

export default function FaqPage() {
  return (
    <AppPage width={720} chrome={false}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          webPageSchema({
            name: "Pagoblin FAQ",
            description:
              "Answers about privacy, offline use, limits and the planned Pro licence.",
            path: "/faq",
            type: "WebPage",
          }),
          faqPageSchema(ALL_FAQ),
        ]}
      />

      <div className="mt-10 md:mt-14">
        <p className="text-small font-bold uppercase tracking-[0.14em] text-amber">Questions</p>
        <h1 className="mt-3 font-display text-[clamp(38px,6vw,56px)] font-extrabold leading-[1.03] tracking-[-0.03em] text-cream">
          Frequently asked questions
        </h1>
        <p className="mt-4 text-body-l leading-7 text-muted">
          Short answers to the things people ask before they trust a PDF tool with a document. Each tool
          page also has its own questions.
        </p>
      </div>

      <section aria-labelledby="faq-privacy" className="mt-12">
        <h2 id="faq-privacy" className="font-display text-h2 text-cream">
          Privacy
        </h2>
        <StaticFaq items={PRIVACY_FAQ} />
      </section>

      <section aria-labelledby="faq-offline" className="mt-12">
        <h2 id="faq-offline" className="font-display text-h2 text-cream">
          Offline and install
        </h2>
        <StaticFaq items={OFFLINE_FAQ} />
      </section>

      <section aria-labelledby="faq-tools" className="mt-12">
        <h2 id="faq-tools" className="font-display text-h2 text-cream">
          Tools and limits
        </h2>
        <StaticFaq items={TOOL_FAQ} />
        <p className="mt-4 text-body text-muted">
          Looking for a specific tool? Start with{" "}
          <Link href="/app/tools" className="text-amber underline">
            all tools
          </Link>
          ,{" "}
          <Link href="/offline-pdf-tools" className="text-amber underline">
            offline tools
          </Link>{" "}
          or the{" "}
          <Link href="/docs" className="text-amber underline">
            docs
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="faq-pro" className="mt-12">
        <h2 id="faq-pro" className="font-display text-h2 text-cream">
          Pro and pricing
        </h2>
        <StaticFaq items={PRO_FAQ} />
        <p className="mt-4 text-body text-muted">
          Read the current{" "}
          <Link href="/pro" className="text-amber underline">
            Pro page
          </Link>{" "}
          for the exact status. Nothing is for sale yet.
        </p>
      </section>

      <div className="mt-12 rounded-card-l border-2 border-line bg-surface p-6">
        <h2 className="font-display text-h3 text-cream">Still have a question?</h2>
        <p className="mt-2 text-body text-muted">
          Open a GitHub issue. There is no support mailbox on a custom domain yet.
        </p>
        <Link
          href="/support"
          className="mt-4 inline-flex min-h-[48px] items-center rounded-pill bg-amber px-6 font-bold text-ink"
        >
          Contact support
        </Link>
      </div>
    </AppPage>
  );
}
