import type { Metadata } from "next";
import Link from "next/link";
import { AppPage } from "@/components/nav/AppPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/meta";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { VERSION } from "@/lib/version";
import { GITHUB_ISSUES_URL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Status — no backend, no file server",
  description:
    "Pagoblin's status page. The PDF tools run on your device, so there is no file-processing backend to go down. Hosting, downloads and offline install are reported here.",
  path: "/status",
});

const CHECKS = [
  {
    name: "Static site and downloads",
    state: "Operational",
    detail: "Served by the host. If this page loads, the site is up.",
  },
  {
    name: "On-device PDF tools",
    state: "Operational",
    detail: "Runs in your browser. No Pagoblin server is involved in the file path.",
  },
  {
    name: "Offline install",
    state: "Operational",
    detail: "The service worker caches the app shell after the first visit.",
  },
  {
    name: "OCR language packs",
    state: "Operational",
    detail: "Served from the same origin and cached on the device after first use.",
  },
  {
    name: "Analytics",
    state: "Not enabled",
    detail: "This build ships no analytics. Optional Plausible is off unless configured.",
  },
] as const;

export default function StatusPage() {
  const buildDate = new Date().toISOString().slice(0, 10);

  return (
    <AppPage width={720} chrome={false}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Status", path: "/status" },
          ]),
          webPageSchema({
            name: "Pagoblin status",
            description:
              "Pagoblin has no file-processing backend. This page reports hosting, downloads and offline install.",
            path: "/status",
            type: "WebPage",
          }),
        ]}
      />

      <div className="mt-10 md:mt-14">
        <p className="text-small font-bold uppercase tracking-[0.14em] text-amber">Status</p>
        <h1 className="mt-3 font-display text-[clamp(38px,6vw,56px)] font-extrabold leading-[1.03] tracking-[-0.03em] text-cream">
          All systems operational
        </h1>
        <p className="mt-4 text-body-l leading-7 text-muted">
          There is no Pagoblin file-processing backend. The tools run in your browser, so there is no API,
          database or file store to fail. This page reports the parts that can actually break: hosting,
          downloads and the offline install.
        </p>
      </div>

      <div className="mt-8 rounded-card-l border-2 border-line bg-surface p-6">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-3 w-3 rounded-full bg-amber" />
          <p className="font-display text-h3 text-cream">Operational</p>
        </div>
        <p className="mt-2 text-body text-muted">
          No known incident. Last reviewed at build time: {buildDate}. App version: {VERSION}.
        </p>
      </div>

      <section aria-labelledby="checks" className="mt-10">
        <h2 id="checks" className="font-display text-h2 text-cream">
          Components
        </h2>
        <div className="mt-5 overflow-hidden rounded-card-l border border-line bg-surface">
          {CHECKS.map((check) => (
            <div
              key={check.name}
              className="flex flex-col gap-1 border-b border-line px-5 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
            >
              <div>
                <p className="font-bold text-cream">{check.name}</p>
                <p className="mt-1 text-small text-muted">{check.detail}</p>
              </div>
              <span className="mt-1 inline-flex w-fit flex-none rounded-pill bg-amber/15 px-3 py-1 text-small font-bold text-amber">
                {check.state}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="honest-status" className="mt-12">
        <h2 id="honest-status" className="font-display text-h2 text-cream">
          What this page is not
        </h2>
        <p className="mt-4 text-body leading-6 text-muted">
          This is a static page, not a live uptime dashboard. It does not probe a server every minute,
          because a live status API would require exactly the backend Pagoblin is designed not to have.
          If the page loads, the static site is reachable. If a tool fails after that, the problem is in
          the browser, the device or the file.
        </p>
        <p className="mt-4 text-body leading-6 text-muted">
          Real incidents, if they happen, are reported on{" "}
          <a
            href={GITHUB_ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber underline"
          >
            GitHub Issues
          </a>
          . There is no email status subscription.
        </p>
      </section>

      <section aria-labelledby="status-help" className="mt-12">
        <h2 id="status-help" className="font-display text-h2 text-cream">
          If something is broken
        </h2>
        <ul className="mt-4 space-y-3 text-body leading-6 text-muted">
          <li>
            <strong className="text-cream">The site will not load:</strong> check your connection and try
            again. This is a hosting or network problem, not a PDF-processing problem.
          </li>
          <li>
            <strong className="text-cream">A tool will not start:</strong> its engine may not be cached.
            Open Settings → Work offline once, then retry.
          </li>
          <li>
            <strong className="text-cream">A job fails:</strong> check the error text, try a smaller file
            or a different browser, then open an issue with the details.
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/support"
            className="inline-flex min-h-[48px] items-center rounded-pill bg-amber px-6 font-bold text-ink"
          >
            Support
          </Link>
          <Link
            href="/proof"
            className="inline-flex min-h-[48px] items-center rounded-pill border-2 border-line px-6 font-bold text-cream hover:border-amber"
          >
            See the proof
          </Link>
        </div>
      </section>
    </AppPage>
  );
}
