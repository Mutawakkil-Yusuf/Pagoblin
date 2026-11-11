import type { Metadata } from "next";
import { VerifyTool } from "@/components/tools/VerifyTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { verifyFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Verify a PDF free — hashes, signatures, compare",
  description:
    "Check a PDF's SHA hashes, inspect its digital signature structure, and compare two PDFs page by page. Everything runs on your device. Nothing is uploaded.",
  alternates: { canonical: "/verify-pdf" },
};

export default function VerifyPdfPage() {
  return (
    <ToolLanding
      title="Verify a PDF"
      intro="Hash a file, see whether a digital signature still covers it, and compare two PDFs. The check happens on this device."
      faq={verifyFAQ}
      about="Hashes are computed with the browser's Web Crypto API inside a worker. Signature inspection reads the AcroForm and ByteRange structure, so it can tell you whether the signed bytes still reach the end of the file. It does not validate a certificate chain. The comparison extracts text with pdf.js and reports page, metadata and byte-level differences."
    >
      <VerifyTool />
    </ToolLanding>
  );
}
