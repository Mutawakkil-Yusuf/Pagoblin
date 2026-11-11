import type { Metadata } from "next";
import Link from "next/link";
import { AppPage } from "@/components/nav/AppPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/meta";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { REPO_URL } from "@/lib/links";

export const metadata: Metadata = pageMetadata({
  title: "Launch kit — share Pagoblin honestly",
  description:
    "Copy, assets and channel notes for launching Pagoblin: Show HN, Product Hunt, r/privacy, r/pdf, privacy guides and awesome-selfhosted.",
  path: "/launch",
  noindex: true,
});

const CHANNELS = [
  {
    name: "Show HN",
    state: "Ready",
    note: "Post from a personal account. Answer questions in the thread. Do not ask for upvotes.",
  },
  {
    name: "Product Hunt",
    state: "Ready",
    note: "Use the one-liner and first comment. Disclose that you are the maker.",
  },
  {
    name: "r/privacy",
    state: "Read the rules first",
    note: "Lead with the privacy model and the proof page. No vote requests, no alt accounts.",
  },
  {
    name: "r/pdf",
    state: "Read the rules first",
    note: "Lead with the tools and the honest limitations. Some subreddits restrict self-promotion.",
  },
  {
    name: "Privacy Guides",
    state: "Suggested only",
    note: "Do not spam the forum. Share the proof page and let people evaluate it.",
  },
  {
    name: "awesome-selfhosted",
    state: "Hold",
    note: "Do not submit yet. The list expects a self-hostable deployment; Docker/Teams is not shipped.",
  },
] as const;

const ONE_LINER =
  "Pagoblin: free PDF tools that run entirely in your browser. No uploads, no accounts, no ads.";

const SHORT =
  "Merge, split, compress, convert, sign, redact and OCR PDFs on your device. Pagoblin is open source, works offline, and never sends your files anywhere.";

const LONG =
  "Most PDF sites upload your document, process it on a server, and ask you to create an account or pay to finish. Pagoblin does the work in your browser instead: merge, split, organize, compress to a target size, convert, sign, protect, inspect metadata, sanitize, verify, redact, fill forms, OCR and batch. The file never leaves your device. The app is a PWA, so it works offline after the first load. The source is public under AGPL-3.0, and /proof shows the live network monitor, the exact CSP and the build hash. The honest limits: local jobs are bounded by your device, there is no cloud storage or sync, and Office conversion / e-signature audit trails are out of scope.";

export default function LaunchPage() {
  return (
    <AppPage width={720} chrome={false}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Launch kit", path: "/launch" },
          ]),
          webPageSchema({
            name: "Pagoblin launch kit",
            description:
              "Copy, assets and channel notes for launching Pagoblin honestly.",
            path: "/launch",
            type: "WebPage",
          }),
        ]}
      />

      <div className="mt-10 md:mt-14">
        <p className="text-small font-bold uppercase tracking-[0.14em] text-amber">Launch kit</p>
        <h1 className="mt-3 font-display text-[clamp(38px,6vw,56px)] font-extrabold leading-[1.03] tracking-[-0.03em] text-cream">
          Share Pagoblin without the theatre
        </h1>
        <p className="mt-4 text-body-l leading-7 text-muted">
          This page is for the launch: copy, assets and channel notes. The rule is simple — describe what
          the app does, show the proof, and be honest about what it cannot do. No fake urgency, no vote
          requests, no astroturfing.
        </p>
      </div>

      <section aria-labelledby="copy" className="mt-10">
        <h2 id="copy" className="font-display text-h2 text-cream">
          Copy blocks
        </h2>
        <div className="mt-5 space-y-4">
          <div className="rounded-card-l border border-line bg-surface p-5">
            <h3 className="font-display text-h4 text-cream">One-liner</h3>
            <p className="mt-2 text-body leading-6 text-muted">{ONE_LINER}</p>
          </div>
          <div className="rounded-card-l border border-line bg-surface p-5">
            <h3 className="font-display text-h4 text-cream">Short description</h3>
            <p className="mt-2 text-body leading-6 text-muted">{SHORT}</p>
          </div>
          <div className="rounded-card-l border border-line bg-surface p-5">
            <h3 className="font-display text-h4 text-cream">Long description</h3>
            <p className="mt-2 text-body leading-6 text-muted">{LONG}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="channels" className="mt-12">
        <h2 id="channels" className="font-display text-h2 text-cream">
          Channels
        </h2>
        <div className="mt-5 overflow-hidden rounded-card-l border border-line bg-surface">
          {CHANNELS.map((channel) => (
            <div
              key={channel.name}
              className="border-b border-line px-5 py-4 last:border-b-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-cream">{channel.name}</p>
                <span className="rounded-pill bg-amber/15 px-3 py-1 text-small font-bold text-amber">
                  {channel.state}
                </span>
              </div>
              <p className="mt-1 text-small text-muted">{channel.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-small text-muted">
          Subreddit and forum rules change. Read the current rules before posting, and do not repost the
          same text across communities.
        </p>
      </section>

      <section aria-labelledby="not-say" className="mt-12">
        <h2 id="not-say" className="font-display text-h2 text-cream">
          What not to say
        </h2>
        <ul className="mt-4 space-y-3 text-body leading-6 text-muted">
          <li>• Do not call it “unhackable” or “100% secure”. No browser app can promise that.</li>
          <li>• Do not call it an “Adobe killer”. It is a focused local toolkit, not Acrobat.</li>
          <li>• Do not invent install counts, user numbers or revenue.</li>
          <li>• Do not ask for upvotes or coordinate votes. Share the work and answer questions.</li>
          <li>• Do not hide that the comparison pages are written by the maintainer.</li>
        </ul>
      </section>

      <section aria-labelledby="assets" className="mt-12">
        <h2 id="assets" className="font-display text-h2 text-cream">
          Assets
        </h2>
        <ul className="mt-4 space-y-3 text-body leading-6 text-muted">
          <li>
            • Open Graph image:{" "}
            <a href="/og.png" className="text-amber underline">
              /og.png
            </a>{" "}
            (1200×630)
          </li>
          <li>• Screenshots: `public/screenshots/` in the repository.</li>
          <li>
            • Proof page:{" "}
            <Link href="/proof" className="text-amber underline">
              /proof
            </Link>
          </li>
          <li>
            • Comparison hub:{" "}
            <Link href="/compare" className="text-amber underline">
              /compare
            </Link>
          </li>
          <li>
            • Docs:{" "}
            <Link href="/docs" className="text-amber underline">
              /docs
            </Link>
          </li>
          <li>
            • Full launch copy:{" "}
            <a
              href={`${REPO_URL}/blob/main/docs/launch-kit.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber underline"
            >
              docs/launch-kit.md
            </a>
          </li>
        </ul>
      </section>

      <section aria-labelledby="metrics" className="mt-12">
        <h2 id="metrics" className="font-display text-h2 text-cream">
          What to watch
        </h2>
        <p className="mt-4 text-body leading-6 text-muted">
          The plan&rsquo;s exit target is the first 1,000 installs, roughly 1% paid and under 2% error
          rate. Count activations, not identities. This build ships no analytics by default; if the
          optional Plausible integration is enabled, it sees page URLs and aggregate counts only.
        </p>
        <ul className="mt-4 space-y-2 text-body leading-6 text-muted">
          <li>• Installs and activations (PWA install, first completed job).</li>
          <li>• Tool completion rate and time to result.</li>
          <li>• Offline success rate.</li>
          <li>• Crash / error rate.</li>
          <li>• Free → Pro conversion, once Pro exists.</li>
        </ul>
        <p className="mt-4 text-small text-muted">
          There is no checkout yet, so the paid number is zero by design. Do not present it as traction.
        </p>
      </section>

      <div className="mt-12 rounded-card-l border-2 border-line bg-surface p-6">
        <h2 className="font-display text-h3 text-cream">Before you post</h2>
        <ul className="mt-3 space-y-2 text-body text-muted">
          <li>• Open the app on a phone and a laptop.</li>
          <li>• Run one job offline.</li>
          <li>• Check /proof shows the current commit.</li>
          <li>• Read the subreddit or forum rules for that day.</li>
          <li>• Be ready to answer “why not just use Smallpdf?” without defensiveness.</li>
        </ul>
        <Link
          href="/support"
          className="mt-5 inline-flex min-h-[48px] items-center rounded-pill bg-amber px-6 font-bold text-ink"
        >
          Support and issue tracker
        </Link>
      </div>
    </AppPage>
  );
}
