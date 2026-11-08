/** Split worker: pick -> one PDF; every/ranges -> one PDF per page/range. */
import type { SplitInput } from "../types";
import { exposeJobs } from "../worker-shared";
import { splitMain } from "../impl/split";

exposeJobs({ split: (input, p) => splitMain(input as SplitInput, p) });
