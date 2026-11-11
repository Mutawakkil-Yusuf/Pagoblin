import type { Metadata } from "next";
import { MetadataTool } from "@/components/tools/MetadataTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { metadataFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "PDF metadata inspector and cleaner, no upload",
  description:
    "See and edit PDF title, author and keywords, or make a clean copy without hidden actions, attachments and XMP metadata. Runs in your browser.",
  alternates: { canonical: "/pdf-metadata" },
};

export default function PdfMetadataPage() {
  return (
    <ToolLanding
      title="PDF metadata and cleaner"
      intro="See what a PDF says about its author and history. Change the fields, or rebuild a clean copy that drops document actions, attachments and forms."
      faq={metadataFAQ}
      about="Metadata travels with a PDF even when the visible page looks harmless: author names, software, creation dates, embedded files and sometimes JavaScript. The sanitizer rebuilds the document from its pages so those document-level extras are not carried over."
    >
      <MetadataTool />
    </ToolLanding>
  );
}
