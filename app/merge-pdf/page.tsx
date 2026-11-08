import type { Metadata } from "next";
import { MergeTool } from "@/components/tools/MergeTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { mergeFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Merge PDFs free, no upload",
  description:
    "Combine PDFs in your browser, in order, with drag and drop. Free, no ads, no signup. Your files never leave your device.",
  alternates: { canonical: "/merge-pdf" },
};

export default function MergePdfPage() {
  return (
    <ToolLanding
      title="Merge PDF files"
      intro="Drop two or more PDFs, put them in order, and merge. Everything happens on this device."
      faq={mergeFAQ}
    >
      <MergeTool />
    </ToolLanding>
  );
}
