import type { Metadata } from "next";
import { ProtectTool } from "@/components/tools/ProtectTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { protectFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Password protect a PDF free, no upload",
  description:
    "Lock a PDF with AES-256 encryption or remove a password you know, right in your browser. Free, no ads, no signup. Nothing is uploaded.",
  alternates: { canonical: "/protect-pdf" },
};

export default function ProtectPdfPage() {
  return (
    <ToolLanding
      title="Protect or unlock a PDF"
      intro="Add a password and permission flags to a PDF, or remove a password from a copy you can already open. Encryption happens on this device."
      faq={protectFAQ}
      about="Password protection is handled by qpdf compiled to WebAssembly, so the file and the password never touch a server. Use a password you can keep: PDF encryption has no recovery path."
    >
      <ProtectTool />
    </ToolLanding>
  );
}
