import type { Metadata } from "next";
import { CompressTool } from "@/components/tools/CompressTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { compressFAQ, compressOfflineFAQ } from "@/lib/seo/faq";
import { pageMetadata } from "@/lib/seo/meta";

export const metadata: Metadata = pageMetadata({
  title: "Compress a PDF offline — no upload, exact target size",
  description:
    "Squeeze a PDF on your device with the network off. Choose a target size, watch the measured result, and keep the file local. No upload, no account.",
  path: "/compress-pdf-offline",
});

export default function CompressPdfOfflinePage() {
  return (
    <ToolLanding
      title="Compress a PDF offline"
      intro="Pick a target size and let Pip squeeze the file in a local worker. The PDF never leaves your device, and after the first load the tool works with the network switched off."
      faq={[...compressOfflineFAQ, ...compressFAQ.slice(0, 2)]}
      about="This page is for the case cloud tools handle worst: a sensitive file, a weak connection, or a machine that is not allowed to send documents anywhere. Pagoblin reads the PDF into the tab, compresses it with a local engine, and reports the measured size before you download. Settings → Work offline downloads the engines ahead of time."
    >
      <CompressTool />
    </ToolLanding>
  );
}
