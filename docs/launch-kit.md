# Pagoblin launch kit

Everything needed to share Pagoblin without overclaiming. The live version of this
page is `/launch`; this file holds the longer copy and the channel notes.

## The position

**Pagoblin is the private, offline PDF toolkit that finishes the job — no uploads,
no limits, no accounts.**

It is a browser toolkit for everyday PDF work: merge, split, organize, compress to a
target size, convert, sign, protect, inspect metadata, sanitize, verify, redact,
fill forms, OCR and batch. Every job runs on the device. The app is a PWA, so it
works offline after the first load. The source is public under AGPL-3.0, and
`/proof` shows the live network monitor, the exact Content-Security-Policy and the
build's source hash.

## One-liner

Pagoblin: free PDF tools that run entirely in your browser. No uploads, no accounts,
no ads.

## Short description

Merge, split, compress, convert, sign, redact and OCR PDFs on your device. Pagoblin
is open source, works offline, and never sends your files anywhere.

## Long description

Most PDF sites upload your document, process it on a server, and ask you to create an
account or pay to finish. Pagoblin does the work in your browser instead: merge,
split, organize, compress to a target size, convert, sign, protect, inspect metadata,
sanitize, verify, redact, fill forms, OCR and batch. The file never leaves your
device. The app is a PWA, so it works offline after the first load. The source is
public under AGPL-3.0, and `/proof` shows the live network monitor, the exact CSP and
the build hash.

The honest limits: local jobs are bounded by your device, there is no cloud storage
or sync, and Office conversion / e-signature audit trails are out of scope.

## Show HN

**Title:** Show HN: Pagoblin – PDF tools that run entirely in your browser

**Body:**

I built Pagoblin because I wanted a PDF toolkit that does not ask me to upload a
document to a stranger's server just to merge two files.

It runs in the browser. Merge, split, organize, compress to a target size, convert,
sign, protect, metadata, sanitize, verify, redact, forms, OCR and batch. The heavy
work happens in Web Workers. There is no upload code path, and the CSP forbids
outbound connections. It installs as a PWA and works offline after the first load.

The source is public (AGPL-3.0), and there is a `/proof` page with a live network
monitor, the exact CSP and the build's source hash. You can compare the hash with the
commit on GitHub.

What it does not do: cloud storage/sync, server-side Office conversion, e-signature
workflows with an audit trail, or a team dashboard. Local jobs are limited by your
device's memory, and OCR is CPU-heavy. Those are real trade-offs, not footnotes.

I would especially like feedback on the offline install, the compress target-size
behaviour and the redaction flow. If a tool fails on a real document, an issue with
the browser, device and error text is the most useful thing you can send.

Repo: https://github.com/Mutawakkil-Yusuf/Pagoblin
App: https://pagoblin.vercel.app

## Product Hunt

**Tagline:** Private PDF tools that never upload your files.

**Description:** Merge, split, compress, convert, sign, redact and OCR PDFs on your
device. No uploads, no accounts, no ads. Open source, offline-first, and free for
every current tool.

**Topics:** Productivity, Privacy, Open Source, Web App, PDF.

**First comment:**

Hi Product Hunt — I'm Mutawakkil, the maker. Pagoblin is a browser PDF toolkit that
does the work locally. The file never leaves your device, there is no account, and
the app works offline after the first load.

The thing I care about most is that the privacy claim is checkable: the source is
public, and `/proof` shows the live network monitor, the CSP and the build hash. The
comparison pages are honest about where cloud suites are the better choice.

It is free today. A one-time Pro licence is planned for future extras such as a
native desktop app and Teams self-hosting, but nothing is for sale yet and the
current browser tools stay free.

## r/privacy

Read the subreddit rules first. Many communities restrict self-promotion, and some
require a minimum account age or a specific flair.

**Title:** I built a PDF toolkit that never uploads the file — here is how the privacy claim is checkable

**Body:**

Most online PDF tools upload the document to a server. I wanted a local alternative
for the ordinary jobs: merge, split, compress, convert, sign, redact, OCR.

Pagoblin runs in the browser. There is no upload code path, and the
Content-Security-Policy forbids outbound connections. The app has no accounts, no
cookies and no ads. This build ships no analytics; the optional Plausible integration
is off unless the operator enables it, and it only sees page URLs.

The part that matters for this subreddit: the claim is checkable. The source is public
under AGPL-3.0. `/proof` shows a live network monitor, the exact CSP and the build's
source hash. You can compare the hash with the commit on GitHub.

Limits, because they are real: local jobs are bounded by device memory, OCR is
CPU-heavy, and there is no cloud storage, sync, Office conversion or e-signature
audit trail. If you need those, use a cloud suite.

I am the maintainer. I am not asking for upvotes, and I will answer technical
questions in the thread. Repo: https://github.com/Mutawakkil-Yusuf/Pagoblin

## r/pdf

Read the rules first. Some PDF communities treat tool posts as self-promotion; use
the appropriate flair and disclose that you are the maker.

**Title:** A local-first PDF toolkit: merge, compress to a target size, redact and OCR without uploading

**Body:**

I built Pagoblin because the ordinary PDF jobs should not require an upload. It runs
in the browser and does merge, split, organize, compress to a target size, convert,
sign, protect, metadata, sanitize, verify, redact, forms, OCR and batch.

A few implementation notes that may be interesting here:

- Compression uses a local Ghostscript WASM engine with a pdf.js flatten fallback,
  and measures the output against the target instead of guessing.
- Redaction rasterises the page and paints the marked areas into the pixels, then
  rebuilds a flattened PDF. It does not draw a black rectangle over live text.
- OCR uses tesseract.js locally; language packs are cached on the device.
- Batch runs one file at a time to keep memory bounded and returns a zip.

The source is public (AGPL-3.0), and `/proof` shows the live network monitor, CSP and
build hash. The honest limits: device memory, no cloud storage/sync, no Office
conversion, no e-signature audit trail. Feedback on real-world files is welcome.

## Privacy Guides

Do not spam the forum or submit a low-effort link. If the community has a suggestions
thread, use it. Lead with the proof, not the marketing:

> Pagoblin is a local-first PDF toolkit. The source is AGPL-3.0, and `/proof` shows a
> live network monitor, the exact CSP and the build hash. It has no accounts, no ads
> and no analytics by default. The trade-off is that heavy jobs use the device's CPU
> and memory, and there is no cloud storage, sync or Office conversion. I am the
> maintainer; I am sharing it for evaluation, not asking for a recommendation.

## awesome-selfhosted

**Hold.** The list is for software you can host yourself. Pagoblin is currently a
static Next.js deployment, not a supported Docker/Teams package. Submitting before
that exists would waste maintainer time and mislead readers.

Submit only after all of these are true:

- A documented Docker image or compose file exists.
- The image runs without outbound traffic.
- A Teams/self-host licence path exists, or the free self-host path is clearly
  documented.
- The README has a self-hosting section with upgrade and backup notes.

## Launch-day checklist

- [ ] Open the app on a phone and a laptop.
- [ ] Run one job with the network off.
- [ ] Confirm `/proof` shows the current commit and source hash.
- [ ] Check the OG image renders on X, Slack and Discord.
- [ ] Read the current rules for each community.
- [ ] Post from a personal account and disclose that you are the maker.
- [ ] Stay in the thread and answer criticism without defensiveness.
- [ ] Do not ask for upvotes, and do not coordinate votes.
- [ ] Record installs/activations only in aggregate; never identify a person.
- [ ] Write down the three most common complaints and fix the worst one first.

## Response templates

**“Why not just use Smallpdf/iLovePDF?”**

They are mature cloud suites and they do things Pagoblin does not, especially Office
conversion, team administration and e-signature workflows. Pagoblin is for the case
where the file should not leave the device, or where you need to work offline. If
uploading is fine and you need the broader suite, use them.

**“How do I know you are not uploading?”**

The source is public, and `/proof` shows a live network monitor, the exact CSP and
the build hash. You can also load a tool, switch off the network and run it again.
The privacy e2e test embeds a marker in a generated PDF and asserts that no request
leaves the origin.

**“Is it really free?”**

Every current tool is free, including batch and OCR. There is no account, no daily
task cap and no watermark. A one-time Pro licence is planned for future extras such
as a native desktop app and Teams self-hosting, but it is not for sale yet.

**“Why is the first OCR run slow?”**

The OCR engine and language pack load from the app the first time, then stay cached
on the device. The job itself is CPU-heavy because it runs locally.

## Metrics

The plan's exit target is the first 1,000 installs, roughly 1% paid and under 2% error
rate. Count activations, not identities. This build ships no analytics by default; if
the optional Plausible integration is enabled, it receives page URLs and aggregate
counts only. There is no checkout yet, so the paid number is zero by design.
