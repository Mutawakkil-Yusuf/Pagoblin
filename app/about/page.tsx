import type { Metadata } from "next";
import Link from "next/link";
import { Pip } from "@/components/pip/Pip";

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
      <div className="mt-8">
        <Link href="/app" className="inline-flex min-h-[52px] items-center rounded-pill bg-orange px-7 font-bold text-ink">
          Open the toolkit
        </Link>
      </div>
    </main>
  );
}
