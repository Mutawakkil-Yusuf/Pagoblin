import type { FAQItem } from "@/components/tools/ToolLanding";

const PRIVACY_LINE: FAQItem = {
  q: "Do my files get uploaded?",
  a: "No. The tools run in your browser, on your device. There is no upload step, no server that sees your PDFs, and nothing is stored after you close the page.",
};

export const mergeFAQ: FAQItem[] = [
  {
    q: "How do I combine PDFs in order?",
    a: "Drop two or more PDFs into the tool. Hold a file and drag it up or down — or use the arrow buttons — until the numbers 1, 2, 3 read the way you want, then press Merge.",
  },
  {
    q: "Is there a file size limit?",
    a: "There is no hard limit. Very large files work, but Pip needs memory, so on phones a few hundred megabytes may be slow. You get a gentle warning before that happens.",
  },
  {
    q: "Can I merge scanned documents?",
    a: "Yes. Scans are PDFs like any other, and pages are copied over unchanged.",
  },
  PRIVACY_LINE,
  {
    q: "Does it cost anything?",
    a: "No. Merging is free, with no watermark, no daily limits and no signup.",
  },
];

export const splitFAQ: FAQItem[] = [
  {
    q: "How do I pick just some pages?",
    a: "Add the PDF, choose Pick pages and tap the page thumbnails you want. Pages you tap get an orange ring, right in the preview.",
  },
  {
    q: "How do ranges like 1-3, 5, 8- work?",
    a: "Choose Ranges mode and type them in. 1-3 takes pages one to three, 5 takes page five, and 8- means everything from page eight. The tool checks your input while you type.",
  },
  {
    q: "What do I get out?",
    a: "Picked pages come out as one PDF. Every page and Ranges mode give one PDF per selection, packed into a zip.",
  },
  PRIVACY_LINE,
  {
    q: "Is Split free?",
    a: "Yes, with no limits. Every everyday tool in Pagoblin is free.",
  },
];

export const compressFAQ: FAQItem[] = [
  {
    q: "What does squeezing to a target size do?",
    a: "Type how small the PDF must be — 2 MB for a visa portal, say — and Pip tries different quality levels, measuring each one, until the file fits. Pip only ever reports sizes it really measured.",
  },
  {
    q: "What if my file cannot reach the target?",
    a: "Pip tells you straight: the file gets as small as its content allows, and you see the honest number. Dense scans sometimes just have too much image data.",
  },
  {
    q: "Will my text stay sharp?",
    a: "Text stays vector when it can. The optional Flatten mode turns pages into images — useful for stubborn files, and labelled clearly in the tool.",
  },
  PRIVACY_LINE,
  {
    q: "Why does upgrading take a few seconds?",
    a: "Pip measures several compression levels to find the best one that fits your target. That is real work, done locally, and you can watch the progress.",
  },
];

export const convertFAQ: FAQItem[] = [
  {
    q: "Which formats work?",
    a: "PDF to PNG, JPG or WebP. Images (JPG, PNG, WebP) to PDF. Text to PDF. Word and PowerPoint need a server, so they are marked as a future Pro extra.",
  },
  {
    q: "How do I get one image, not twenty?",
    a: "Choose the page range when converting. One page gives one image; the whole document gives a zip.",
  },
  {
    q: "Does the quality slider matter?",
    a: "Yes. It sets how many pixels Pip renders and how heavily images are encoded. Left side is smaller files, right side is sharper images.",
  },
  PRIVACY_LINE,
  {
    q: "Can I convert images into one PDF?",
    a: "Yes. Drop several images, arrange them, choose Fit page or A4, and Pip builds one PDF.",
  },
];

export const signFAQ: FAQItem[] = [
  {
    q: "Can I draw my signature?",
    a: "Yes. Draw with a finger, stylus or mouse on the pad. You can undo, clear, and re-ink as many times as you like.",
  },
  {
    q: "Can I type my name in a signature font?",
    a: "Yes. Type it and pick one of the three handwriting-style fonts. The text is drawn locally and embedded into the page.",
  },
  {
    q: "Can I upload a photo of my signature?",
    a: "Yes. A JPG or PNG works. Pip gently removes the white background so it looks right on the page.",
  },
  {
    q: "How do I place it on the right page?",
    a: "Drag your signature onto the page preview, size it, rotate a little if needed, then choose this page, all pages or the last page before clicking.",
  },
  PRIVACY_LINE,
  {
    q: "Is this legally binding?",
    a: "Electronic signature rules differ by country and situation. Pagoblin adds your signature to the page; only your paperwork decides what it means.",
  },
];

export const flowsFAQ: FAQItem[] = [
  {
    q: "What is a flow?",
    a: "A flow is a short chain of steps — like merge, then compress to 2 MB, then rename. Build it once and run it in one tap.",
  },
  {
    q: "Which steps exist today?",
    a: "Merge, Compress to a target size, Rotate and Rename. More steps are on the way.",
  },
  {
    q: "Where are saved flows kept?",
    a: "On this device, in your browser's own storage. Clearing site data clears them; nothing is backed up to any server.",
  },
  PRIVACY_LINE,
  {
    q: "How many flows can I save?",
    a: "Three for free. More saved flows come with Pro later.",
  },
];
