/** Renders JSON-LD. Escapes `<` so document content can never close the tag. */
export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
