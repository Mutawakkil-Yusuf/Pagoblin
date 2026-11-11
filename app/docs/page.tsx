import type { Metadata } from "next";
import Link from "next/link";
import { AppPage } from "@/components/nav/AppPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/meta";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { PRIMARY_TOOL_PATHS, TOOL_SEO } from "@/lib/seo/tools";
import { REPO_URL } from "@/lib/links";

export const metadata: Metadata = pageMetadata({
  title: "Docs — install, offline, privacy and tools",
  description:
    "How to use Pagoblin: open the toolkit, install it as an app, work offline, understand the privacy model, run batch and OCR jobs, and troubleshoot common PDF problems.",
  path: "/docs",
});

const SECTIONS = [
  { id: "quick-start", label: "Quick start" },
  { id: "install", label: "Install and offline" },
  { id: "privacy", label: "Privacy model" },
  { id: "tools", label: "Tools" },
  { id: "batch-ocr", label: "Batch and OCR" },
  { id: "flows", label: "Flows" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "self-hosting", label: "Self-hosting" },
  { id: "licence", label: "Licence" },
];

export default function DocsPage() {
  return (
    <AppPage width={720} chrome={false}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Docs", path: "/docs" },
          ]),
          webPageSchema({
            name: "Pagoblin docs",
            description:
              "How to use Pagoblin: install, offline mode, privacy, tools, batch, OCR and troubleshooting.",
            path: "/docs",
            type: "TechArticle",
          }),
        ]}
      />

      <div className="mt-10 md:mt-14">
        <p className="text-small font-bold uppercase tracking-[0.14em] text-amber">Documentation</p>
        <h1 className="mt-3 font-display text-[clamp(38px,6vw,56px)] font-extrabold leading-[1.03] tracking-[-0.03em] text-cream">
          Pagoblin docs
        </h1>
        <p className="mt-4 text-body-l leading-7 text-muted">
          Pagoblin is a set of local PDF tools. There is no server to configure, no account to create and
          no upload step. These notes cover the things people ask about most.
        </p>
      </div>

      <nav aria-label="On this page" className="mt-8 rounded-card-l border border-line bg-surface p-5">
        <h2 className="font-display text-h4 text-cream">On this page</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="text-body text-amber underline">
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="quick-start" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-h2 text-cream">Quick start</h2>
        <ol className="mt-4 space-y-3 text-body leading-6 text-muted">
          <li>
            <strong className="text-cream">1. Open the toolkit.</strong> Go to{" "}
            <Link href="/app" className="text-amber underline">
              /app
            </Link>{" "}
            and pick a tool, or open a tool page directly.
          </li>
          <li>
            <strong className="text-cream">2. Add a file.</strong> Drop a PDF or image into the tool, or
            use the add button. The file is read into the tab; it is not sent anywhere.
          </li>
          <li>
            <strong className="text-cream">3. Choose the options.</strong> Page ranges, target size,
            signature, redaction marks — each tool explains its own settings.
          </li>
          <li>
            <strong className="text-cream">4. Run it and download.</strong> The result is produced on your
            device. On phones you can also use the system share sheet.
          </li>
        </ol>
        <p className="mt-4 text-body leading-6 text-muted">
          Keep the original file somewhere safe. Pagoblin builds a new file and never edits the original
          in place.
        </p>
      </section>

      <section id="install" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-h2 text-cream">Install and offline</h2>
        <p className="mt-4 text-body leading-6 text-muted">
          Pagoblin is a PWA. You can use it in a browser tab without installing anything. Installing gives
          you an app icon and a more reliable offline start.
        </p>
        <ul className="mt-4 space-y-3 text-body leading-6 text-muted">
          <li>
            <strong className="text-cream">Chrome or Edge on desktop:</strong> use the install icon in the
            address bar, or the Install button in Pagoblin.
          </li>
          <li>
            <strong className="text-cream">Android:</strong> Chrome menu → Install app or Add to Home
            screen.
          </li>
          <li>
            <strong className="text-cream">iPhone or iPad:</strong> Safari Share → Add to Home Screen.
          </li>
        </ul>
        <p className="mt-4 text-body leading-6 text-muted">
          The first visit caches the app shell, fonts and tool pages. Settings → Work offline also
          downloads the heavier engines (Ghostscript, pdf.js, qpdf and OCR). After that, tools work with
          the network off. OCR language packs are cached the first time you choose them.
        </p>
        <p className="mt-4 text-body leading-6 text-muted">
          Offline mode is not a sync service. Files and saved flows stay on that one device. Clearing site
          data removes them.
        </p>
      </section>

      <section id="privacy" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-h2 text-cream">Privacy model</h2>
        <p className="mt-4 text-body leading-6 text-muted">
          Every file is processed in your browser, usually inside a Web Worker. The Content-Security-Policy
          forbids outbound connections, and there is no upload code path. The app has no accounts, no
          cookies and no ads. This build ships no analytics; if the optional Plausible integration is
          enabled by the operator, it receives page URLs and aggregate counts only, never file data or an
          identity.
        </p>
        <p className="mt-4 text-body leading-6 text-muted">
          You do not have to take our word for it.{" "}
          <Link href="/proof" className="text-amber underline">
            /proof
          </Link>{" "}
          shows a live network monitor, the exact CSP and the build&rsquo;s source hash.{" "}
          <Link href="/privacy" className="text-amber underline">
            /privacy
          </Link>{" "}
          explains the model in full.
        </p>
      </section>

      <section id="tools" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-h2 text-cream">Tools</h2>
        <div className="mt-4 overflow-hidden rounded-card-l border border-line bg-surface">
          {PRIMARY_TOOL_PATHS.map((path) => {
            const tool = TOOL_SEO[path];
            if (!tool) return null;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex min-h-[64px] flex-col justify-center gap-1 border-b border-line px-5 py-4 last:border-b-0 hover:bg-ink/40"
              >
                <span className="font-bold text-cream">{tool.name}</span>
                <span className="text-small text-muted">{tool.short}</span>
              </Link>
            );
          })}
        </div>
        <p className="mt-4 text-body leading-6 text-muted">
          Looking for a specific job? See{" "}
          <Link href="/compress-pdf-to-2mb" className="text-amber underline">
            compress to 2 MB
          </Link>
          ,{" "}
          <Link href="/redact-pdf-offline" className="text-amber underline">
            redact offline
          </Link>{" "}
          or the{" "}
          <Link href="/offline-pdf-tools" className="text-amber underline">
            offline toolkit overview
          </Link>
          .
        </p>
      </section>

      <section id="batch-ocr" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-h2 text-cream">Batch and OCR</h2>
        <p className="mt-4 text-body leading-6 text-muted">
          Batch processing runs a local queue: one file at a time, with progress and cancel. Results come
          back as a zip with the original names kept. If one file fails, the queue reports it and carries
          on.
        </p>
        <p className="mt-4 text-body leading-6 text-muted">
          OCR uses tesseract.js in a local worker. It renders each page, recognises the text, and places
          invisible text over the page image so the result is searchable and selectable. English, Spanish,
          French and German packs are available; only the chosen pack is loaded and cached.
        </p>
        <p className="mt-4 text-body leading-6 text-muted">
          Both features are free today. They are CPU- and memory-heavy, so a large batch on a phone will
          be slower than on a laptop.
        </p>
      </section>

      <section id="flows" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-h2 text-cream">Flows</h2>
        <p className="mt-4 text-body leading-6 text-muted">
          A flow chains steps such as merge, compress to a target size, rotate and rename. Build it once
          and run it in one tap. Flows are saved in your browser&rsquo;s IndexedDB on that device. Clearing
          site data clears them; nothing is backed up to a server. Three flows are free.
        </p>
      </section>

      <section id="troubleshooting" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-h2 text-cream">Troubleshooting</h2>
        <div className="mt-4 space-y-4 text-body leading-6 text-muted">
          <p>
            <strong className="text-cream">A large file is slow or fails.</strong> Local processing is
            bounded by device memory. Close other tabs, try a smaller page range, or use a laptop. The tool
            warns before a job that may be too large.
          </p>
          <p>
            <strong className="text-cream">A password-protected PDF will not open.</strong> Use Protect /
            Unlock to remove the password locally, then run the other tool. You need the current password;
            Pagoblin does not crack it.
          </p>
          <p>
            <strong className="text-cream">A form has no fields.</strong> It may be a flat form or an
            XFA-only form. Pagoblin can fill AcroForm fields; XFA is an older Adobe format it cannot fill.
            The page tells you when it detects XFA.
          </p>
          <p>
            <strong className="text-cream">A scan has no selectable text.</strong> Run OCR first. OCR
            output is searchable, but handwriting and very small print are hard for any engine.
          </p>
          <p>
            <strong className="text-cream">A tool will not start offline.</strong> Its engine may not be
            cached yet. Reconnect once, open Settings → Work offline, and wait for the download to finish.
          </p>
        </div>
        <p className="mt-4 text-body leading-6 text-muted">
          Still stuck? See{" "}
          <Link href="/support" className="text-amber underline">
            Support
          </Link>{" "}
          or open a GitHub issue.
        </p>
      </section>

      <section id="self-hosting" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-h2 text-cream">Self-hosting and Teams</h2>
        <p className="mt-4 text-body leading-6 text-muted">
          The source is public under AGPL-3.0, so you can run your own copy. A Docker image and a Teams
          self-host licence are planned but not shipped yet. Do not expect a supported self-host package
          today; the current deployment target is a static Next.js build.
        </p>
        <p className="mt-4 text-body leading-6 text-muted">
          If you need a self-hosted deployment for an organisation, open an issue and describe the
          environment. That is how the requirement will be shaped.
        </p>
      </section>

      <section id="licence" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-h2 text-cream">Licence</h2>
        <p className="mt-4 text-body leading-6 text-muted">
          Pagoblin is free software under the GNU Affero General Public License v3.0. The source is at{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-amber underline">
            github.com/Mutawakkil-Yusuf/Pagoblin
          </a>
          . Third-party components, including Ghostscript, qpdf, pdf.js and Tesseract, are listed in{" "}
          <a
            href={`${REPO_URL}/blob/main/THIRD_PARTY_NOTICES.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber underline"
          >
            THIRD_PARTY_NOTICES.md
          </a>
          .
        </p>
        <p className="mt-4 text-body leading-6 text-muted">
          The AGPL means you can use, study, share and modify the software. If you run a modified version
          as a network service, you must offer its source to users. The full text is in the repository&rsquo;s{" "}
          <a
            href={`${REPO_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber underline"
          >
            LICENSE
          </a>{" "}
          file.
        </p>
      </section>

      <div className="mt-12 rounded-card-l border-2 border-line bg-surface p-6">
        <h2 className="font-display text-h3 text-cream">Need a human?</h2>
        <p className="mt-2 text-body text-muted">
          Support is best-effort and runs through GitHub Issues. There is no account system and no support
          mailbox on a custom domain yet.
        </p>
        <Link
          href="/support"
          className="mt-4 inline-flex min-h-[48px] items-center rounded-pill bg-amber px-6 font-bold text-ink"
        >
          Go to Support
        </Link>
        <p className="mt-4 text-small text-muted">
          Sharing Pagoblin? The{" "}
          <Link href="/launch" className="text-amber underline">
            launch kit
          </Link>{" "}
          has copy, assets and channel notes.
        </p>
      </div>
    </AppPage>
  );
}
