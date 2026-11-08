"use client";

/**
 * Thumbnail grid (screen 06): three-across page cards, real renders from the
 * thumbs worker, shimmer skeletons until each page lands. Picked cards get the
 * 3px orange ring with the check bubble top-right and the number bottom-left.
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { runThumbs } from "@/lib/engine/client";
import type { FileItem } from "@/lib/files";

export function ThumbGrid(props: {
  pageCount: number;
  picked: Set<number>;
  onToggle: (page: number) => void;
  file: FileItem;
}) {
  const { pageCount, picked, onToggle, file } = props;
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [error, setError] = useState(false);
  const urlRef = useRef<Record<number, string>>({});

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const out = await runThumbs({
          file: file.file,
          pages: Array.from({ length: pageCount }, (_, i) => i + 1),
          width: 140,
        });
        if (!alive) return;
        const map: Record<number, string> = {};
        for (const t of out) map[t.page] = URL.createObjectURL(t.blob);
        urlRef.current = map;
        setUrls(map);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
      Object.values(urlRef.current).forEach((u) => URL.revokeObjectURL(u));
      urlRef.current = {};
    };
  }, [file, pageCount]);

  if (error) {
    return (
      <p className="rounded-card-l bg-surface p-4 text-body text-muted">
        Pip could not render previews for this file. You can still split it by range.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3" data-testid="split-thumbs">
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => {
        const on = picked.has(page);
        return (
          <motion.button
            type="button"
            key={page}
            aria-pressed={on}
            aria-label={`Page ${page}${on ? ", selected" : ""}`}
            onClick={() => onToggle(page)}
            whileTap={{ scale: 0.97 }}
            className={`relative overflow-hidden rounded-card bg-cream ${on ? "outline outline-[3px] outline-orange outline-[-3px]" : ""}`}
            style={{ aspectRatio: "3 / 4", minWidth: 0 }}
          >
            {urls[page] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[page]} alt="" className="h-full w-full object-cover object-top" loading="lazy" />
            ) : (
              <span className="skeleton block h-full w-full" aria-hidden="true" />
            )}
            <span className="tnum absolute bottom-2 left-2 font-bold text-ink text-[12px]">
              {page}
            </span>
            <motion.span
              aria-hidden="true"
              className="absolute right-2 top-2 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-orange text-ink"
              initial={false}
              animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}
