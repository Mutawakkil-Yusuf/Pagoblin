"use client";

/** Tool page scaffold: working tool on top, short explainer + FAQ + privacy
 * note below (the SEO half). Same AppPage shell for phone and desktop. */
import { AppPage } from "@/components/nav/AppPage";
import { Pip } from "@/components/pip/Pip";
import { FaqList } from "@/components/ui/FaqList";
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
  return (
    <AppPage width={480}>
      <div className="hidden md:mt-10 md:block">
        <Pip mood="idle" size={56} className="float-right" />
      </div>
      <h1 className="sr-only">{title}</h1>
      <p className="mt-8 text-body leading-[22px] text-muted md:hidden">{intro}</p>
      <div className="mt-7 md:mt-2">{children}</div>

      <section aria-labelledby="ex-about" className="mt-16 border-t border-line pt-8">
        <h2 id="ex-about" className="font-display text-h3 text-cream">
          About this tool
        </h2>
        <p className="mt-3 text-body leading-6 text-muted">{intro}</p>
        {about ? <p className="mt-3 text-body leading-6 text-muted">{about}</p> : null}
        <FaqList items={faq} />
        <OwnerNote />
      </section>
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
