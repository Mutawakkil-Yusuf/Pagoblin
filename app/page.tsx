import type { Metadata } from "next";
import Link from "next/link";
import { MiniMark } from "@/components/nav/Chrome";
import { Pip } from "@/components/pip/Pip";
import { Credit, IconGitHub, SourceLink } from "@/components/ui/Social";
import { InstallButton } from "@/components/pwa/InstallButton";
import { AUTHOR_NAME, INSTAGRAM_URL, REPO_URL, X_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Pagoblin — free, private PDF tools. Nothing uploaded.",
  alternates: { canonical: "/" },
};

const TOOLS = [
  { href: "/merge-pdf", name: "Merge", sub: "Combine files in order", bg: "bg-amber text-ink" },
  { href: "/split-pdf", name: "Split", sub: "Pull out the pages you need", bg: "bg-cream text-ink" },
  { href: "/compress-pdf", name: "Compress", sub: "Squeeze to a target size", bg: "bg-orange text-ink" },
  { href: "/convert-pdf", name: "Convert", sub: "PDF and images, both ways", bg: "bg-peach text-ink" },
  { href: "/sign-pdf", name: "Sign", sub: "Draw, type or upload", bg: "bg-sky text-ink" },
  { href: "/flows", name: "Flows", sub: "Chain steps, run once", bg: "bg-surface text-cream border-2 border-amber" },
] as const;

const WHY = [
  { t: "Private by design", d: "Your files are processed on your device. We never see them, store them or upload them.", bg: "bg-amber" },
  { t: "No ads, no signup", d: "Open it and use it. No accounts, no watermarks, no daily limits.", bg: "bg-cream" },
  { t: "Hits the exact size", d: "Need under 2 MB for a visa portal? Say the number and Pip squeezes to fit.", bg: "bg-peach" },
] as const;

const GUIDES = [
  {
    href: "/compress-pdf-to-2mb",
    title: "Compress to 2 MB",
    sub: "For visa portals, job forms and upload limits.",
    bg: "bg-orange text-ink",
  },
  {
    href: "/redact-pdf-offline",
    title: "Redact offline",
    sub: "Remove the content, not just cover it.",
    bg: "bg-cream text-ink",
  },
  {
    href: "/offline-pdf-tools",
    title: "Offline PDF tools",
    sub: "How the local model works, and its limits.",
    bg: "bg-sky text-ink",
  },
] as const;

const wrap = "mx-auto w-full max-w-[1120px] px-page-x md:px-8";

function Tick({ ok }: { ok: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none">
      {ok ? <path d="M5 12l5 5L20 7" /> : <path d="M6 6l12 12M18 6L6 18" />}
    </svg>
  );
}

function Chip(props: { name: string; size: string; tag: string; bg: string; rot: number; className: string }) {
  return (
    <div
      className={`pg-float absolute flex h-[68px] w-[312px] items-center gap-3 rounded-[22px] px-3 text-ink shadow-chip ${props.bg} ${props.className}`}
      style={{ ["--r" as string]: `${props.rot}deg` }}
      aria-hidden="true"
    >
      <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px] bg-ink font-display text-[12px] font-extrabold text-cream">
        PDF
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold">{props.name}</span>
        <span className="block text-[12px]">{props.size}</span>
      </span>
      <span className="flex h-9 flex-none items-center rounded-pill bg-ink px-3.5 text-[13px] font-bold text-cream">{props.tag}</span>
    </div>
  );
}

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pagoblin",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (runs in the browser)",
    description:
      "Free, private PDF toolkit. Merge, split, compress and sign PDFs in your browser. Files never leave your device.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Person", name: AUTHOR_NAME, sameAs: [INSTAGRAM_URL, X_URL, REPO_URL] },
  };
  return (
    <main className="min-h-dvh overflow-x-clip bg-ink text-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className={`${wrap} flex items-center justify-between gap-4 py-5`}>
        <Link href="/" className="flex items-center gap-2.5" aria-label="Pagoblin home">
          <MiniMark />
          <span className="font-display text-[26px] font-extrabold tracking-[-0.5px]">Pagoblin</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          <a href="#tools" className="hidden rounded-pill px-3 py-2 font-medium hover:bg-surface md:inline-block">Tools</a>
          <a href="#why" className="hidden rounded-pill px-3 py-2 font-medium hover:bg-surface md:inline-block">Why Pagoblin</a>
          <Link href="/compare" className="hidden rounded-pill px-3 py-2 font-medium hover:bg-surface lg:inline-block">Compare</Link>
          <Link href="/docs" className="hidden rounded-pill px-3 py-2 font-medium hover:bg-surface lg:inline-block">Docs</Link>
          <SourceLink className="hidden items-center gap-2 rounded-pill px-3 py-2 font-medium hover:bg-surface md:inline-flex">
            <IconGitHub size={18} /> Source
          </SourceLink>
          <InstallButton
            className="hidden h-[48px] items-center rounded-pill border-2 border-line bg-surface px-5 text-[15px] font-bold text-cream md:inline-flex"
            label="Install"
          />
          <Link
            href="/app"
            className="ml-1 inline-flex h-[48px] items-center rounded-pill bg-amber px-6 text-[15px] font-bold text-ink md:h-[52px] md:px-7 md:text-[16px]"
          >
            Open Pagoblin
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className={`${wrap} grid items-center gap-10 pb-20 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-16`}>
        <div>
          <span className="inline-flex rounded-pill border-2 border-line bg-surface px-4 py-2 text-small font-bold text-amber">
            Free. Private. No ads.
          </span>
          <h1 className="mt-5 font-display text-[clamp(44px,7vw,84px)] font-extrabold leading-[0.98] tracking-[-0.04em]">
            PDF tools that <span className="text-amber">never ask</span> for your files.
          </h1>
          <p className="mt-6 max-w-[540px] text-[19px] leading-[30px] text-muted">
            Merge, split, compress, convert and sign right in your browser. Pip, the tiny goblin in your pocket,
            does the chewing. Nothing is uploaded.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/app" className="inline-flex h-[58px] items-center rounded-pill bg-orange px-8 text-[17px] font-extrabold text-ink">
              Open Pagoblin
            </Link>
            <SourceLink className="inline-flex h-[58px] items-center gap-2.5 rounded-pill border-2 border-line bg-surface px-7 text-[17px] font-bold text-cream hover:border-amber">
              <IconGitHub size={20} /> View source
            </SourceLink>
          </div>
          <p className="mt-5 text-small text-muted">Works offline once installed. No account, ever.</p>
        </div>

        <div className="relative mx-auto h-[440px] w-full max-w-[520px] sm:h-[480px]" aria-hidden="true">
          <div className="absolute left-1/2 top-[44px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-surface sm:h-[380px] sm:w-[380px]" />
          <div className="absolute left-1/2 top-[96px] -translate-x-1/2 rotate-[-4deg]">
            <Pip mood="happy" size={250} />
          </div>
          <Chip name="Invoice march.pdf" size="2.1 MB" tag="Merge" bg="bg-amber" rot={-5} className="left-0 top-[28px] sm:left-2" />
          <Chip name="Passport scan.pdf" size="640 KB" tag="Sign" bg="bg-cream" rot={4} className="bottom-[28px] right-0 sm:right-2" />
        </div>
      </section>

      {/* Why */}
      <section id="why" className={`${wrap} pb-20 lg:pb-28`}>
        <h2 className="font-display text-[clamp(32px,5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
          Why Pagoblin is different
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {WHY.map((c) => (
            <div key={c.t} className={`rounded-card-l p-7 text-ink ${c.bg}`}>
              <h3 className="font-display text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em]">{c.t}</h3>
              <p className="mt-3 text-[17px] leading-[26px]">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className={`${wrap} pb-20 lg:pb-28`}>
        <h2 className="font-display text-[clamp(32px,5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
          Everything you need, nothing you do not
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className={`flex h-[180px] flex-col justify-between rounded-[28px] p-6 transition-transform hover:-translate-y-1 ${t.bg}`}>
              <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-ink text-cream">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
              <span>
                <span className="block font-display text-[26px] font-extrabold tracking-[-0.02em]">{t.name}</span>
                <span className="mt-0.5 block text-[15px] font-medium">{t.sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Compare */}
      <section className={`${wrap} pb-20 lg:pb-28`}>
        <h2 className="font-display text-[clamp(32px,5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
          Other PDF sites versus Pagoblin
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-card-l border-2 border-line bg-surface p-8">
            <h3 className="font-display text-[24px] font-extrabold text-muted">Typical PDF sites</h3>
            <ul className="mt-4 space-y-3 text-[18px] text-muted">
              {["Upload your files to a server", "Daily task limits", "Ads and upsell pop-ups", "An account wall"].map((t) => (
                <li key={t} className="flex items-center gap-3"><Tick ok={false} />{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-card-l bg-cream p-8 text-ink">
            <h3 className="font-display text-[24px] font-extrabold">Pagoblin</h3>
            <ul className="mt-4 space-y-3 text-[18px]">
              {["Files never leave your device", "No daily limits", "Zero ads", "No account, ever"].map((t) => (
                <li key={t} className="flex items-center gap-3"><Tick ok />{t}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/compare" className="inline-flex h-[52px] items-center rounded-pill bg-amber px-6 font-bold text-ink">
            Read the honest comparisons
          </Link>
          <Link href="/offline-pdf-tools" className="inline-flex h-[52px] items-center rounded-pill border-2 border-line bg-surface px-6 font-bold text-cream hover:border-amber">
            Offline PDF tools
          </Link>
        </div>
      </section>

      {/* Guides */}
      <section className={`${wrap} pb-20 lg:pb-28`}>
        <h2 className="font-display text-[clamp(32px,5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
          Guides for the jobs people actually search for
        </h2>
        <p className="mt-3 max-w-[620px] text-[18px] leading-[28px] text-muted">
          Short, practical pages for the things people need to finish — not keyword filler.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {GUIDES.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className={`flex min-h-[180px] flex-col justify-between rounded-[28px] p-6 transition-transform hover:-translate-y-1 ${guide.bg}`}
            >
              <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-ink text-cream">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
              <span>
                <span className="block font-display text-[24px] font-extrabold tracking-[-0.02em]">{guide.title}</span>
                <span className="mt-1 block text-[15px] font-medium">{guide.sub}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-small text-muted">
          <Link href="/docs" className="hover:text-cream">Read the docs</Link>
          <Link href="/faq" className="hover:text-cream">FAQ</Link>
          <Link href="/compare" className="hover:text-cream">Compare with cloud suites</Link>
        </div>
      </section>

      {/* Open source */}
      <section id="source" className={`${wrap} pb-20 lg:pb-28`}>
        <div className="grid items-center gap-8 rounded-[36px] border-2 border-line bg-surface p-8 md:p-12 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-pill bg-ink px-4 py-2 text-small font-bold text-amber">
              <IconGitHub size={16} /> Public source
            </span>
            <h2 className="mt-4 font-display text-[clamp(30px,4.5vw,44px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
              Do not trust us. Read the code.
            </h2>
            <p className="mt-3 max-w-[560px] text-[18px] leading-[28px] text-muted">
              Every line of Pagoblin is public on GitHub. Check that your files never leave the page, send a fix, or run
              your own copy.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SourceLink className="inline-flex h-[56px] items-center gap-2.5 rounded-pill bg-cream px-7 text-[16px] font-extrabold text-ink">
              <IconGitHub size={20} /> View on GitHub
            </SourceLink>
            <Link href="/proof" className="inline-flex h-[56px] items-center rounded-pill bg-amber px-7 text-[16px] font-extrabold text-ink">
              See the proof
            </Link>
            <Link href="/privacy" className="inline-flex h-[56px] items-center rounded-pill border-2 border-line px-7 text-[16px] font-bold hover:border-amber">
              How privacy works
            </Link>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className={`${wrap} pb-20 lg:pb-28`}>
        <div className="flex flex-wrap items-center gap-8 rounded-[40px] bg-amber p-8 text-ink md:p-12">
          <Pip mood="happy" size={150} />
          <div className="min-w-0 flex-1 basis-[320px]">
            <div className="font-display text-[clamp(36px,5vw,56px)] font-extrabold leading-none tracking-[-0.04em]">Feed Pip a PDF.</div>
            <p className="mb-6 mt-3 text-[18px] leading-[27px]">Free to use, on your phone or your laptop. Install it and it works offline.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/app" className="inline-flex h-[56px] items-center rounded-pill bg-ink px-8 text-[16px] font-bold text-cream">
                Open Pagoblin
              </Link>
              <InstallButton
                className="inline-flex h-[56px] items-center rounded-pill border-2 border-ink px-7 text-[16px] font-bold text-ink"
                label="Install app"
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className={`${wrap} grid gap-10 py-12 md:grid-cols-[1fr_auto]`}>
          <div>
            <div className="flex items-center gap-2.5">
              <MiniMark />
              <span className="font-display text-[24px] font-extrabold tracking-[-0.5px]">Pagoblin</span>
            </div>
            <p className="mt-3 max-w-[340px] text-small text-muted">Built so your files stay yours.</p>
            <Credit className="mt-6" />
          </div>
          <nav className="grid grid-cols-2 gap-x-6 gap-y-2 self-start text-small text-muted md:gap-y-3" aria-label="Footer">
            <Link href="/app/tools" className="hover:text-cream">Tools</Link>
            <Link href="/compare" className="hover:text-cream">Compare</Link>
            <Link href="/docs" className="hover:text-cream">Docs</Link>
            <Link href="/faq" className="hover:text-cream">FAQ</Link>
            <Link href="/support" className="hover:text-cream">Support</Link>
            <Link href="/status" className="hover:text-cream">Status</Link>
            <Link href="/privacy" className="hover:text-cream">Privacy</Link>
            <Link href="/proof" className="hover:text-cream">Proof</Link>
            <Link href="/terms" className="hover:text-cream">Terms</Link>
            <Link href="/about" className="hover:text-cream">About</Link>
            <Link href="/pro" className="hover:text-cream">Pro</Link>
            <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="hover:text-cream">Licence</a>
            <SourceLink className="hover:text-cream">Source on GitHub</SourceLink>
          </nav>
        </div>
        <div className={`${wrap} pb-8 text-small text-muted`}>© {new Date().getFullYear()} Pagoblin. Your files stay yours.</div>
      </footer>
    </main>
  );
}
