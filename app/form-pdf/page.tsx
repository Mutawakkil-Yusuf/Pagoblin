import type { Metadata } from "next";
import { FormTool } from "@/components/tools/FormTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { formFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Fill a PDF form free, no upload",
  description:
    "Fill PDF form fields in your browser, then flatten or keep them editable. Free, no ads, no signup, nothing uploaded.",
  alternates: { canonical: "/form-pdf" },
};

export default function FormPdfPage() {
  return (
    <ToolLanding
      title="Fill a PDF form"
      intro="Type into text fields, tick boxes and choose options. Flatten the answers into the page when you are ready to send it."
      faq={formFAQ}
      about="AcroForm fields are part of the PDF itself, so filling them needs no server. Pagoblin reads the field names and types, shows the right control for each one, and can flatten the result so the answers travel as page content."
    >
      <FormTool />
    </ToolLanding>
  );
}
