/**
 * Extends design-kit/tokens/tailwind.config.js verbatim (colours, fonts, radii).
 * Anything added here exists in design-kit/tokens/tokens.json unless commented.
 * Never hardcode these values elsewhere; import theme tokens from the config.
 */
const kit = require("./design-kit/tokens/tailwind.config.js");

const tokens = require("./design-kit/tokens/tokens.json");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ...kit.theme.extend.colors,
        dim: tokens.color.dim, // #5A4B3B (in tokens.json, missing from kit js)
        "cream-shade": tokens.color["cream-shade"],
        "amber-deep": tokens.color["amber-deep"],
      },
      fontFamily: kit.theme.extend.fontFamily,
      borderRadius: {
        ...kit.theme.extend.borderRadius,
        "phone-chip": "22px",
        pill: "9999px", // tokens.json radius.pill; was missing from the kit config
      },
      fontSize: {
        "display-xl": [`${tokens.size["display-xl"]}px`, { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-l": [`${tokens.size["display-l"]}px`, { lineHeight: "1", letterSpacing: "-0.03em" }],
        h1: [`${tokens.size.h1}px`, { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "800" }],
        h2: [`${tokens.size.h2}px`, { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        h3: [`${tokens.size.h3}px`, { lineHeight: "1.1", fontWeight: "800" }],
        h4: [`${tokens.size.h4}px`, { lineHeight: "1.2", fontWeight: "700" }],
        "body-l": [`${tokens.size["body-l"]}px`, { lineHeight: "1.4" }],
        body: [`${tokens.size.body}px`, { lineHeight: "1.45" }],
        small: [`${tokens.size.small}px`, { lineHeight: "1.4" }],
        micro: [`${tokens.size.micro}px`, { lineHeight: "1.3" }],
      },
      spacing: {
        "page-x": `${tokens.space["page-x"]}px`,
        gap: `${tokens.space.gap}px`,
        "section-web": `${tokens.space["section-web"]}px`,
        "touch-min": `${tokens["touch-min"]}px`,
        // half-step for the 18px insets seen in screens (maps to tokens gap+6)
        4.5: "18px",
      },
      rotate: {
        // screen tilt moments from tokens.rotation-deg
        "tilt-a": `${tokens["rotation-deg"]["tilt-a"]}deg`,
        "tilt-b": `${tokens["rotation-deg"]["tilt-b"]}deg`,
        "tilt-c": `${tokens["rotation-deg"]["tilt-c"]}deg`,
        // plain degree axis (magnitude = name), for the few other card tilts
        2: "2deg",
        "-2": "-2deg",
        3: "3deg",
        "-3": "-3deg",
        4: "4deg",
        "-4": "-4deg",
        5: "5deg",
        "-5": "-5deg",
        6: "6deg",
        "-6": "-6deg",
        8: "8deg",
        "-8": "-8deg",
      },
      zIndex: {
        100: "100",
        101: "101",
        60: "60",
      },
      skins: {},
      boxShadow: {
        chip: "0 10px 24px rgba(0, 0, 0, 0.4)",
        drag: "0 14px 30px rgba(0, 0, 0, 0.5)",
        pop: "0 4px 10px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};
