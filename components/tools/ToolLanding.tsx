"use client";

/** Tool page scaffold: working tool on top, short explainer + FAQ + privacy
 * note below (the SEO half). Same AppPage shell for phone and desktop. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppPage } from "@/components/nav/AppPage";
import { Pip } from "@/components/pip/Pip";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/seo/JsonLd";
import { RelatedTools } from "@/components/seo/RelatedTools";
import { breadcrumbSchema, faqPageSchema, webApplicationSchema } from "@/lib/seo/schema";
import { toolSeoFor } from "@/lib/seo/tools";
import { useToolFiles } from "@/lib/store/docs";
import type { FileItem } from "@/lib/files";
import { DropZone } from "@/components/ui/DropZone";
import { usePipEvents } from "@/lib/store/pip";
import { sound } from "@/lib/sound";

export type FAQItem = { q: string; a: string };

export function ToolLanding(props: {
  title: string;
  intro: string;
  faq: FAQItem[];
  children: React.ReactNode;
  /** Extra copy block (SEO words). */
  about?: string;
}) {
  const { title, intro, faq, children, about } = props;
  const pathname = usePathname();
  const tool = toolSeoFor(pathname);
  const description = about || intro;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Tools", path: "/app/tools" },
    { name: tool?.name || title, path: pathname },
  ];

  return (
    <AppPage width="tool">
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          faqPageSchema(faq),
          webApplicationSchema({
            name: tool ? `${tool.name} — Pagoblin` : `${title} — Pagoblin`,
            description,
            path: pathname,
          }),
        ]}
      />
      {/* Phone: stacked. Laptop (1024+): the tool on the left, explainer and FAQ on the right. */}
      <div className="mt-8 lg:mt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-3 text-small text-muted">
            <Link href="/" className="hover:text-cream">
              Home
            </Link>
            <span aria-hidden="true"> / </span>
            <Link href="/app/tools" className="hover:text-cream">
              Tools
            </Link>
            <span aria-hidden="true"> / </span>
            <span className="text-cream">{tool?.name || title}</span>
          </nav>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-h2 font-extrabold tracking-[-1px] text-cream md:text-[40px] md:leading-[44px]">
                {title}
              </h1>
              <p className="mt-2 max-w-[560px] text-body leading-6 text-muted">{intro}</p>
            </div>
            <Pip mood="idle" size={56} className="hidden flex-none md:block" />
          </div>
          <div className="mt-7">{children}</div>
        </div>

        <aside aria-labelledby="ex-about" className="mt-14 border-t border-line pt-8 lg:mt-0 lg:border-t-0 lg:pt-0">
          <h2 id="ex-about" className="font-display text-h3 text-cream">
            About this tool
          </h2>
          {about ? <p className="mt-3 text-body leading-6 text-muted">{about}</p> : null}
          <FaqList items={faq} />
          <OwnerNote />
          <RelatedTools />
        </aside>
      </div>
    </AppPage>
  );
}

/**
 * Every tool page ends with this line. It is the promise that makes the
 * privacy test and the marketing honest.
 */
export function OwnerNote() {
  return (
    <div className="mt-8 rounded-card-l bg-surface p-5 text-body leading-6 text-muted">
      <p>
        <strong className="text-cream">Your file never leaves your device.</strong> Pagoblin has no
        upload step. Pip chews the PDF right here in your browser, and even works
        offline once the page has loaded once.
      </p>
    </div>
  );
}

/** Handy for tools that keep an inline drop area in empty state */
export function ToolEmptyDrop(props: {
  accept: FileKindAlias;
  label?: string;
  hint?: string;
  onFiles: (items: FileItem[]) => void | Promise<void>;
}) {
  const pipGulp = usePipEvents((s) => s.gulp);
  return (
    <DropZone
      accept={props.accept === "pdf" ? ["pdf"] : props.accept === "image" ? ["image"] : ["pdf"]}
      label={props.label ?? "Add file"}
      hint={props.hint}
      onFiles={async (items) => {
        sound.play("gulp");
        pipGulp();
        await props.onFiles(items);
      }}
      className="mt-6"
    />
  );
}

export type FileKindAlias = "pdf" | "image";
