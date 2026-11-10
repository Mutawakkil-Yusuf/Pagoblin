import { REPO_URL, INSTAGRAM_URL, X_URL, AUTHOR_NAME, INSTAGRAM_HANDLE, X_HANDLE } from "@/lib/links";

/** Brand icons are inline SVG so nothing is fetched from a third party. */
export function IconGitHub({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function IconInstagram({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconX({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/** "View source" link. Use `pill` for the filled button look. */
export function SourceLink({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <a href={REPO_URL} {...ext} className={className}>
      {children ?? (
        <>
          <IconGitHub /> View source on GitHub
        </>
      )}
    </a>
  );
}

/** Built and designed by Mutawakkil, with Instagram and X. */
export function Credit({ className = "" }: { className?: string }) {
  const chip =
    "inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-line bg-surface px-4 text-small font-bold text-cream hover:border-amber";
  return (
    <div className={className}>
      <p className="text-small text-muted">
        Built and designed by <strong className="text-cream">{AUTHOR_NAME}</strong>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a href={INSTAGRAM_URL} {...ext} className={chip} aria-label={`Instagram: ${INSTAGRAM_HANDLE}`}>
          <IconInstagram size={18} /> {INSTAGRAM_HANDLE}
        </a>
        <a href={X_URL} {...ext} className={chip} aria-label={`X: ${X_HANDLE}`}>
          <IconX size={16} /> {X_HANDLE}
        </a>
        <a href={REPO_URL} {...ext} className={chip} aria-label="Pagoblin source code on GitHub">
          <IconGitHub size={18} /> Source
        </a>
      </div>
    </div>
  );
}
