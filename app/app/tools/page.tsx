"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { AppPage } from "@/components/nav/AppPage";
import { Pip } from "@/components/pip/Pip";
import { useToolFiles } from "@/lib/store/docs";
import { springs } from "@/lib/motion";

const TOOLS = [
  { href: "/merge-pdf", title: "Merge", sub: "Combine files", bg: "bg-amber" },
  { href: "/split-pdf", title: "Split", sub: "Pull out pages", bg: "bg-cream" },
  { href: "/organize-pdf", title: "Organize", sub: "Reorder and rotate", bg: "bg-sky" },
  { href: "/compress-pdf", title: "Compress", sub: "Hit a target size", bg: "bg-orange" },
  { href: "/convert-pdf", title: "Convert", sub: "PDF and images", bg: "bg-peach" },
  { href: "/sign-pdf", title: "Sign", sub: "Draw or type", bg: "bg-sky" },
  { href: "/protect-pdf", title: "Protect", sub: "Lock or unlock", bg: "bg-cream" },
  { href: "/pdf-metadata", title: "Metadata", sub: "Inspect and edit", bg: "bg-peach" },
  { href: "/sanitize-pdf", title: "Sanitize", sub: "Scripts, files, fonts", bg: "bg-cream" },
  { href: "/verify-pdf", title: "Verify", sub: "Hashes and compare", bg: "bg-orange" },
  { href: "/pdf-to-text", title: "PDF to text", sub: "Text or Markdown", bg: "bg-amber" },
  { href: "/redact-pdf", title: "Redact", sub: "Remove content", bg: "bg-orange" },
  { href: "/form-pdf", title: "Forms", sub: "Fill and flatten", bg: "bg-sky" },
  { href: "/ocr-pdf", title: "OCR", sub: "Searchable scans", bg: "bg-cream" },
  { href: "/batch-pdf", title: "Batch", sub: "Queue and zip", bg: "bg-peach" },
  { href: "/flows", title: "Flows", sub: "Chain steps, save them", bg: "bg-amber" },
] as const;

export default function ToolsGrid() {
  const homeFiles = useToolFiles((s) => s.files.home);
  // Files dropped on the Home hero flow to merge automatically when many,
  // otherwise they wait here and the person picks a tool.
  return (
    <AppPage width="wide">
      <div className="relative mt-14 flex items-start justify-between md:mt-16">
        <h1 className="font-display text-[34px] font-extrabold tracking-[-1px] text-cream md:text-[44px]">Tools</h1>
        <div className="hidden md:block">
          <Pip mood="happy" size={60} />
        </div>
      </div>
      {homeFiles.length === 1 ? (
        <p className="mt-1 text-small text-muted">Pip has “{homeFiles[0].name}” ready. Pick a tool.</p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-3 md:gap-4">
        {TOOLS.map((t, i) => (
          <motion.div
            key={t.href}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={t.href}
              className={`flex h-[170px] flex-col justify-between rounded-[28px] p-4 text-ink md:h-[200px] md:p-6 ${t.bg}`}
            >
              <span className="flex h-[42px] w-[42px] items-center justify-center rounded-[21px] bg-ink text-cream">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
              <span>
                <span className="block font-display text-[24px] font-extrabold tracking-[-0.5px]">{t.title}</span>
                <span className="mt-0.5 block text-small font-medium">{t.sub}</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
      <motion.p whileHover={{ y: -2 }} transition={{ type: "spring", ...springs.snappy }} className="mt-6 text-small text-muted">
        Everything runs on this device. No uploads, no watermarks.
      </motion.p>
    </AppPage>
  );
}
