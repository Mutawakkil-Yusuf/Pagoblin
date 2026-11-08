import type { Metadata } from "next";
import Link from "next/link";
import { AppPage } from "@/components/nav/AppPage";
import { Pip } from "@/components/pip/Pip";

export const metadata: Metadata = {
  title: "Pagoblin Pro — pay once, keep Pip forever",
  description:
    "Pro adds batch processing, saved-beyond-three flows, OCR and Office conversion. Pay once per device. Nowhere near launch, so no waitlist marketing.",
  alternates: { canonical: "/pro" },
};

const PRO_FEATURES = [
  "Batch process dozens of files",
  "Save and rerun your flows",
  "OCR and table extraction",
  "Word and PowerPoint, soon",
];

export default function ProPage() {
  return (
    <AppPage width={480}>
      <div className="mt-10 text-center md:mt-6">
        <Pip mood="wow" size={120} className="mx-auto" />
        <h1 className="mt-4 font-display text-h1 font-extrabold leading-none">Pagoblin Pro</h1>
        <p className="mt-2 text-body-l text-muted">Pay once. Keep Pip forever.</p>
      </div>

      <div className="mt-8 grid gap-3">
        <div className="rounded-card-l border border-line bg-surface p-5">
          <header className="flex items-baseline justify-between">
            <h2 className="font-display text-h3 font-extrabold">Free</h2>
            <span className="font-display text-h3 font-extrabold text-amber">£0</span>
          </header>
          <ul className="mt-3 space-y-2 text-body text-muted">
            <li>Every everyday tool</li>
            <li>Lifetime — free means free, no accounts, no limits</li>
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
            <span className="font-display text-h3 font-extrabold text-amber">[PRICE] once</span>
          </header>
          <ul className="mt-3 space-y-2 text-body text-muted">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full bg-amber" aria-hidden="true" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-small text-muted">
            Pro is not for sale yet. Office conversion needs a server — when it arrives it stays clearly
            separate from the on-device tools, and it will be impossible to miss in the app. No pre-orders,
            no marketing drip: this page is the list.
          </p>
        </div>
      </div>

      <p className="mt-8 pb-6 text-center text-small text-muted">
        The free tools stay exactly as they are. Every file stays on your device in both tiers.
      </p>
    </AppPage>
  );
}
