import type { Metadata } from "next";
import { ConvertTool } from "@/components/tools/ConvertTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { convertFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "PDF to JPG — free, no upload",
  description:
    "Turn PDF pages into JPG images, at high quality, right on your device. Free, no ads, no signup, nothing uploaded.",
  alternates: { canonical: "/pdf-to-jpg" },
};

export default function PdfToJpgPage() {
  return (
    <ToolLanding
      title="PDF to JPG"
      intro="Every page becomes a high-quality JPG. More than one page comes back as a zip. Nothing leaves this device."
      faq={convertFAQ}
    >
      <ConvertTool initialTab="pdf-to-image" initialFormat="jpg" />
    </ToolLanding>
  );
}
