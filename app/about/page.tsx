import type { Metadata } from "next";
import Link from "next/link";
import { Pip } from "@/components/pip/Pip";
import { Credit, IconGitHub, SourceLink } from "@/components/ui/Social";
import { REPO_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "About — why Pagoblin exists",
  description: "Pagoblin exists because everyday PDF jobs deserve tools that are free, private and fast. Pip explains.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-[760px] px-page-x py-12">
      <Pip mood="happy" size={110} />
      <h1 className="mt-4 font-display text-h1 font-extrabold">About</h1>
      <p className="mt-3 text-body">
        Most PDF sites work the same way: upload the file, wait, hope, decline the upsell. The funny thing
        is that merging two PDFs never needed a server in the first place — your browser can do it.
      </p>
      <p className="mt-4 text-body">
        So Pagoblin does everything on your device. There are no accounts because accounts buy nothing
        here. There are no ads because nothing costs anything. The one rule in the code that matters most
        is a Content-Security-Policy that stops the page from talking to any server at all.
      </p>
      <p className="mt-4 text-body">
        Pip is the goblin who does the chewing. He is a mascot, not a cloud service.
      </p>
      <p className="mt-4 text-body">
        The source is public, so you can read every line and check the privacy claim yourself.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/app" className="inline-flex min-h-[52px] items-center rounded-pill bg-orange px-7 font-bold text-ink">
          Open the toolkit
        </Link>
        <SourceLink className="inline-flex min-h-[52px] items-center gap-2 rounded-pill border-2 border-line bg-surface px-7 font-bold text-cream hover:border-amber">
          <IconGitHub size={20} /> View source on GitHub
        </SourceLink>
      </div>

      <section aria-labelledby="next" className="mt-12 border-t border-line pt-8">
        <h2 id="next" className="font-display text-h2">Where to go next</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href="/proof" className="rounded-card-l border border-line bg-surface p-5 hover:border-amber">
            <span className="font-bold text-cream">See the proof</span>
            <span className="mt-1 block text-small text-muted">Live network monitor, CSP and build hash.</span>
          </Link>
          <Link href="/compare" className="rounded-card-l border border-line bg-surface p-5 hover:border-amber">
            <span className="font-bold text-cream">Compare with cloud suites</span>
            <span className="mt-1 block text-small text-muted">Smallpdf, iLovePDF and Adobe, honestly.</span>
          </Link>
          <Link href="/docs" className="rounded-card-l border border-line bg-surface p-5 hover:border-amber">
            <span className="font-bold text-cream">Read the docs</span>
            <span className="mt-1 block text-small text-muted">Install, offline mode, batch and troubleshooting.</span>
          </Link>
          <Link href="/offline-pdf-tools" className="rounded-card-l border border-line bg-surface p-5 hover:border-amber">
            <span className="font-bold text-cream">Offline PDF tools</span>
            <span className="mt-1 block text-small text-muted">What works with the Wi-Fi off, and what does not.</span>
          </Link>
        </div>
      </section>

      <p className="mt-8 text-small text-muted">
        Pagoblin is free software under the{" "}
        <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="text-amber underline">
          GNU AGPL-3.0
        </a>
        . Third-party notices are in{" "}
        <a href={`${REPO_URL}/blob/main/THIRD_PARTY_NOTICES.md`} target="_blank" rel="noopener noreferrer" className="text-amber underline">
          THIRD_PARTY_NOTICES.md
        </a>
        .
      </p>

      <Credit className="mt-12 border-t border-line pt-8" />
    </main>
  );
}
