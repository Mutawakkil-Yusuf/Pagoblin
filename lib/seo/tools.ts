/**
 * Central route map for tool pages. It powers related-tool links, breadcrumbs
 * and tests, so a new tool only needs one entry here to join the internal link
 * graph. Descriptions are short because they render as cards.
 */
export type ToolSeoEntry = {
  href: string;
  name: string;
  short: string;
  related: readonly string[];
};

export const TOOL_SEO: Record<string, ToolSeoEntry> = {
  "/merge-pdf": {
    href: "/merge-pdf",
    name: "Merge PDFs",
    short: "Combine files in the order you choose.",
    related: ["/split-pdf", "/organize-pdf", "/compress-pdf"],
  },
  "/split-pdf": {
    href: "/split-pdf",
    name: "Split a PDF",
    short: "Keep the pages you need and leave the rest.",
    related: ["/merge-pdf", "/organize-pdf", "/pdf-to-jpg"],
  },
  "/organize-pdf": {
    href: "/organize-pdf",
    name: "Organize pages",
    short: "Reorder, rotate, delete, extract and insert pages.",
    related: ["/merge-pdf", "/split-pdf", "/compress-pdf"],
  },
  "/compress-pdf": {
    href: "/compress-pdf",
    name: "Compress a PDF",
    short: "Squeeze to a target size without a server.",
    related: ["/compress-pdf-to-2mb", "/compress-pdf-offline", "/merge-pdf"],
  },
  "/compress-pdf-to-2mb": {
    href: "/compress-pdf-to-2mb",
    name: "Compress PDF to 2 MB",
    short: "Fit visa, job and portal upload limits.",
    related: ["/compress-pdf", "/compress-pdf-offline", "/pdf-to-jpg"],
  },
  "/compress-pdf-offline": {
    href: "/compress-pdf-offline",
    name: "Compress a PDF offline",
    short: "Squeeze a file with no upload and no network.",
    related: ["/compress-pdf", "/compress-pdf-to-2mb", "/redact-pdf-offline"],
  },
  "/convert-pdf": {
    href: "/convert-pdf",
    name: "Convert PDF and images",
    short: "PDF to JPG, JPG to PDF and page-range exports.",
    related: ["/pdf-to-jpg", "/jpg-to-pdf", "/pdf-to-text"],
  },
  "/pdf-to-jpg": {
    href: "/pdf-to-jpg",
    name: "PDF to JPG",
    short: "Export pages as images at the quality you pick.",
    related: ["/jpg-to-pdf", "/convert-pdf", "/pdf-to-text"],
  },
  "/jpg-to-pdf": {
    href: "/jpg-to-pdf",
    name: "JPG to PDF",
    short: "Build a PDF from photos and scans.",
    related: ["/pdf-to-jpg", "/convert-pdf", "/merge-pdf"],
  },
  "/pdf-to-text": {
    href: "/pdf-to-text",
    name: "PDF to text",
    short: "Extract text or Markdown from a document.",
    related: ["/ocr-pdf", "/convert-pdf", "/pdf-to-jpg"],
  },
  "/sign-pdf": {
    href: "/sign-pdf",
    name: "Sign a PDF",
    short: "Draw, type or upload a signature.",
    related: ["/form-pdf", "/protect-pdf", "/merge-pdf"],
  },
  "/protect-pdf": {
    href: "/protect-pdf",
    name: "Protect or unlock a PDF",
    short: "Add or remove a password locally.",
    related: ["/sign-pdf", "/sanitize-pdf", "/verify-pdf"],
  },
  "/pdf-metadata": {
    href: "/pdf-metadata",
    name: "PDF metadata",
    short: "Inspect and edit document properties.",
    related: ["/sanitize-pdf", "/verify-pdf", "/redact-pdf"],
  },
  "/sanitize-pdf": {
    href: "/sanitize-pdf",
    name: "Sanitize a PDF",
    short: "Remove scripts, attachments and hidden data.",
    related: ["/pdf-metadata", "/verify-pdf", "/redact-pdf"],
  },
  "/verify-pdf": {
    href: "/verify-pdf",
    name: "Verify a PDF",
    short: "Hashes, signature checks and two-file comparison.",
    related: ["/sanitize-pdf", "/pdf-metadata", "/protect-pdf"],
  },
  "/redact-pdf": {
    href: "/redact-pdf",
    name: "Redact a PDF",
    short: "Remove content, not just cover it.",
    related: ["/redact-pdf-offline", "/sanitize-pdf", "/verify-pdf"],
  },
  "/redact-pdf-offline": {
    href: "/redact-pdf-offline",
    name: "Redact a PDF offline",
    short: "True local redaction with no upload.",
    related: ["/redact-pdf", "/sanitize-pdf", "/compress-pdf-offline"],
  },
  "/form-pdf": {
    href: "/form-pdf",
    name: "Fill PDF forms",
    short: "Fill, flatten and export AcroForm fields.",
    related: ["/sign-pdf", "/ocr-pdf", "/protect-pdf"],
  },
  "/ocr-pdf": {
    href: "/ocr-pdf",
    name: "OCR a PDF",
    short: "Make scans searchable on your device.",
    related: ["/pdf-to-text", "/batch-pdf", "/redact-pdf"],
  },
  "/batch-pdf": {
    href: "/batch-pdf",
    name: "Batch PDF queue",
    short: "Run many files and download a zip.",
    related: ["/compress-pdf", "/ocr-pdf", "/flows"],
  },
  "/flows": {
    href: "/flows",
    name: "PDF flows",
    short: "Chain tools and save the recipe on your device.",
    related: ["/batch-pdf", "/merge-pdf", "/compress-pdf"],
  },
};

export const TOOL_PATHS = Object.keys(TOOL_SEO);

export function toolSeoFor(pathname: string): ToolSeoEntry | undefined {
  return TOOL_SEO[pathname];
}

export function relatedToolsFor(pathname: string): ToolSeoEntry[] {
  const entry = TOOL_SEO[pathname];
  if (!entry) return [];
  return entry.related
    .map((href) => TOOL_SEO[href])
    .filter((item): item is ToolSeoEntry => Boolean(item));
}

/** The 15 primary tools, without size/offline intent variants. */
export const PRIMARY_TOOL_PATHS = [
  "/merge-pdf",
  "/split-pdf",
  "/organize-pdf",
  "/compress-pdf",
  "/convert-pdf",
  "/sign-pdf",
  "/protect-pdf",
  "/pdf-metadata",
  "/sanitize-pdf",
  "/verify-pdf",
  "/pdf-to-text",
  "/redact-pdf",
  "/form-pdf",
  "/ocr-pdf",
  "/batch-pdf",
] as const;
