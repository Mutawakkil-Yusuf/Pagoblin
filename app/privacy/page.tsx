import type { Metadata } from "next";
import { GITHUB_ISSUES_URL, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy — files never leave your device",
  description: "Pagoblin processes every file locally in your browser. No uploads, no accounts, no cookies, no tracking in this build.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-[760px] px-page-x py-12">
      <h1 className="font-display text-h1 font-extrabold">Privacy</h1>
      <p className="mt-2 text-body text-muted">Last updated: today, and only for as long as you keep reading.</p>

      <p className="mt-4 text-body">
        <a className="font-bold text-amber underline" href="/proof">
          See the proof
        </a>{" "}
        — a live network monitor, the exact CSP, and the source hash for this build.
      </p>

      <h2 className="mt-8 font-display text-h2">The short version</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-body">
        <li>Your files never leave your device. Every tool runs in your browser, inside Web Workers, with no upload code whatsoever.</li>
        <li>The OCR engine, its language packs and the encryption engine are served by Pagoblin itself and run on your device.</li>
        <li>We have no accounts, no sign-up, no email capture.</li>
        <li>This build ships no analytics by default and sets no cookies.</li>
        <li>Saved flows live in your browser&rsquo;s IndexedDB, on your device only.</li>
      </ul>

      <h2 className="mt-8 font-display text-h2">What happens when you use a tool</h2>
      <p className="mt-3 text-body">
        The PDF or image you pick is read straight from your file system into the tab&rsquo;s memory, and
        large files are passed to a worker as a File reference, so the bytes are read there instead of being copied on the main thread. The work
        (merge, split, organise, squeeze, encrypt, sign, redact, read with OCR) happens on your CPU. When
        you press download, the finished file is produced by your browser from that same memory. Nothing
        is sent anywhere: the app&rsquo;s Content-Security-Policy forbids outbound network connections,
        and the service worker only caches the app&rsquo;s own files so it works offline.
      </p>

      <h2 className="mt-8 font-display text-h2">Metrics</h2>
      <p className="mt-3 text-body">
        This build ships no analytics. If the optional Plausible integration is enabled by the
        operator, it receives page URLs and aggregate counts only — never file names, file contents,
        document text or an identity. There is no account to connect a visit to. The goal is to count
        activations, not people.
      </p>

      <h2 className="mt-8 font-display text-h2">How this could change</h2>
      <p className="mt-3 text-body">
        If Pagoblin Pro ever adds server-side extras (such as Office conversion), those features will be
        optional and clearly labelled — the on-device tools will never send bytes anywhere. Whatever
        changes, this page changes with it before the feature does.
      </p>

      <h2 className="mt-8 font-display text-h2">Contact</h2>
      <p className="mt-3 text-body">
        {SUPPORT_EMAIL ? (
          <>
            Write to{" "}
            <a className="text-amber underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </>
        ) : (
          <>
            Open an issue at{" "}
            <a
              className="text-amber underline"
              href={GITHUB_ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/Mutawakkil-Yusuf/Pagoblin/issues
            </a>
            . There is no support mailbox on a custom domain yet.
          </>
        )}
      </p>
    </main>
  );
}
