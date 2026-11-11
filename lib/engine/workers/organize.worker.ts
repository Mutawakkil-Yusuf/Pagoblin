/** Page organizer worker: reorder / rotate / delete / duplicate / insert. */
import type { OrganizeInput } from "../types";
import { exposeJobs } from "../worker-shared";
import { organizeMain } from "../impl/organize";

exposeJobs({
  organize: (input, p) => organizeMain(input as OrganizeInput, p),
});
