import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pagoblin — private PDF tools",
    short_name: "Pagoblin",
    description: "Merge, split, compress, convert and sign PDFs right on your device. Pip does the chewing.",
    id: "/app",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    lang: "en",
    dir: "ltr",
    orientation: "any",
    background_color: "#17130F",
    theme_color: "#17130F",
    categories: ["productivity", "utilities"],
    shortcuts: [
      { name: "Merge PDFs", short_name: "Merge", url: "/merge-pdf", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Compress a PDF", short_name: "Compress", url: "/compress-pdf", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Split a PDF", short_name: "Split", url: "/split-pdf", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Sign a PDF", short_name: "Sign", url: "/sign-pdf", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
    screenshots: [
      { src: "/screenshots/phone-home.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Drop a PDF and pick a tool" },
      { src: "/screenshots/phone-compress.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Squeeze a PDF to an exact size" },
      { src: "/screenshots/desktop-home.png", sizes: "1280x720", type: "image/png", form_factor: "wide", label: "Private PDF tools on your laptop" },
      { src: "/screenshots/desktop-tools.png", sizes: "1280x720", type: "image/png", form_factor: "wide", label: "Every tool in one place" },
    ],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    share_target: {
      action: "/share",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        files: [{ name: "files", accept: ["application/pdf"] }],
        title: "title",
        text: "text",
      },
    },
  };
}
