import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — free, on-device, as-is",
  description: "Plain terms for Pagoblin: free tools, processed on your device, provided as-is with no warranty.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-[760px] px-page-x py-12">
      <h1 className="font-display text-h1 font-extrabold">Terms</h1>
      <p className="mt-2 text-body text-muted">Short, plain, fair.</p>

      <h2 className="mt-8 font-display text-h2">What Pagoblin is</h2>
      <p className="mt-3 text-body">
        A free browser toolkit for everyday PDF jobs. It runs on your device and processes only the files
        you explicitly open or drop into it.
      </p>

      <h2 className="mt-8 font-display text-h2">No warranty</h2>
      <p className="mt-3 text-body">
        Pagoblin is provided as-is. Pip is a careful goblin, but software eats documents sometimes: keep
        your original somewhere safe. Nothing here is legal advice, and a drawn or typed signature is not
        automatically a legally binding one.
      </p>

      <h2 className="mt-8 font-display text-h2">What you own</h2>
      <p className="mt-3 text-body">
        Your documents stay yours — every input, every output. We claim no rights in anything you make
        with Pagoblin, mostly because we never see any of it.
      </p>

      <h2 className="mt-8 font-display text-h2">What we ask</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-body">
        <li>Don&rsquo;t use Pagoblin to break the law or someone else&rsquo;s rights.</li>
        <li>Don&rsquo;t misrepresent who signed a document you didn&rsquo;t sign yourself.</li>
        <li>If you make a copy of Pagoblin under its licence, keep the licence intact.</li>
      </ul>

      <h2 className="mt-8 font-display text-h2">Pro, if and when</h2>
      <p className="mt-3 text-body">
        If paid features arrive, they will be one-off purchases with their own terms shown before you pay —
        never a subscription you forget about.
      </p>
    </main>
  );
}
