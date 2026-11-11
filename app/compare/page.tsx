import type { Metadata } from "next";
import Link from "next/link";
import { AppPage } from "@/components/nav/AppPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/meta";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { COMPETITORS, LAST_CHECKED } from "@/lib/compare/data";

export const metadata: Metadata = pageMetadata({
  title: "Compare Pagoblin with Smallpdf, iLovePDF and Adobe",
  description:
    "An honest comparison of Pagoblin with Smallpdf, iLovePDF and Adobe Acrobat online. Compare where files are processed, offline support, accounts, limits and pricing models.",
  path: "/compare",
});

export default function CompareHubPage() {
  return (
    <AppPage width="wide" chrome={false}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
          webPageSchema({
            name: "Compare Pagoblin with Smallpdf, iLovePDF and Adobe",
            description:
              "An honest comparison of Pagoblin with Smallpdf, iLovePDF and Adobe Acrobat online.",
            path: "/compare",
            type: "CollectionPage",
          }),
        ]}
      />

      <div className="mt-10 max-w-[800px] md:mt-14">
        <p className="text-small font-bold uppercase tracking-[0.14em] text-amber">Honest comparisons</p>
        <h1 className="mt-3 font-display text-[clamp(38px,6vw,64px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-cream">
          The PDF sites you know, compared fairly
        </h1>
        <p className="mt-5 text-body-l leading-7 text-muted">
          Smallpdf, iLovePDF and Adobe are mature cloud suites. Pagoblin is a local-first toolkit. The
          difference is not just a feature list: it is where your file goes, what happens when the
          connection drops, and who can read the code.
        </p>
        <p className="mt-3 text-small text-muted">
          Last checked: {LAST_CHECKED}. Prices, limits and retention policies change; every page links
          to the provider&rsquo;s current terms.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {COMPETITORS.map((competitor) => (
          <Link
            key={competitor.slug}
            href={`/compare/${competitor.slug}`}
            className="flex min-h-[240px] flex-col justify-between rounded-card-l border border-line bg-surface p-6 hover:border-amber"
          >
            <div>
              <h2 className="font-display text-h2 text-cream">{competitor.name}</h2>
              <p className="mt-3 text-body leading-6 text-muted">{competitor.summary}</p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-bold text-amber">
              Read the comparison <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>

      <section aria-labelledby="short-version" className="mt-14 max-w-[900px]">
        <h2 id="short-version" className="font-display text-h2 text-cream">
          The short version
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-card-l border-2 border-line bg-surface p-6">
            <h3 className="font-display text-h3 text-cream">Choose a cloud suite if…</h3>
            <ul className="mt-4 space-y-3 text-body leading-6 text-muted">
              <li>You need Office conversion, cloud storage or team administration.</li>
              <li>You need e-signature workflows with an audit trail.</li>
              <li>You want vendor support and a long-established brand.</li>
            </ul>
          </div>
          <div className="rounded-card-l bg-amber p-6 text-ink">
            <h3 className="font-display text-h3">Choose Pagoblin if…</h3>
            <ul className="mt-4 space-y-3 text-body leading-6">
              <li>The file is sensitive and should not leave your device.</li>
              <li>You need to work offline or on a locked-down network.</li>
              <li>You want no account, no daily task meter and no ads.</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="method" className="mt-14 max-w-[760px]">
        <h2 id="method" className="font-display text-h2 text-cream">
          How we compare
        </h2>
        <p className="mt-4 text-body leading-6 text-muted">
          We compare the service model, not volatile price tables or feature counts. We describe what
          each provider says about where files are processed, whether an account is needed, and whether
          the tools work offline. When a provider does something better, we say so. When Pagoblin cannot
          do a job, we say that too.
        </p>
        <p className="mt-4 text-body leading-6 text-muted">
          Pagoblin is open source under AGPL-3.0. You can read the code, run the app yourself, and check
          the privacy claim on <Link href="/proof" className="text-amber underline">/proof</Link>. The
          comparison pages are written by the Pagoblin maintainer; they are not independent reviews.
        </p>
      </section>

      <section className="mt-14 rounded-card-l border-2 border-line bg-surface p-6 md:p-8">
        <h2 className="font-display text-h3 text-cream">Want the local model instead?</h2>
        <p className="mt-2 max-w-[620px] text-body text-muted">
          See the 15 tools that run on your device, or read how offline mode works.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/offline-pdf-tools"
            className="inline-flex min-h-[48px] items-center rounded-pill bg-amber px-6 font-bold text-ink"
          >
            Offline PDF tools
          </Link>
          <Link
            href="/app"
            className="inline-flex min-h-[48px] items-center rounded-pill border-2 border-line px-6 font-bold text-cream hover:border-amber"
          >
            Open Pagoblin
          </Link>
        </div>
      </section>
    </AppPage>
  );
}
