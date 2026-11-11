/** Calm, specific copy for engine failures. No stack traces in the UI. */
import { CancelledError, EngineError } from "@/lib/engine/client";
import { fileErrors } from "@/lib/files";

export function calmError(error: unknown, fallback: string): string {
  if (error instanceof CancelledError) return "";
  if (error instanceof EngineError) {
    if (error.code === "password") return fileErrors.password;
    if (error.code === "oom") return "That is too much for this device. Try fewer or smaller files.";
    if (error.code === "stale") return fileErrors.reload;
    const message = error.message ?? "";
    if (/WinAnsi|cannot encode|encoding/i.test(message)) {
      return "Some text uses characters this PDF's form font cannot show. Try plain letters, or leave those fields for another app.";
    }
    if (/flatten/i.test(message)) {
      return "The answers were filled, but a field could not be flattened. Try again with flatten off.";
    }
    return message && message !== "Something went wrong. Try again." ? message : fallback;
  }
  return fallback;
}
