"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { relatedToolsFor } from "@/lib/seo/tools";

/** Related-tool links keep every tool page connected to the rest of the kit. */
export function RelatedTools() {
  const pathname = usePathname();
  const related = relatedToolsFor(pathname);
  if (!related.length) return null;

  return (
    <section aria-labelledby="related-tools" className="mt-10 border-t border-line pt-6">
      <h2 id="related-tools" className="font-display text-h3 text-cream">
        Related tools
      </h2>
      <ul className="mt-4 grid gap-2">
        {related.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="flex min-h-[56px] items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3 text-cream hover:border-amber"
            >
              <span className="min-w-0">
                <span className="block font-bold">{tool.name}</span>
                <span className="mt-0.5 block text-small text-muted">{tool.short}</span>
              </span>
              <span aria-hidden="true" className="text-amber">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
