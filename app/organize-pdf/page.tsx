import type { Metadata } from "next";
import { OrganizeTool } from "@/components/tools/OrganizeTool";
import { ToolLanding } from "@/components/tools/ToolLanding";
import { organizeFAQ } from "@/lib/seo/faq";

export const metadata: Metadata = {
  title: "Organize PDF pages free, no upload",
  description:
    "Reorder, rotate, delete, duplicate, extract and insert PDF pages in your browser. Free, no ads, no signup. Your files never leave your device.",
  alternates: { canonical: "/organize-pdf" },
};

export default function OrganizePdfPage() {
  return (
    <ToolLanding
      title="Organize PDF pages"
      intro="Drag pages into the order you want, rotate or remove them, and add pages from another PDF. The new file is built on this device."
      faq={organizeFAQ}
      about="A page organizer is the workhorse of any PDF toolkit: fix a scan that came out sideways, pull the blank pages, or put a signed page at the end. Pagoblin shows real thumbnails so you always know which page you are moving."
    >
      <OrganizeTool />
    </ToolLanding>
  );
}
