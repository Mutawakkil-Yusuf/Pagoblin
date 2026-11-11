import type { Metadata } from "next";
import { OcrTool } from "@/components/tools/OcrTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { ocrFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "OCR a scanned PDF locally, no upload",
  description:
    "Make scanned PDFs searchable with local OCR in English, Spanish, French or German. Searchable PDF or plain text, no upload, no OCR server.",
  alternates: { canonical: "/ocr-pdf" },
};

export default function OcrPdfPage() {
  return (
    <ToolLanding
      title="OCR a scanned PDF"
      intro="Read the words in a scan and put them back as an invisible, searchable layer. The OCR engine and language pack are served by Pagoblin and run on this device."
      faq={ocrFAQ}
      about="OCR turns pictures of text into characters. Pagoblin renders each page, reads it with tesseract.js in a local worker, and rebuilds a searchable PDF with the page image underneath and the recognised words placed over it. No scan is sent to an OCR API."
    >
      <OcrTool />
    </ToolLanding>
  );
}
