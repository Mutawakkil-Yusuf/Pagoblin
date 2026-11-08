import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastHost } from "@/components/ui/ToastHost";
import { MotionPreference } from "@/components/MotionPreference";
import { SoundBoot } from "@/components/SoundBoot";

// Brand fonts are self-hosted via @font-face in globals.css — no runtime
// Google Fonts request (CSP stays `connect-src 'self'`), and builds work
// offline. Fallbacks are system sans stacks.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pagoblin.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pagoblin — free, private PDF tools",
    template: "%s · Pagoblin",
  },
  description: "Merge, split, compress and sign PDFs right in your browser. Pip does the chewing. Nothing is uploaded.",
  applicationName: "Pagoblin",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    shortcut: ["/favicon.svg"],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: { siteName: "Pagoblin", type: "website" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#17130F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MotionPreference>
          <SoundBoot />
          {children}
          <ToastHost />
        </MotionPreference>
      </body>
    </html>
  );
}
