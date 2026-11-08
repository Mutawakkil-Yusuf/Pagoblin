/** Merge worker: copy pages from each PDF in order into one new document. */
import type { MergeInput } from "../types";
import { exposeJobs } from "../worker-shared";
import { mergeMain } from "../impl/merge";

exposeJobs({ merge: (input, p) => mergeMain(input as MergeInput, p) });
