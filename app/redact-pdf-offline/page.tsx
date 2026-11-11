import type { Metadata } from "next";
import { RedactTool } from "@/components/tools/RedactTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { redactFAQ, redactOfflineFAQ } from "@/lib/seo/faq";
import { pageMetadata } from "@/lib/seo/meta";

export const metadata: Metadata = pageMetadata({
  title: "Redact a PDF offline — true local redaction, no upload",
  description:
    "Remove private content from a PDF without uploading it. Pagoblin rebuilds the pages so covered text is gone, not hidden, and works with the network off.",
  path: "/redact-pdf-offline",
});

export default function RedactPdfOfflinePage() {
  return (
    <ToolLanding
      title="Redact a PDF offline"
      intro="Mark the areas that must disappear. Pagoblin rebuilds the pages as images, so the covered words are removed from the file rather than hidden under a rectangle — and the job runs on your device."
      faq={[...redactOfflineFAQ, ...redactFAQ.slice(0, 2)]}
      about="Offline redaction is for documents you cannot send to a cloud service: medical records, contracts, identity papers, internal reports. The tool rasterises each page, paints the marked areas into the pixels, and writes a fresh flattened PDF. There is no upload path, no server copy and no account."
    >
      <RedactTool />
    </ToolLanding>
  );
}
