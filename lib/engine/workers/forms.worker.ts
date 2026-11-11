/** AcroForm worker: inspect fields, fill them, optionally flatten. */
import type { FormFillInput, FormInspectInput } from "../types";
import { exposeJobs } from "../worker-shared";
import { fillFormMain, inspectFormMain } from "../impl/forms";

exposeJobs({
  inspect: (input, p) => inspectFormMain(input as FormInspectInput, p),
  fill: (input, p) => fillFormMain(input as FormFillInput, p),
});
