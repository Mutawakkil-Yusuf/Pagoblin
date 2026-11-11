import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppPage } from "@/components/nav/AppPage";
import { CompareTable } from "@/components/compare/CompareTable";
import { JsonLd } from "@/components/seo/JsonLd";
import { StaticFaq } from "@/components/site/StaticFaq";
import { pageMetadata } from "@/lib/seo/meta";
import { breadcrumbSchema, faqPageSchema, webPageSchema } from "@/lib/seo/schema";
import {
  COMPARISON_ROWS,
  COMPETITORS,
  competitorFor,
  LAST_CHECKED,
} from "@/lib/compare/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPETITORS.map((competitor) => ({ slug: competitor.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const competitor = competitorFor(slug);
  if (!competitor) return {};
  return pageMetadata({
    title: `Pagoblin vs ${competitor.name} — honest comparison`,
    description: `${competitor.summary} Compare where files are processed, offline support, accounts, limits and pricing models with Pagoblin.`,
    path: `/compare/${competitor.slug}`,
  });
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const competitor = competitorFor(slug);
  if (!competitor) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
    { name: competitor.name, path: `/compare/${competitor.slug}` },
  ];

  return (
    <AppPage width="wide" chrome={false}>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          webPageSchema({
            name: `Pagoblin vs ${competitor.name}`,
            description: competitor.summary,
            path: `/compare/${competitor.slug}`,
            type: "WebPage",
          }),
          faqPageSchema(competitor.faq),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mt-8 text-small text-muted">
        <Link href="/" className="hover:text-cream">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href="/compare" className="hover:text-cream">
          Compare
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-cream">{competitor.name}</span>
      </nav>

      <div className="mt-6 max-w-[820px]">
        <p className="text-small font-bold uppercase tracking-[0.14em] text-amber">Honest comparison</p>
        <h1 className="mt-3 font-display text-[clamp(36px,6vw,60px)] font-extrabold leading-[1.03] tracking-[-0.03em] text-cream">
          Pagoblin vs {competitor.name}
        </h1>
        <p className="mt-5 text-body-l leading-7 text-muted">{competitor.summary}</p>
        <p className="mt-4 text-body leading-6 text-muted">{competitor.model}</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-card-l border-2 border-line bg-surface p-6">
          <h2 className="font-display text-h3 text-cream">Choose {competitor.name} if…</h2>
          <ul className="mt-4 space-y-3 text-body leading-6 text-muted">
            {competitor.bestFor.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-[7px] h-[6px] w-[6px] flex-none rounded-full bg-amber" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-card-l bg-amber p-6 text-ink">
          <h2 className="font-display text-h3">Choose Pagoblin if…</h2>
          <ul className="mt-4 space-y-3 text-body leading-6">
            {competitor.pagoblinFor.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-[7px] h-[6px] w-[6px] flex-none rounded-full bg-ink" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section aria-labelledby="table-heading" className="mt-14">
        <h2 id="table-heading" className="font-display text-h2 text-cream">
          Side by side
        </h2>
        <CompareTable rows={COMPARISON_ROWS} competitor={competitor} />
        <p className="mt-3 text-small text-muted">
          Last checked: {LAST_CHECKED}. We deliberately do not publish a price table because prices vary
          by region, plan and promotion. Check{" "}
          <a
            href={competitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber underline"
          >
            {competitor.name}&rsquo;s current terms
          </a>{" "}
          before you buy or upload anything.
        </p>
      </section>

      <section aria-labelledby="trade-offs" className="mt-14 max-w-[820px]">
        <h2 id="trade-offs" className="font-display text-h2 text-cream">
          The trade-off, plainly
        </h2>
        <div className="mt-5 space-y-4 text-body leading-6 text-muted">
          <p>
            A cloud suite keeps the heavy work off your device. That can be the right call for a huge
            file on an old phone, or for a workflow that needs Office conversion, cloud storage, team
            administration or an e-signature audit trail. {competitor.name} is built for that kind of
            work, and it does things Pagoblin does not.
          </p>
          <p>
            Pagoblin keeps the file on your device. That is the whole point. It also means there is no
            upload to wait for, no server copy to retain, no account to create and no daily task meter.
            The cost is that your device does the work, and advanced cloud workflows are out of scope.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-card-l border border-line bg-surface p-5">
            <h3 className="font-display text-h3 text-cream">Where {competitor.name} is stronger</h3>
            <ul className="mt-3 space-y-2 text-body text-muted">
              {competitor.bestFor.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-card-l border border-line bg-surface p-5">
            <h3 className="font-display text-h3 text-cream">Where Pagoblin is different</h3>
            <ul className="mt-3 space-y-2 text-body text-muted">
              <li>• Files stay on your device; there is no upload path.</li>
              <li>• The app works offline after the first load.</li>
              <li>• No account, no ads, no daily task cap.</li>
              <li>• The source is public under AGPL-3.0.</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="notes" className="mt-14 max-w-[820px]">
        <h2 id="notes" className="font-display text-h2 text-cream">
          What this comparison does not claim
        </h2>
        <ul className="mt-4 space-y-3 text-body leading-6 text-muted">
          {competitor.notes.map((note) => (
            <li key={note}>• {note}</li>
          ))}
          <li>• Pagoblin is not faster on every file, and it is not a full Acrobat replacement.</li>
          <li>• This page is written by the Pagoblin maintainer, not an independent reviewer.</li>
        </ul>
      </section>

      <section aria-labelledby="compare-faq" className="mt-14 max-w-[820px]">
        <h2 id="compare-faq" className="font-display text-h2 text-cream">
          Questions
        </h2>
        <StaticFaq items={competitor.faq} />
      </section>

      <section className="mt-14 rounded-card-l border-2 border-line bg-surface p-6 md:p-8">
        <h2 className="font-display text-h3 text-cream">Try the local model</h2>
        <p className="mt-2 max-w-[620px] text-body text-muted">
          Open the toolkit and run a job on your own file. Nothing is uploaded, and there is no account.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/app"
            className="inline-flex min-h-[48px] items-center rounded-pill bg-amber px-6 font-bold text-ink"
          >
            Open Pagoblin
          </Link>
          <Link
            href="/proof"
            className="inline-flex min-h-[48px] items-center rounded-pill border-2 border-line px-6 font-bold text-cream hover:border-amber"
          >
            See the proof
          </Link>
          <Link
            href="/compare"
            className="inline-flex min-h-[48px] items-center rounded-pill border-2 border-line px-6 font-bold text-cream hover:border-amber"
          >
            All comparisons
          </Link>
        </div>
      </section>
    </AppPage>
  );
}
