import type { Metadata } from "next";
import { CompressTool } from "@/components/tools/CompressTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { compressFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Compress PDF to a target size, no upload",
  description:
    "Squeeze a PDF to about 1, 2 or 5 MB right in the browser. Pip measures real sizes before download. Free, no ads, no signup.",
  alternates: { canonical: "/compress-pdf" },
};

export default function CompressPdfPage() {
  return (
    <ToolLanding
      title="Compress a PDF"
      intro="Pick a target size, Pip tries a few recipes and keeps the best that fits. Nothing is uploaded to any server."
      faq={compressFAQ}
    >
      <CompressTool />
    </ToolLanding>
  );
}
