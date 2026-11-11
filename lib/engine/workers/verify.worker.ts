/** Verify worker: local hashes, signature structure and two-file comparison. */
import type { PdfCompareInput, PdfVerifyInput } from "../types";
import { exposeJobs } from "../worker-shared";
import { compareMain, verifyMain } from "../impl/verify";

exposeJobs({
  verify: (input, p) => verifyMain(input as PdfVerifyInput, p),
  compare: (input, p) => compareMain(input as PdfCompareInput, p),
});
