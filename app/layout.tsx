import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastHost } from "@/components/ui/ToastHost";
import { MotionPreference } from "@/components/MotionPreference";
import { SoundBoot } from "@/components/SoundBoot";
import { PwaBoot } from "@/components/pwa/PwaBoot";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Brand fonts are self-hosted via @font-face in globals.css — no runtime
// Google Fonts request (CSP stays `connect-src 'self'`), and builds work
// offline. Fallbacks are system sans stacks.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pagoblin — free, private PDF tools",
    template: "%s · Pagoblin",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    shortcut: ["/favicon.svg"],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    title: "Pagoblin — free, private PDF tools",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Pagoblin — private PDF tools that never ask for your files",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pagoblin — free, private PDF tools",
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
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
      <head>
        {/* beforeinstallprompt fires once and early: keep it for the install buttons (lib/pwa.ts). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e;});",
          }}
        />
      </head>
      <body>
        <MotionPreference>
          <SoundBoot />
          <PwaBoot />
          {children}
          <ToastHost />
        </MotionPreference>
      </body>
    </html>
  );
}
