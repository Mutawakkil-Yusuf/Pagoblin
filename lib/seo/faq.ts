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
    a: "Yes. Type it and Pip draws it in a bold signature style. The text is drawn locally and embedded into the page.",
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

export const organizeFAQ: FAQItem[] = [
  {
    q: "What can I change on the pages?",
    a: "Drag pages into a new order, rotate or duplicate them, delete pages, keep only the pages you select, and insert pages from another PDF. The preview updates as you work.",
  },
  {
    q: "Does reordering change the original file?",
    a: "No. Pagoblin builds a new PDF from the pages you see. The file on your device is untouched.",
  },
  {
    q: "Can I mix pages from two PDFs?",
    a: "Yes. Add another PDF and its pages join the grid; drag them anywhere in the order.",
  },
  PRIVACY_LINE,
  {
    q: "Is there a page limit?",
    a: "No fixed limit. Very large documents depend on the memory of your device, and you can cancel at any time.",
  },
];

export const protectFAQ: FAQItem[] = [
  {
    q: "How strong is the password protection?",
    a: "Pagoblin uses qpdf with AES-256 encryption. The password is needed to open the file. Keep it safe: there is no recovery or reset.",
  },
  {
    q: "Can Pagoblin remove a password I forgot?",
    a: "No. Unlock only works when you know the current password. Pagoblin cannot crack or guess passwords.",
  },
  {
    q: "Do the permission checkboxes stop copying?",
    a: "They set the PDF permission flags for printing, copying, editing and annotating. PDF permissions are respected by well-behaved viewers, not enforced by cryptography against a determined person. If you add a separate owner password, that password controls the permissions; otherwise the open password does.",
  },
  PRIVACY_LINE,
  {
    q: "Where does the encryption happen?",
    a: "In a local WebAssembly worker on this device. Neither the PDF nor the password is sent anywhere.",
  },
];

export const metadataFAQ: FAQItem[] = [
  {
    q: "What can I see and change?",
    a: "Title, author, subject, keywords, creator and producer, plus creation and modification dates. The Before panel shows the original values and the After panel shows your edits.",
  },
  {
    q: "What does the sanitizer remove?",
    a: "It rebuilds the PDF from its pages and removes document and page metadata, document actions, JavaScript, attachments, forms, outlines and page annotations. It reports what it found before cleaning.",
  },
  {
    q: "Will cleaning change how the pages look?",
    a: "The visible page content is copied as-is. Links and form fields are annotations, so those are removed. A digital signature will not survive a rebuild.",
  },
  PRIVACY_LINE,
  {
    q: "Is the risk scan a virus scan?",
    a: "No. It is a structural scan for common PDF features such as JavaScript, attachments and launch actions. It is a useful signal, not a guarantee.",
  },
];

export const sanitizeFAQ: FAQItem[] = [
  {
    q: "What is in the sanitizer report?",
    a: "Metadata fields, JavaScript and launch actions, embedded files, form and XFA layers, page annotations, XMP metadata, and the fonts each page references. Each font is marked embedded or not, so you can see whether the file depends on fonts installed on the reader's device.",
  },
  {
    q: "What does one-click clean remove?",
    a: "It rebuilds the PDF from its pages into a fresh document. Metadata, document actions, JavaScript, attachments, forms, outlines, XMP and page annotations are not copied. Fonts used by the visible page content stay with the pages.",
  },
  {
    q: "Will cleaning change how the pages look?",
    a: "The visible page content is copied as-is. Links and form fields are annotations, so those are removed. A digital signature will not survive a rebuild.",
  },
  {
    q: "Does it remove fonts?",
    a: "No. Fonts that the visible text needs must stay, otherwise the pages would break. The report tells you which fonts are embedded and which are only referenced, so you can decide whether to clean or re-export the file.",
  },
  PRIVACY_LINE,
];

export const verifyFAQ: FAQItem[] = [
  {
    q: "What does Verify check?",
    a: "It computes SHA-256, SHA-1 and SHA-512 hashes on your device, lists digital signature fields, and checks whether a signature's byte range still covers the whole file. You can also compare two PDFs page by page.",
  },
  {
    q: "Does it validate the certificate?",
    a: "No. Pagoblin checks the signature structure, not the certificate chain or the PKCS#7 message digest. A green result means the signature still covers the file; it is not a legal identity check. Use a dedicated validator when identity matters.",
  },
  {
    q: "How does the comparison work?",
    a: "If the two files are byte-for-byte identical, that is reported first. Otherwise Pagoblin compares page counts, document metadata and the extracted text on each page. It does not compare rendered pixels, so a colour or layout change with the same text may show as unchanged.",
  },
  {
    q: "Are my files uploaded?",
    a: "No. The hashing, signature inspection and comparison all run in a Web Worker on your device. The report downloads as a local text file.",
  },
  PRIVACY_LINE,
];

export const textFAQ: FAQItem[] = [
  {
    q: "What is the difference between text and Markdown?",
    a: "Plain text follows the visual lines. Markdown adds headings from larger text and turns common bullets into Markdown lists, which suits notes and wikis.",
  },
  {
    q: "Why do I get an empty result?",
    a: "The PDF may be a scan, with no text layer. Pagoblin says so instead of handing you an empty file; the OCR tool can read the page images.",
  },
  {
    q: "Can I choose pages?",
    a: "Yes. Read every page or type a range such as 1-3, 5, 8-.",
  },
  PRIVACY_LINE,
  {
    q: "Does formatting survive?",
    a: "Words and line order survive. Exact fonts, colours, tables and columns do not: text extraction is about content, not layout.",
  },
];

export const redactFAQ: FAQItem[] = [
  {
    q: "Is this real redaction?",
    a: "Yes. Pagoblin renders each page, paints your marked areas onto the pixels, and rebuilds a fresh PDF from those images. The text under the boxes is not copied into the output.",
  },
  {
    q: "Why can I not select text afterwards?",
    a: "The output is flattened to images so the covered content is truly gone. That also removes the text layer. The OCR tool can add a new, searchable text layer to the redacted copy if you need one.",
  },
  {
    q: "What happens to links and form fields?",
    a: "They are not part of the rendered image, so they do not survive redaction. Check the output before sending it.",
  },
  PRIVACY_LINE,
  {
    q: "Can I undo a redaction?",
    a: "Not in the downloaded copy. Keep the original file if you may need it again; the redacted output is deliberately irreversible.",
  },
];

export const formFAQ: FAQItem[] = [
  {
    q: "Which form fields can I fill?",
    a: "AcroForm text fields, checkboxes, radio groups, dropdowns and option lists. Buttons and signature fields are left untouched.",
  },
  {
    q: "What does flattening do?",
    a: "It bakes the answers into the page so they cannot be edited away. Leave it off if the recipient needs to change the fields.",
  },
  {
    q: "Why are there no fields in my PDF?",
    a: "It may be a flat form or an XFA-only form. XFA is an older Adobe format that this tool cannot fill; the page tells you when it detects XFA.",
  },
  PRIVACY_LINE,
  {
    q: "Does filling change the original?",
    a: "No. You get a new PDF; the original on your device stays as it was.",
  },
];

export const batchFAQ: FAQItem[] = [
  {
    q: "Which jobs can run in a batch?",
    a: "Compress to a target size, export every page as an image, or extract text and Markdown. Every file in the queue gets the same job.",
  },
  {
    q: "How are the results delivered?",
    a: "One result downloads directly. Several results are packed into a zip with their original names kept.",
  },
  {
    q: "What happens if one file fails?",
    a: "Pagoblin reports that file and carries on with the rest. Nothing fails silently, and the finished files are still delivered.",
  },
  PRIVACY_LINE,
  {
    q: "Can I cancel a batch?",
    a: "Yes. The first tap stops after the current file; tap again to stop at once. Files that already finished are still delivered, and nothing half-written is kept.",
  },
];

export const ocrFAQ: FAQItem[] = [
  {
    q: "How does OCR work here?",
    a: "Pagoblin renders each page, reads it with tesseract.js in a local worker, then places the recognised words as invisible text over the page image. The result is searchable and selectable.",
  },
  {
    q: "Which languages are available?",
    a: "English, Spanish, French and German today. Only the chosen language pack is loaded; it is kept on the device for offline use.",
  },
  {
    q: "Why does the first run take longer?",
    a: "The OCR engine and language pack load from this app the first time. After that they are cached, so the tool works offline.",
  },
  {
    q: "Is my scan uploaded to an OCR service?",
    a: "No. The engine is served by Pagoblin itself and runs on your device. The PDF never leaves it.",
  },
  {
    q: "What makes a good scan?",
    a: "Straight, evenly lit pages with readable text work best. Very small print, handwriting and heavy skew are harder for any OCR engine.",
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
