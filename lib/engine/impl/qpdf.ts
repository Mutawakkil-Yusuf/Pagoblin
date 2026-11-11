/**
 * qpdf command lines, kept pure so the exact flags can be unit tested.
 * Paths are fixed inside qpdf's in-memory filesystem; no shell is involved.
 */
import type { ProtectPermissions } from "../types";

export const QPDF_IN = "/in.pdf";
export const QPDF_OUT = "/out.pdf";

export function protectArgs(opts: {
  userPassword: string;
  ownerPassword: string;
  keyLength: 128 | 256;
  permissions: ProtectPermissions;
}): string[] {
  const perms = opts.permissions;
  const args = [
    "--encrypt",
    opts.userPassword,
    opts.ownerPassword,
    String(opts.keyLength),
  ];
  if (opts.keyLength === 128) args.push("--use-aes=y");
  args.push(
    `--print=${perms.print ? "full" : "none"}`,
    `--modify=${perms.modify ? "all" : "none"}`,
    `--extract=${perms.copy ? "y" : "n"}`,
    `--annotate=${perms.annotate ? "y" : "n"}`,
    "--",
    QPDF_IN,
    QPDF_OUT,
  );
  return args;
}

export function unlockArgs(password: string): string[] {
  return [`--password=${password}`, "--decrypt", QPDF_IN, QPDF_OUT];
}

export function isPasswordFailure(message: string): boolean {
  return /invalid password/i.test(message);
}
