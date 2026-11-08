import type { Metadata } from "next";
import { SplitTool } from "@/components/tools/SplitTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { splitFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Split PDF free, no upload",
  description:
    "Split a PDF by picking pages, every page, or ranges like 1-3, 5, 8-. Free, no ads, no signup. Your file never leaves your device.",
  alternates: { canonical: "/split-pdf" },
};

export default function SplitPdfPage() {
  return (
    <ToolLanding
      title="Split a PDF"
      intro="Pick the pages to keep, split every page, or type ranges like 1-3, 5, 8-. Everything happens on this device."
      faq={splitFAQ}
    >
      <SplitTool />
    </ToolLanding>
  );
}
