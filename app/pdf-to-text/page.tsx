import type { Metadata } from "next";
import { PdfTextTool } from "@/components/tools/PdfTextTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { textFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "PDF to text and Markdown free, no upload",
  description:
    "Extract text or Markdown from a PDF in your browser. Pick pages, keep reading order, no ads, no signup, nothing uploaded.",
  alternates: { canonical: "/pdf-to-text" },
};

export default function PdfToTextPage() {
  return (
    <ToolLanding
      title="PDF to text or Markdown"
      intro="Turn the text layer of a PDF into a .txt or .md file. Choose all pages or a range; the words are read on this device."
      faq={textFAQ}
      about="Text extraction is useful for searching, quoting and moving content into notes. Pagoblin groups positioned text runs into visual lines, so columns and headings stay in reading order instead of arriving as a stream of fragments."
    >
      <PdfTextTool />
    </ToolLanding>
  );
}
