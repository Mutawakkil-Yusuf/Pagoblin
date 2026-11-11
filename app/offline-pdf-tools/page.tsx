import type { Metadata } from "next";
import Link from "next/link";
import { AppPage } from "@/components/nav/AppPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { StaticFaq } from "@/components/site/StaticFaq";
import { pageMetadata } from "@/lib/seo/meta";
import { breadcrumbSchema, faqPageSchema, webPageSchema } from "@/lib/seo/schema";
import { PRIMARY_TOOL_PATHS, TOOL_SEO } from "@/lib/seo/tools";

export const metadata: Metadata = pageMetadata({
  title: "Offline PDF tools — works without internet",
  description:
    "Merge, split, compress, sign, redact and OCR PDFs offline in your browser. No uploads, no accounts, no server. Install once and keep working without a connection.",
  path: "/offline-pdf-tools",
});

const FAQ = [
  {
    q: "Which Pagoblin tools work offline?",
    a: "All 15 tools run on your device. After the page has loaded once, the app shell is cached. Settings → Work offline also downloads the heavier engines (Ghostscript, pdf.js, qpdf and OCR) so they are ready before the connection drops.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. You can use Pagoblin in a browser tab. Installing it as a PWA gives you an app icon and a more reliable offline start, but it is optional.",
  },
  {
    q: "Are OCR language packs included offline?",
    a: "English, Spanish, French and German packs are served by Pagoblin itself. The pack you choose is cached on the device after first use, so later OCR runs work offline.",
  },
  {
    q: "What is the catch?",
    a: "Local processing uses your device's memory and CPU. Very large PDFs can be slow on a phone, and there is no cloud storage, sync or server-side Office conversion. The upside is that the file never leaves the device.",
  },
  {
    q: "Can I check the offline claim?",
    a: "Yes. Load a tool once, switch off Wi-Fi, and run it again. /proof also shows the live network monitor, the exact CSP and the build's source hash.",
  },
];

export default function OfflinePdfToolsPage() {
  const tools = PRIMARY_TOOL_PATHS.map((path) => TOOL_SEO[path]).filter(Boolean);

  return (
    <AppPage width="wide" chrome={false}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Offline PDF tools", path: "/offline-pdf-tools" },
          ]),
          webPageSchema({
            name: "Offline PDF tools — works without internet",
            description:
              "Merge, split, compress, sign, redact and OCR PDFs offline in your browser. No uploads, no accounts, no server.",
            path: "/offline-pdf-tools",
            type: "CollectionPage",
          }),
          faqPageSchema(FAQ),
        ]}
      />

      <div className="mt-10 max-w-[760px] md:mt-14">
        <p className="text-small font-bold uppercase tracking-[0.14em] text-amber">Offline PDF toolkit</p>
        <h1 className="mt-3 font-display text-[clamp(38px,6vw,64px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-cream">
          PDF tools that work with the Wi-Fi off
        </h1>
        <p className="mt-5 text-body-l leading-7 text-muted">
          Every Pagoblin tool runs in your browser, on your device. There is no upload step, no account
          and no server in the file path. Load a tool once, install the app if you like, and keep working
          on a plane, in a basement, or on a machine that is not allowed to send documents anywhere.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/app"
            className="inline-flex min-h-[52px] items-center rounded-pill bg-orange px-7 font-bold text-ink"
          >
            Open the toolkit
          </Link>
          <Link
            href="/proof"
            className="inline-flex min-h-[52px] items-center rounded-pill border-2 border-line bg-surface px-7 font-bold text-cream hover:border-amber"
          >
            See the proof
          </Link>
        </div>
      </div>

      <section aria-labelledby="offline-tools" className="mt-14">
        <h2 id="offline-tools" className="font-display text-h2 text-cream">
          15 tools, all local
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex min-h-[120px] flex-col justify-between rounded-card-l border border-line bg-surface p-5 hover:border-amber"
            >
              <span className="font-display text-h3 text-cream">{tool.name}</span>
              <span className="mt-2 text-small text-muted">{tool.short}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="offline-how" className="mt-14 max-w-[760px]">
        <h2 id="offline-how" className="font-display text-h2 text-cream">
          How offline mode works
        </h2>
        <ol className="mt-5 space-y-4 text-body leading-6 text-muted">
          <li>
            <strong className="text-cream">1. Load the page once.</strong> The service worker caches the
            app shell, fonts and tool pages from Pagoblin&rsquo;s own origin.
          </li>
          <li>
            <strong className="text-cream">2. Warm the engines.</strong> Settings → Work offline downloads
            the heavier engines. You can also just use a tool once; its engine is cached on demand.
          </li>
          <li>
            <strong className="text-cream">3. Go offline.</strong> The tools keep working because the
            processing already happens on your device. Nothing queues, retries or phones home.
          </li>
        </ol>
        <p className="mt-5 text-body leading-6 text-muted">
          The honest limit: local work is bounded by your device. A 300 MB PDF on an old phone may be
          slow, and OCR is CPU-heavy. Pagoblin warns you before a big job rather than pretending the
          device has unlimited memory.
        </p>
      </section>

      <section aria-labelledby="offline-faq" className="mt-14 max-w-[760px]">
        <h2 id="offline-faq" className="font-display text-h2 text-cream">
          Offline questions
        </h2>
        <StaticFaq items={FAQ} />
      </section>

      <section className="mt-14 rounded-card-l border-2 border-line bg-surface p-6 md:p-8">
        <h2 className="font-display text-h3 text-cream">Prefer a comparison?</h2>
        <p className="mt-2 max-w-[620px] text-body text-muted">
          See how the local model compares with Smallpdf, iLovePDF and Adobe Acrobat online — including
          where a cloud suite is the better choice.
        </p>
        <Link
          href="/compare"
          className="mt-5 inline-flex min-h-[48px] items-center rounded-pill bg-amber px-6 font-bold text-ink"
        >
          Compare Pagoblin
        </Link>
      </section>
    </AppPage>
  );
}
