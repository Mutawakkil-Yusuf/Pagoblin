/**
 * Site-wide constants. The deployment URL is configurable because the project
 * does not own a custom domain yet; production currently runs on Vercel.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://pagoblin.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "Pagoblin";

export const SITE_DESCRIPTION =
  "Free, private PDF tools that run on your device. Merge, split, compress, convert, sign, redact, OCR and more — no uploads, no accounts, no ads.";

/**
 * Optional support address. Deliberately empty by default: there is no
 * mailbox on a custom domain yet, so support points at GitHub Issues unless
 * the operator explicitly configures an address.
 */
export const SUPPORT_EMAIL = (process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "").trim();

export const GITHUB_ISSUES_URL = "https://github.com/Mutawakkil-Yusuf/Pagoblin/issues";
export const GITHUB_NEW_ISSUE_URL = `${GITHUB_ISSUES_URL}/new`;

export function absoluteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}
