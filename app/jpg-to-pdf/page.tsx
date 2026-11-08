import type { Metadata } from "next";
import { ConvertTool } from "@/components/tools/ConvertTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { convertFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "JPG to PDF — free, no upload",
  description:
    "Combine JPG, PNG or WebP images into one PDF, each fitted as a page. Free, private, runs entirely in your browser.",
  alternates: { canonical: "/jpg-to-pdf" },
};

export default function JpgToPdfPage() {
  return (
    <ToolLanding
      title="JPG to PDF"
      intro="Drop your pictures, press the button, get one tidy PDF. Each image becomes a fitted page. Nothing is uploaded."
      faq={convertFAQ}
    >
      <ConvertTool initialTab="image-to-pdf" />
    </ToolLanding>
  );
}
