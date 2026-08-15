/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14181A",
        "ink-soft": "#3A4247",
        paper: "#FAF7F0",
        "paper-dim": "#F1ECE0",
        brass: "#B8862E",
        "brass-soft": "#E7C77E",
        sage: "#2F5D50",
        "sage-soft": "#E4EFE9",
        rust: "#B54834",
        "rust-soft": "#F6E2DC",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        seal: "9999px",
      },
    },
  },
  plugins: [],
};
