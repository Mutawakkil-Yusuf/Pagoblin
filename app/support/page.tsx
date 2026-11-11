import type { Metadata } from "next";
import Link from "next/link";
import { AppPage } from "@/components/nav/AppPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata } from "@/lib/seo/meta";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import {
  GITHUB_ISSUES_URL,
  GITHUB_NEW_ISSUE_URL,
  SUPPORT_EMAIL,
} from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Support — docs, GitHub Issues and status",
  description:
    "Get help with Pagoblin. Read the docs and FAQ, open a GitHub issue, check the status page, and learn what to include in a useful bug report.",
  path: "/support",
});

const BUG_TEMPLATE = `What I did:
1.
2.

What I expected:

What happened:

Browser and version:
Operating system:
Device (phone/laptop):
PDF size and page count:
Does it happen offline too?
Any error text:`;

export default function SupportPage() {
  return (
    <AppPage width={720} chrome={false}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Support", path: "/support" },
          ]),
          webPageSchema({
            name: "Pagoblin support",
            description:
              "Docs, GitHub Issues and status for Pagoblin. No account required.",
            path: "/support",
            type: "ContactPage",
          }),
        ]}
      />

      <div className="mt-10 md:mt-14">
        <p className="text-small font-bold uppercase tracking-[0.14em] text-amber">Support</p>
        <h1 className="mt-3 font-display text-[clamp(38px,6vw,56px)] font-extrabold leading-[1.03] tracking-[-0.03em] text-cream">
          Get help without an account
        </h1>
        <p className="mt-4 text-body-l leading-7 text-muted">
          Pagoblin has no support portal, no ticket system and no login. Pick the path that fits. Most
          answers are already in the docs or the FAQ.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/docs"
          className="rounded-card-l border border-line bg-surface p-5 hover:border-amber"
        >
          <h2 className="font-display text-h3 text-cream">Read the docs</h2>
          <p className="mt-2 text-body text-muted">
            Install, offline mode, batch, OCR, flows and troubleshooting.
          </p>
        </Link>
        <Link
          href="/faq"
          className="rounded-card-l border border-line bg-surface p-5 hover:border-amber"
        >
          <h2 className="font-display text-h3 text-cream">Check the FAQ</h2>
          <p className="mt-2 text-body text-muted">
            Privacy, limits, offline use and the planned Pro licence.
          </p>
        </Link>
        <a
          href={GITHUB_NEW_ISSUE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-card-l border border-line bg-surface p-5 hover:border-amber"
        >
          <h2 className="font-display text-h3 text-cream">Open a GitHub issue</h2>
          <p className="mt-2 text-body text-muted">
            Bugs, feature requests and self-hosting questions. Public and searchable.
          </p>
        </a>
        <Link
          href="/status"
          className="rounded-card-l border border-line bg-surface p-5 hover:border-amber"
        >
          <h2 className="font-display text-h3 text-cream">Check the status page</h2>
          <p className="mt-2 text-body text-muted">
            There is no backend to go down, but hosting and downloads can.
          </p>
        </Link>
      </div>

      <section aria-labelledby="bug-report" className="mt-12">
        <h2 id="bug-report" className="font-display text-h2 text-cream">
          Write a useful bug report
        </h2>
        <p className="mt-4 text-body leading-6 text-muted">
          A good report can be reproduced without your document. Include the steps, the browser, the
          device and the exact error text. If the file is sensitive, do not attach it: describe the
          structure or make a small sample that shows the same problem.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-card-l border border-line bg-surface p-5 text-small leading-6 text-cream">
          <code>{BUG_TEMPLATE}</code>
        </pre>
        <a
          href={GITHUB_NEW_ISSUE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-[48px] items-center rounded-pill bg-amber px-6 font-bold text-ink"
        >
          Open a new issue
        </a>
      </section>

      <section aria-labelledby="contact" className="mt-12">
        <h2 id="contact" className="font-display text-h2 text-cream">
          Contact
        </h2>
        {SUPPORT_EMAIL ? (
          <p className="mt-4 text-body leading-6 text-muted">
            Prefer email? Write to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber underline">
              {SUPPORT_EMAIL}
            </a>
            . For anything that can be public, GitHub Issues is faster and helps the next person.
          </p>
        ) : (
          <p className="mt-4 text-body leading-6 text-muted">
            There is no support mailbox on a custom domain yet. Use{" "}
            <a
              href={GITHUB_ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber underline"
            >
              GitHub Issues
            </a>{" "}
            for now. The maintainer reads them directly.
          </p>
        )}
        <p className="mt-4 text-body leading-6 text-muted">
          Support is best-effort. There is no SLA and no paid support tier. Never send a password or an
          unredacted identity document.
        </p>
      </section>

      <section aria-labelledby="security" className="mt-12">
        <h2 id="security" className="font-display text-h2 text-cream">
          Security reports
        </h2>
        <p className="mt-4 text-body leading-6 text-muted">
          If you find a security problem, please do not publish exploit details in a public issue before
          the maintainer has had a chance to respond. Open a minimal issue asking for a private channel,
          or use the contact method above if one is configured.
        </p>
      </section>
    </AppPage>
  );
}
