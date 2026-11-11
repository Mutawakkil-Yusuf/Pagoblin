import type { Metadata } from "next";
import { SanitizeTool } from "@/components/tools/SanitizeTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { sanitizeFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Sanitize a PDF free — metadata, scripts, attachments, fonts",
  description:
    "See what is inside a PDF: metadata, JavaScript, embedded files, forms, annotations and fonts. Then rebuild a clean copy on your device. Nothing is uploaded.",
  alternates: { canonical: "/sanitize-pdf" },
};

export default function SanitizePdfPage() {
  return (
    <ToolLanding
      title="See what is inside a PDF"
      intro="A local sanitizer report for metadata, scripts, attachments, form layers and fonts. Read it first, then clean a copy with one tap."
      faq={sanitizeFAQ}
      about="The report is built from the PDF's own dictionaries and raw bytes, on this device. Cleaning copies the visible pages into a fresh document and leaves behind the metadata, actions, attachments, forms and annotations. Fonts that the visible text needs stay with the pages, so the file still looks right."
    >
      <SanitizeTool />
    </ToolLanding>
  );
}
