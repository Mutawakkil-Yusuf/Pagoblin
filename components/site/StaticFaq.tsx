/**
 * Static FAQ for content pages. Uses native <details> so every answer is in
 * the HTML even when collapsed (crawlers and no-JS readers get the text).
 */
export function StaticFaq({
  items,
  className = "",
}: {
  items: readonly { q: string; a: string }[];
  className?: string;
}) {
  return (
    <div className={`mt-6 space-y-3 ${className}`}>
      {items.map((item) => (
        <details key={item.q} className="group rounded-card-l border border-line bg-surface p-5">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 font-bold text-cream [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span aria-hidden="true" className="text-amber">
              +
            </span>
          </summary>
          <p className="mt-3 text-body leading-6 text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
