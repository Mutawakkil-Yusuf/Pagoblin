"use client";

/**
 * Proof of privacy: a live, in-page network monitor plus the build identity
 * and the exact CSP this build sends. The monitor wraps fetch, XHR, beacons,
 * WebSockets and EventSource, and also reads the browser's resource timing
 * entries, so the initial page load is included. It never sends anything
 * itself except a same-origin manifest refresh.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/core";
import { Pip } from "@/components/pip/Pip";
import { ToolCard, ToolNote } from "@/components/tools/ToolParts";
import { REPO_URL } from "@/lib/links";
import { toast } from "@/lib/store/toasts";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

type BuildManifest = {
  version: number;
  commit: string | null;
  commitShort: string | null;
  sourceHash: string;
  sourceFiles: number;
  serviceWorkerHash: string | null;
  definition: string;
};

type Scope = "same-origin" | "third-party" | "local";
type NetEntry = { id: string; method: string; url: string; scope: Scope; at: number };

function scopeOf(raw: string): Scope {
  try {
    const url = new URL(raw, window.location.href);
    if (url.protocol === "data:" || url.protocol === "blob:" || url.protocol === "filesystem:") return "local";
    if (url.protocol !== "http:" && url.protocol !== "https:") return "local";
    return url.origin === window.location.origin ? "same-origin" : "third-party";
  } catch {
    return "local";
  }
}

function shortUrl(raw: string, scope: Scope): string {
  try {
    const url = new URL(raw, window.location.href);
    if (scope === "same-origin") return `${url.pathname}${url.search}`;
    if (scope === "third-party") return `${url.origin}${url.pathname}`;
    return raw.length > 64 ? `${raw.slice(0, 61)}…` : raw;
  } catch {
    return raw;
  }
}

function scopeLabel(scope: Scope): string {
  if (scope === "third-party") return "third party";
  if (scope === "same-origin") return "this origin";
  return "local";
}

function scopeTone(scope: Scope): string {
  if (scope === "third-party") return "bg-orange text-ink";
  if (scope === "same-origin") return "bg-amber/20 text-amber";
  return "bg-line/60 text-muted";
}

export function ProofClient(props: { csp: string; analyticsHost: string }) {
  const { csp, analyticsHost } = props;
  const [manifest, setManifest] = useState<BuildManifest | null>(null);
  const [manifestState, setManifestState] = useState<"loading" | "ready" | "missing">("loading");
  const [entries, setEntries] = useState<NetEntry[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const seenRef = useRef(new Set<string>());
  const counterRef = useRef(0);

  // Install the monitor before the manifest fetch below, so that fetch shows up.
  useEffect(() => {
    const add = (method: string, raw: string) => {
      const key = `${method.toUpperCase()} ${raw}`;
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);
      counterRef.current += 1;
      const entry: NetEntry = {
        id: `n${counterRef.current}`,
        method: method.toUpperCase(),
        url: raw,
        scope: scopeOf(raw),
        at: Date.now(),
      };
      setEntries((prev) => [...prev, entry].slice(-80));
      setCheckedAt(new Date());
    };

    // Resource timing covers the initial load, including requests made before
    // this component mounted.
    try {
      for (const entry of performance.getEntriesByType("resource")) add("GET", entry.name);
    } catch {
      /* performance API unavailable */
    }

    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) add("GET", entry.name);
      });
      observer.observe({ type: "resource", buffered: true });
    } catch {
      observer = null;
    }

    const restores: (() => void)[] = [];
    try {
      const originalFetch = window.fetch;
      const wrappedFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        try {
          const method = init?.method || (input instanceof Request ? input.method : "GET");
          const url = input instanceof Request ? input.url : String(input);
          add(method, url);
        } catch {
          /* monitoring is best effort */
        }
        return originalFetch(input, init);
      }) as typeof window.fetch;
      window.fetch = wrappedFetch;
      restores.push(() => {
        window.fetch = originalFetch;
      });
    } catch {
      /* ignore */
    }

    try {
      const originalOpen = XMLHttpRequest.prototype.open;
      const wrappedOpen = function (
        this: XMLHttpRequest,
        method: string,
        url: string | URL,
        async?: boolean,
        username?: string | null,
        password?: string | null,
      ) {
        try {
          add(method, String(url));
        } catch {
          /* ignore */
        }
        return originalOpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
      };
      XMLHttpRequest.prototype.open = wrappedOpen as typeof XMLHttpRequest.prototype.open;
      restores.push(() => {
        XMLHttpRequest.prototype.open = originalOpen;
      });
    } catch {
      /* ignore */
    }

    try {
      const originalBeacon = navigator.sendBeacon?.bind(navigator);
      if (originalBeacon) {
        const wrappedBeacon = ((url: string | URL, data?: BodyInit | null) => {
          try {
            add("POST", String(url));
          } catch {
            /* ignore */
          }
          return originalBeacon(url, data);
        }) as typeof navigator.sendBeacon;
        navigator.sendBeacon = wrappedBeacon;
        restores.push(() => {
          navigator.sendBeacon = originalBeacon;
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const OriginalWebSocket = window.WebSocket;
      if (OriginalWebSocket) {
        const MonitoredWebSocket = class extends OriginalWebSocket {
          constructor(url: string | URL, protocols?: string | string[]) {
            add("WS", String(url));
            super(url, protocols);
          }
        };
        window.WebSocket = MonitoredWebSocket as typeof WebSocket;
        restores.push(() => {
          window.WebSocket = OriginalWebSocket;
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const OriginalEventSource = window.EventSource;
      if (OriginalEventSource) {
        const MonitoredEventSource = class extends OriginalEventSource {
          constructor(url: string | URL, init?: EventSourceInit) {
            add("SSE", String(url));
            super(url, init);
          }
        };
        window.EventSource = MonitoredEventSource as typeof EventSource;
        restores.push(() => {
          window.EventSource = OriginalEventSource;
        });
      }
    } catch {
      /* ignore */
    }

    return () => {
      observer?.disconnect();
      for (const restore of restores) {
        try {
          restore();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/build-manifest.json", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<BuildManifest>) : null))
      .then((data) => {
        if (!alive) return;
        if (data && data.sourceHash) {
          setManifest(data);
          setManifestState("ready");
        } else {
          setManifestState("missing");
        }
      })
      .catch(() => {
        if (alive) setManifestState("missing");
      });
    return () => {
      alive = false;
    };
  }, []);

  const thirdParty = entries.filter((e) => e.scope === "third-party");
  const sameOrigin = entries.filter((e) => e.scope === "same-origin");
  const local = entries.filter((e) => e.scope === "local");
  const writes = entries.filter((e) => ["POST", "PUT", "PATCH"].includes(e.method));
  const visible = showAll ? entries : entries.slice(-8).reverse();

  const runCheck = async () => {
    try {
      await fetch(`/build-manifest.json?check=${Date.now()}`, { cache: "no-store" });
      toast.success("Still local. No third-party request was made.");
      sound.play("pop");
      haptic("tap");
    } catch {
      toast.error("The check could not run. The monitor above still lists every request it saw.");
    }
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error("Could not copy. Select the text instead.");
    }
  };

  const downloadReceipt = () => {
    const receipt = {
      app: "Pagoblin",
      generatedAt: new Date().toISOString(),
      page: window.location.href,
      origin: window.location.origin,
      build: manifest,
      csp,
      analyticsHost: analyticsHost || null,
      requests: entries.map((e) => ({ method: e.method, url: e.url, scope: e.scope, at: new Date(e.at).toISOString() })),
      summary: {
        sameOrigin: sameOrigin.length,
        thirdParty: thirdParty.length,
        local: local.length,
        writes: writes.length,
      },
      note: "Observed in this tab. Open DevTools → Network for an independent check.",
    };
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pagoblin-privacy-receipt.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    sound.play("success");
    haptic("success");
  };

  const commit = manifest?.commit;
  const sourceLink = (path: string) => (commit ? `${REPO_URL}/blob/${commit}/${path}` : `${REPO_URL}/blob/main/${path}`);

  return (
    <div className="mt-10 md:mt-6">
      <div className="text-center">
        <Pip mood="happy" size={112} className="mx-auto" />
        <h1 className="mt-3 font-display text-h1 font-extrabold leading-none">Proof of privacy</h1>
        <p className="mx-auto mt-3 max-w-[560px] text-body-l text-muted">
          Do not take our word for it. Watch this tab&rsquo;s network, read the policy, and compare the build you are
          using with the source on GitHub.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-card-l border border-line bg-surface p-4 text-center">
          <div className={`tnum font-display text-[30px] font-extrabold ${thirdParty.length ? "text-orange" : "text-amber"}`}>
            {thirdParty.length}
          </div>
          <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">Third-party</div>
        </div>
        <div className="rounded-card-l border border-line bg-surface p-4 text-center">
          <div className="tnum font-display text-[30px] font-extrabold text-cream">{sameOrigin.length}</div>
          <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">This origin</div>
        </div>
        <div className="rounded-card-l border border-line bg-surface p-4 text-center">
          <div className="tnum font-display text-[30px] font-extrabold text-cream">{local.length}</div>
          <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">Local blobs</div>
        </div>
        <div className="rounded-card-l border border-line bg-surface p-4 text-center">
          <div className="tnum font-display text-[30px] font-extrabold text-cream">{writes.length}</div>
          <div className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">Writes seen</div>
        </div>
      </div>

      <ToolCard className="mt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-h3 font-extrabold">Live network monitor</h2>
            <p className="mt-1 text-small text-muted">
              Every fetch, XHR, beacon, WebSocket and EventSource this tab makes, plus the browser&rsquo;s resource
              timing entries from the initial load.
            </p>
          </div>
          <span
            role="status"
            aria-live="polite"
            className={`inline-flex min-h-[32px] items-center gap-2 rounded-pill px-3 text-[12px] font-bold ${
              thirdParty.length ? "bg-orange text-ink" : "bg-amber text-ink"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${thirdParty.length ? "bg-ink" : "bg-ink/70"}`} />
            {thirdParty.length ? `${thirdParty.length} third-party` : "All local"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="md" onClick={() => void runCheck()}>
            Run check
          </Button>
          <Button variant="surface" size="md" onClick={downloadReceipt}>
            Download receipt
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-card border border-line">
          <table className="w-full border-collapse text-left text-[12px]">
            <caption className="sr-only">Requests observed by this page</caption>
            <thead className="bg-ink/60 text-[10px] uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-bold">Method</th>
                <th scope="col" className="px-3 py-2 font-bold">Request</th>
                <th scope="col" className="px-3 py-2 text-right font-bold">Where</th>
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                visible.map((entry) => (
                  <tr key={entry.id} className="border-t border-line/60">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-muted">{entry.method}</td>
                    <td className="min-w-0 px-3 py-2">
                      <span className="block truncate font-mono text-[11px] text-cream" title={entry.url}>
                        {shortUrl(entry.url, entry.scope)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold ${scopeTone(entry.scope)}`}>
                        {scopeLabel(entry.scope)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-muted">
                    Watching. Use any tool and come back.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {entries.length > 8 ? (
          <button
            type="button"
            className="mt-2 min-h-[44px] text-[12px] font-bold text-amber underline"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show the latest 8" : `Show all ${entries.length}`}
          </button>
        ) : null}

        <ToolNote className="mt-3">
          The monitor is best effort. A browser extension, the operating system, or a request made before this page
          loaded can sit outside it. DevTools → Network is the independent check.
          {checkedAt ? ` Last event: ${checkedAt.toLocaleTimeString()}.` : ""}
        </ToolNote>
      </ToolCard>

      <ToolCard className="mt-4">
        <h2 className="font-display text-h3 font-extrabold">This build</h2>
        <p className="mt-1 text-small text-muted">
          The source hash is SHA-256 over every tracked source file, sorted by path. Same commit and same source means
          the same hash.
        </p>
        {manifestState === "ready" && manifest ? (
          <dl className="mt-3 flex flex-col gap-2">
            <div className="rounded-phone-chip bg-ink/50 px-3 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Commit</dt>
              <dd className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[12px] text-cream">
                <span>{manifest.commitShort || "unknown"}</span>
                {commit ? (
                  <a className="text-amber underline" href={`${REPO_URL}/commit/${commit}`} target="_blank" rel="noreferrer">
                    view this commit
                  </a>
                ) : null}
              </dd>
            </div>
            <div className="rounded-phone-chip bg-ink/50 px-3 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Source hash</dt>
              <dd className="mt-0.5 break-all font-mono text-[12px] text-cream">{manifest.sourceHash}</dd>
              <dd className="mt-1 text-[11px] text-muted">
                {manifest.sourceFiles} source files.{" "}
                <button type="button" className="min-h-[32px] font-bold text-amber underline" onClick={() => void copy("Source hash", manifest.sourceHash)}>
                  Copy
                </button>
              </dd>
            </div>
            <div className="rounded-phone-chip bg-ink/50 px-3 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Service worker</dt>
              <dd className="mt-0.5 break-all font-mono text-[12px] text-cream">
                {manifest.serviceWorkerHash || "not available in this build"}
              </dd>
            </div>
          </dl>
        ) : manifestState === "loading" ? (
          <p className="mt-3 text-small text-muted">Reading the build manifest…</p>
        ) : (
          <p className="mt-3 text-small text-muted">
            This build has no manifest. Run <span className="font-mono">npm run build</span> to generate one; the
            deployed app includes it.
          </p>
        )}
      </ToolCard>

      <ToolCard className="mt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-h3 font-extrabold">Content-Security-Policy</h2>
          <span className={`rounded-pill px-2.5 py-1 text-[11px] font-bold ${analyticsHost ? "bg-orange text-ink" : "bg-amber text-ink"}`}>
            {analyticsHost ? "analytics allowed" : "no analytics host"}
          </span>
        </div>
        <p className="mt-1 text-small text-muted">
          This is the exact policy next.config.ts sends with this build. <span className="font-mono">connect-src</span>{" "}
          is the line that stops file bytes leaving.
        </p>
        <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap break-words rounded-phone-chip bg-ink/60 p-3 font-mono text-[11px] leading-5 text-cream">
          {csp}
        </pre>
        <p className="mt-2 text-[11px] leading-4 text-muted">
          {analyticsHost
            ? `This build allows ${analyticsHost} in connect-src and script-src because NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.`
            : "No analytics origin is allowed in this build. The default policy is connect-src 'self'."}
        </p>
      </ToolCard>

      <ToolCard className="mt-4">
        <h2 className="font-display text-h3 font-extrabold">Read the source</h2>
        <ul className="mt-3 grid gap-2 text-small">
          <li>
            <a className="font-bold text-amber underline" href={REPO_URL} target="_blank" rel="noreferrer">
              The whole repository
            </a>
            <span className="text-muted"> — every line is public.</span>
          </li>
          <li>
            <a className="font-bold text-amber underline" href={sourceLink("next.config.ts")} target="_blank" rel="noreferrer">
              next.config.ts
            </a>
            <span className="text-muted"> — CSP headers, precache routes and the service-worker setup.</span>
          </li>
          <li>
            <a className="font-bold text-amber underline" href={sourceLink("lib/csp.ts")} target="_blank" rel="noreferrer">
              lib/csp.ts
            </a>
            <span className="text-muted"> — the policy this page displays.</span>
          </li>
          <li>
            <a className="font-bold text-amber underline" href={sourceLink("scripts/build-manifest.mjs")} target="_blank" rel="noreferrer">
              scripts/build-manifest.mjs
            </a>
            <span className="text-muted"> — how the source hash is made.</span>
          </li>
          <li>
            <a className="font-bold text-amber underline" href={sourceLink("app/sw.ts")} target="_blank" rel="noreferrer">
              app/sw.ts
            </a>
            <span className="text-muted"> — the service worker only caches Pagoblin&rsquo;s own files.</span>
          </li>
          <li>
            <a className="font-bold text-amber underline" href={sourceLink("lib/engine/worker-shared.ts")} target="_blank" rel="noreferrer">
              lib/engine/worker-shared.ts
            </a>
            <span className="text-muted"> — files are read inside workers, never posted anywhere.</span>
          </li>
        </ul>
      </ToolCard>

      <ToolCard className="mt-4">
        <h2 className="font-display text-h3 font-extrabold">Check it yourself</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-small text-cream">
          <li>
            Clone the repository and check out{" "}
            <span className="font-mono text-[12px]">{manifest?.commitShort || "the commit above"}</span>.
          </li>
          <li>
            Run <span className="font-mono text-[12px]">npm ci</span> then{" "}
            <span className="font-mono text-[12px]">npm run build</span>.
          </li>
          <li>
            Compare the <span className="font-mono text-[12px]">sourceHash</span> in your{" "}
            <span className="font-mono text-[12px]">public/build-manifest.json</span> with the one above.
          </li>
          <li>
            Open DevTools → Network, clear it, then use a tool. Every request should be to this origin; the file
            itself should never appear in a request body.
          </li>
        </ol>
        <ToolNote className="mt-4">
          A source hash proves the code you are reading matches the code this build was made from. It does not prove
          the host served that build, and it cannot see a browser extension. The network monitor and DevTools cover
          the runtime side.
        </ToolNote>
      </ToolCard>

      <p className="mt-6 text-center text-small text-muted">
        More detail in the{" "}
        <Link href="/privacy" className="font-bold text-amber underline">
          privacy page
        </Link>
        . Files stay on your device; that is the whole product.
      </p>
    </div>
  );
}
