"use client";

/**
 * Route -> tool mapping so the floating add button (and any drop) lands files
 * in the right tool's store.
 */
import type { FileItem } from "@/lib/files";
import type { FileKind } from "@/lib/files";
import { useToolFiles } from "@/lib/store/docs";

export type ToolKey =
  | "home"
  | "merge"
  | "split"
  | "compress"
  | "convert"
  | "sign"
  | "flows"
  | "share"
  | "organize"
  | "protect"
  | "metadata"
  | "text"
  | "redact"
  | "form"
  | "ocr"
  | "batch";

const ROUTE_TOOLS: { match: RegExp; tool: ToolKey; kinds: FileKind[] }[] = [
  { match: /^\/merge-pdf/, tool: "merge", kinds: ["pdf"] },
  { match: /^\/split-pdf/, tool: "split", kinds: ["pdf"] },
  { match: /^\/organize-pdf/, tool: "organize", kinds: ["pdf"] },
  { match: /^\/compress/, tool: "compress", kinds: ["pdf"] },
  { match: /^\/pdf-to-jpg/, tool: "convert", kinds: ["pdf"] },
  { match: /^\/jpg-to-pdf/, tool: "convert", kinds: ["image"] },
  { match: /^\/pdf-to-text/, tool: "text", kinds: ["pdf"] },
  { match: /^\/convert-pdf/, tool: "convert", kinds: ["pdf"] },
  { match: /^\/sign/, tool: "sign", kinds: ["pdf"] },
  { match: /^\/protect-pdf/, tool: "protect", kinds: ["pdf"] },
  { match: /^\/pdf-metadata/, tool: "metadata", kinds: ["pdf"] },
  { match: /^\/redact-pdf/, tool: "redact", kinds: ["pdf"] },
  { match: /^\/form-pdf/, tool: "form", kinds: ["pdf"] },
  { match: /^\/ocr-pdf/, tool: "ocr", kinds: ["pdf"] },
  { match: /^\/batch-pdf/, tool: "batch", kinds: ["pdf"] },
  { match: /^\/flows/, tool: "flows", kinds: ["pdf"] },
  { match: /^\/app\/tools/, tool: "home", kinds: ["pdf"] },
  { match: /^\/app/, tool: "home", kinds: ["pdf"] },
];

export function activeToolForPath(pathname: string): ToolKey {
  const clean = (pathname || "").split("?")[0];
  for (const r of ROUTE_TOOLS) if (r.match.test(clean)) return r.tool;
  return "home";
}

export function ACTIVE_TOOL_KINDS(tool: ToolKey): FileKind[] {
  switch (tool) {
    case "merge":
    case "split":
    case "organize":
    case "compress":
    case "sign":
    case "flows":
    case "protect":
    case "metadata":
    case "text":
    case "redact":
    case "form":
    case "ocr":
    case "batch":
      return ["pdf"];
    case "convert":
      return ["pdf", "image", "text"];
    default:
      return ["pdf"];
  }
}

export function addFilesToTool(tool: ToolKey, items: FileItem[]) {
  useToolFiles.getState().add(tool, items);
}
