// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bgColor: "#102025",
        navContainer: "#263238",
        navPillDark: "#004d40",
        navPillBright: "#00e676",
        ctaButtonBright: "#6fff54",
        footerBg: "#042f2e",
        footerLinkTitle: "#9ef01a",
        notificationRed: "#ff1744",
      },
      fontFamily: {
        urbanist: ["Urbanist", "sans-serif"],
        "roboto-condensed": ['"Roboto Condensed"', "sans-serif"],
        "russo-one": ['"Russo One"', "sans-serif"],
      },
      animation: {
        "scroll-left": "scroll-left 30s linear infinite",
      },
      keyframes: {
        "scroll-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
