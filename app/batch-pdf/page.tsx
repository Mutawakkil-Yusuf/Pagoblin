import type { Metadata } from "next";
import { BatchTool } from "@/components/tools/BatchTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { batchFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Batch PDF processing with zip output, no upload",
  description:
    "Compress, export images or extract text from many PDFs in one queue, then download a zip. Everything runs on your device.",
  alternates: { canonical: "/batch-pdf" },
};

export default function BatchPdfPage() {
  return (
    <ToolLanding
      title="Batch PDF queue"
      intro="Line up many PDFs, choose one job, and let them run one at a time. Finished files come back together as a zip."
      faq={batchFAQ}
      about="Batch work is where cloud tools usually ask for an account. Pagoblin keeps the queue local: files run one at a time to keep memory bounded, a failure is reported instead of skipped, and the results are packed on the device."
    >
      <BatchTool />
    </ToolLanding>
  );
}
