import type { Metadata } from "next";
import Link from "next/link";
import { MiniMark } from "@/components/nav/Chrome";

export const metadata: Metadata = {
  title: "Pagoblin — free, private PDF tools. Nothing uploaded.",
};

const TOOLS = [
  { href: "/merge-pdf", name: "Merge", sub: "Combine files in order" },
  { href: "/split-pdf", name: "Split", sub: "Pull out the pages you need" },
  { href: "/compress-pdf", name: "Compress", sub: "Squeeze to a target size" },
  { href: "/convert-pdf", name: "Convert", sub: "PDF and images, both ways" },
  { href: "/sign-pdf", name: "Sign", sub: "Draw, type or upload" },
  { href: "/flows", name: "Flows", sub: "Chain steps, run once" },
] as const;

export default function Home() {
  return (
    <main className="min-h-dvh bg-ink text-cream">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-page-x py-5">
        <div className="flex items-center gap-2.5">
          <MiniMark />
          <span className="font-display text-[26px] font-extrabold tracking-[-0.5px]">Pagoblin</span>
        </div>
        <Link
          href="/app"
          className="inline-flex h-[52px] items-center rounded-pill bg-amber px-7 font-bold text-[16px] text-ink"
        >
          Open Pagoblin
        </Link>
      </header>

      <section className="mx-auto max-w-[820px] px-page-x pb-24 pt-16 text-center md:pt-24">
        <h1 className="font-display text-display-l font-extrabold leading-[0.95] tracking-[-0.03em]">
          PDFs, fixed on your device.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-body-l leading-6 text-muted">
          Merge, split, compress, convert and sign — free, no ads, no signup. Your
          files never leave this machine. Pip, the goblin, does the chewing.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/app"
            className="inline-flex h-[58px] items-center rounded-pill bg-orange px-8 text-[17px] font-extrabold text-ink"
          >
            Open the toolkit
          </Link>
          <Link
            href="/compress-pdf"
            className="inline-flex h-[58px] items-center rounded-pill border-2 border-line bg-surface px-8 text-[17px] font-bold text-cream"
          >
            Smash a PDF to 2 MB
          </Link>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-[1200px] px-page-x pb-24">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-card-l border border-line bg-surface p-6 hover:border-amber"
            >
              <div className="font-display text-h3">{t.name}</div>
              <div className="mt-1 text-body text-muted">{t.sub}</div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-page-x py-8 text-small text-muted">
          <span>© {new Date().getFullYear()} Pagoblin. Your files stay yours.</span>
          <nav className="flex gap-4" aria-label="Footer">
            <Link href="/privacy" className="hover:text-cream">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-cream">
              Terms
            </Link>
            <Link href="/about" className="hover:text-cream">
              About
            </Link>
            <Link href="/pro" className="hover:text-cream">
              Pro waitlist
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
