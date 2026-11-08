import type { Metadata } from "next";
import { CompressTool } from "@/components/tools/CompressTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { compressFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Compress PDF to 2 MB — for visa and portal forms",
  description:
    "Squeeze a PDF below 2 MB right in your browser, for visa portals, application forms and upload limits. Free, no upload, no watermark.",
  alternates: { canonical: "/compress-pdf-to-2mb" },
};

export default function Compress2MbPage() {
  return (
    <ToolLanding
      title="Compress a PDF to 2 MB"
      intro="Portals keep asking for under-2-MB files. Pip squeezes until one fits and shows you the measured size before you download."
      faq={compressFAQ}
    >
      <CompressTool initialTarget={2 * 1024 * 1024} />
    </ToolLanding>
  );
}
