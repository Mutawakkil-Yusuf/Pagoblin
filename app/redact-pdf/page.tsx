import type { Metadata } from "next";
import { RedactTool } from "@/components/tools/RedactTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { redactFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Redact a PDF for real, no upload",
  description:
    "Mark private areas and rebuild a flattened PDF where the covered content is gone, not hidden. True local redaction, free, no upload.",
  alternates: { canonical: "/redact-pdf" },
};

export default function RedactPdfPage() {
  return (
    <ToolLanding
      title="Redact a PDF"
      intro="Mark the areas that must disappear. Pagoblin rebuilds the pages as images, so the covered words are removed from the file rather than hidden under a rectangle."
      faq={redactFAQ}
      about="A black rectangle drawn over live text is not redaction: the words are still in the file and can be copied out. Pagoblin rasterises the page, paints the marked areas onto the pixels, and writes a fresh PDF from those images. The output is flattened on purpose."
    >
      <RedactTool />
    </ToolLanding>
  );
}
