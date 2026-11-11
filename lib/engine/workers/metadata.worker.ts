/** Metadata worker: inspect, edit and sanitize document metadata. */
import type { PdfInspectInput, PdfMetadataInput, PdfMetadataWriteInput, PdfSanitizeInput } from "../types";
import { exposeJobs } from "../worker-shared";
import { readMetadataMain, sanitizeMain, writeMetadataMain } from "../impl/metadata";
import { inspectPdfMain } from "../impl/pdf-inspect";

exposeJobs({
  read: (input, p) => readMetadataMain(input as PdfMetadataInput, p),
  inspect: (input, p) => inspectPdfMain(input as PdfInspectInput, p),
  write: (input, p) => writeMetadataMain(input as PdfMetadataWriteInput, p),
  sanitize: (input, p) => sanitizeMain(input as PdfSanitizeInput, p),
});
