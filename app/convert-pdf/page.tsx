import type { Metadata } from "next";
import { ConvertTool } from "@/components/tools/ConvertTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { convertFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Convert PDF to images and back, no upload",
  description:
    "Turn PDF pages into PNG, JPG or WebP, make one PDF from your photos, or type a quick document. Free, private, on your device.",
  alternates: { canonical: "/convert-pdf" },
};

export default function ConvertPdfPage() {
  return (
    <ToolLanding
      title="Convert"
      intro="PDF to images, images to one PDF, or typed text to a clean document. Everything happens on this device."
      faq={convertFAQ}
    >
      <ConvertTool />
    </ToolLanding>
  );
}
