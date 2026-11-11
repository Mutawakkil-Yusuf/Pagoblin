import type { ComparisonRow, Competitor } from "@/lib/compare/data";

/** Accessible comparison table; horizontal scroll on narrow screens. */
export function CompareTable({
  rows,
  competitor,
}: {
  rows: readonly ComparisonRow[];
  competitor: Pick<Competitor, "slug" | "name">;
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-card-l border border-line bg-surface">
      <table className="w-full min-w-[760px] border-collapse text-left text-body">
        <caption className="sr-only">
          Pagoblin compared with {competitor.name}. Last checked November 2026; check the
          provider&rsquo;s current terms.
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="px-4 py-4 font-bold text-muted">
              Feature
            </th>
            <th scope="col" className="bg-amber/10 px-4 py-4 font-bold text-amber">
              Pagoblin
            </th>
            <th scope="col" className="px-4 py-4 font-bold text-cream">
              {competitor.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-line last:border-b-0">
              <th scope="row" className="px-4 py-4 align-top font-bold text-cream">
                {row.label}
              </th>
              <td className="bg-amber/10 px-4 py-4 align-top text-cream">
                {row.values.pagoblin}
              </td>
              <td className="px-4 py-4 align-top text-muted">
                {row.values[competitor.slug]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
