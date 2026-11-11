import type { Metadata } from "next";
import Link from "next/link";
import { AppPage } from "@/components/nav/AppPage";
import { Pip } from "@/components/pip/Pip";
import { JsonLd } from "@/components/seo/JsonLd";
import { StaticFaq } from "@/components/site/StaticFaq";
import { faqPageSchema, webPageSchema } from "@/lib/seo/schema";
import { proFeatures } from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Pagoblin Pro — a planned one-time licence, not a subscription",
  description:
    "The free browser tools stay free. Pro is a planned one-time licence for future extras such as a native desktop app and Teams self-hosting. Nothing is for sale yet.",
  alternates: { canonical: "/pro" },
};

const FAQ = [
  {
    q: "Is Pro for sale now?",
    a: "No. There is no checkout, no pre-order and no price yet. The free tools are complete and usable today. When Pro exists, the price and terms will be shown before anything is charged.",
  },
  {
    q: "Will batch processing and OCR become paid?",
    a: "They are free today, and there is no plan to put the current browser tools behind a paywall. If that ever changes, it will be announced clearly before it happens, not slipped in.",
  },
  {
    q: "Is Pro a subscription?",
    a: "No. The plan is a one-time licence with an offline key, not a recurring subscription. There is no account, no team dashboard and no cloud storage attached.",
  },
  {
    q: "Do I need an account for Pro?",
    a: "No. The intended model is an offline licence key. The app should keep working without a login, and the on-device tools should never depend on a Pagoblin server.",
  },
  {
    q: "What about Teams self-hosting?",
    a: "An annual Teams self-host licence is planned for organisations that need to run Pagoblin inside their own network. A Docker image and a supported deployment are not shipped yet. Do not buy or plan around it until it exists.",
  },
];

export default function ProPage() {
  return (
    <AppPage width={480}>
      <JsonLd
        data={[
          webPageSchema({
            name: "Pagoblin Pro",
            description:
              "The free browser tools stay free. Pro is a planned one-time licence for future extras.",
            path: "/pro",
            type: "WebPage",
          }),
          faqPageSchema(FAQ),
        ]}
      />

      <div className="mt-10 text-center md:mt-6">
        <Pip mood="wow" size={120} className="mx-auto" />
        <h1 className="mt-4 font-display text-h1 font-extrabold leading-none">Pagoblin Pro</h1>
        <p className="mt-2 text-body-l text-muted">Pay once. Keep Pip forever.</p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {["No ads", "No uploads", "No account wall"].map((item) => (
          <span key={item} className="rounded-pill border border-line bg-surface px-3 py-1.5 text-small font-bold text-cream">
            {item}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-3">
        <div className="rounded-card-l border border-line bg-surface p-5">
          <header className="flex items-baseline justify-between">
            <h2 className="font-display text-h3 font-extrabold">Free</h2>
            <span className="font-display text-h3 font-extrabold text-amber">£0</span>
          </header>
          <ul className="mt-3 space-y-2 text-body text-muted">
            <li>Every browser tool, including batch processing and OCR</li>
            <li>No account, no daily task cap, no watermark</li>
            <li>Works offline after the first load</li>
          </ul>
          <div className="mt-4 flex justify-center">
            <Link href="/app" className="inline-flex min-h-[48px] items-center rounded-pill bg-orange px-6 font-bold text-ink">
              Use it now
            </Link>
          </div>
        </div>

        <div className="rounded-card-l border-2 border-amber bg-surface p-5">
          <header className="flex items-baseline justify-between">
            <h2 className="font-display text-h3 font-extrabold">Pro</h2>
            <span className="font-display text-h3 font-extrabold text-amber">Not for sale yet</span>
          </header>
          <ul className="mt-3 space-y-2 text-body text-muted">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full bg-amber" aria-hidden="true" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-small text-muted">
            The plan is a one-time licence for extras that cost real money to build and support: a native
            desktop app and Teams self-hosting. The free browser tools stay free. No subscription, no
            account wall, no cloud storage. When Pro exists, the price and terms will be shown before
            anything is charged. No pre-orders, no marketing drip: this page is the list.
          </p>
        </div>
      </div>

      <p className="mt-8 text-center text-small text-muted">
        Every file stays on your device in both tiers. The free tools stay exactly as they are.
      </p>

      <section aria-labelledby="pricing-model" className="mt-10">
        <h2 id="pricing-model" className="font-display text-h3 text-cream">
          The pricing model
        </h2>
        <div className="mt-4 grid gap-3">
          <div className="rounded-card-l border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-bold text-cream">Free core</h3>
              <span className="font-bold text-amber">£0</span>
            </div>
            <p className="mt-1 text-small text-muted">
              Every browser tool, including batch and OCR. No account, no daily cap, no watermark.
            </p>
          </div>
          <div className="rounded-card-l border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-bold text-cream">Pro</h3>
              <span className="font-bold text-amber">One-time, not priced</span>
            </div>
            <p className="mt-1 text-small text-muted">
              Planned for future extras: a native desktop app, more saved flows and support for the
              project. Offline licence key, no subscription, no account.
            </p>
          </div>
          <div className="rounded-card-l border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-bold text-cream">Teams self-host</h3>
              <span className="font-bold text-amber">Annual, not priced</span>
            </div>
            <p className="mt-1 text-small text-muted">
              Planned for organisations that need Pagoblin inside their own network. Docker and a
              supported deployment are not shipped yet.
            </p>
          </div>
        </div>
        <p className="mt-4 text-small text-muted">
          No ads, no uploads and no account wall in any tier. The file-processing tools never depend on a
          Pagoblin server.
        </p>
      </section>

      <section aria-labelledby="pro-faq" className="mt-10">
        <h2 id="pro-faq" className="font-display text-h3 text-cream">
          Pro questions
        </h2>
        <StaticFaq items={FAQ} />
      </section>

      <p className="mt-8 pb-6 text-center text-small text-muted">
        Read the{" "}
        <Link href="/faq" className="text-amber underline">
          general FAQ
        </Link>{" "}
        or the{" "}
        <Link href="/docs" className="text-amber underline">
          docs
        </Link>
        .
      </p>
    </AppPage>
  );
}
