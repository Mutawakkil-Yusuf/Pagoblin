/** Stroke icon set matching the design kit's 24px stroke-2.2 line style. */
import type { SVGProps } from "react";

function I({ children, ...p }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);

export const IconBack = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M15 5l-7 7 7 7" />
  </I>
);

export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </I>
);

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M5 12l5 5L20 7" />
  </I>
);

export const IconArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </I>
);

export const IconDrag = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M5 9h14M5 15h14" />
  </I>
);

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </I>
);

export const IconTools = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <rect x="4" y="4" width="7" height="7" rx="2" />
    <rect x="13" y="4" width="7" height="7" rx="2" />
    <rect x="4" y="13" width="7" height="7" rx="2" />
    <rect x="13" y="13" width="7" height="7" rx="2" />
  </I>
);

export const IconFlows = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M5 5v6a4 4 0 004 4h10" />
    <path d="M15 11l4 4-4 4" />
    <circle cx="5" cy="4" r="1.6" fill="currentColor" stroke="none" />
  </I>
);

export const IconGear = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v3M12 18.2v3M4.8 7.2l2.1 1.7M17.1 15.1l2.1 1.7M4.8 16.8l2.1-1.7M17.1 8.9l2.1-1.7" />
  </I>
);

export const IconSoundOn = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M4 9h3l5-4v14l-5-4H4z" />
    <path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11" />
  </I>
);

export const IconSoundOff = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M4 9h3l5-4v14l-5-4H4z" />
    <path d="M16.5 9.5l4 5M20.5 9.5l-4 5" />
  </I>
);

export const IconDownload = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M12 4v11M6 11l6 6 6-6" />
    <path d="M5 20h14" />
  </I>
);

export const IconShare = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <circle cx="6" cy="12" r="2.4" />
    <circle cx="18" cy="6" r="2.4" />
    <circle cx="18" cy="18" r="2.4" />
    <path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" />
  </I>
);

export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" />
  </I>
);

export const IconFile = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M7 3h7l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
    <path d="M14 3v4h4" />
  </I>
);

export const IconUndo = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M8 5L4 9l4 4" />
    <path d="M4 9h10a6 6 0 016 6v0a6 6 0 01-6 6h-3" />
  </I>
);

export const IconSparkle = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}>
    <path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8z" />
  </I>
);
