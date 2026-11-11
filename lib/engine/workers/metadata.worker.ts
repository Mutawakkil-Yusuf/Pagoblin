/** Metadata worker: inspect, edit and sanitize document metadata. */
import type { PdfMetadataInput, PdfMetadataWriteInput, PdfSanitizeInput } from "../types";
import { exposeJobs } from "../worker-shared";
import { readMetadataMain, sanitizeMain, writeMetadataMain } from "../impl/metadata";

exposeJobs({
  read: (input, p) => readMetadataMain(input as PdfMetadataInput, p),
  write: (input, p) => writeMetadataMain(input as PdfMetadataWriteInput, p),
  sanitize: (input, p) => sanitizeMain(input as PdfSanitizeInput, p),
});
