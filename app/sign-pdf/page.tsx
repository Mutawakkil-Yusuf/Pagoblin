import type { Metadata } from "next";
import { SignTool } from "@/components/tools/SignTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { signFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Sign a PDF free, no upload",
  description:
    "Draw, type or upload a signature and place it on one page, the last page or every page. Free, no ads, no signup, fully offline.",
  alternates: { canonical: "/sign-pdf" },
};

export default function SignPdfPage() {
  return (
    <ToolLanding
      title="Sign a PDF"
      intro="Make a signature by drawing, typing or uploading, drag it onto the page, and place it. Nothing is uploaded anywhere."
      faq={signFAQ}
    >
      <SignTool />
    </ToolLanding>
  );
}
