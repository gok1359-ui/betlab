/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        betlab: {
          bg: "#071122",
          card: "#102043",
          line: "rgba(255,255,255,0.08)",
          text: "#f8fafc",
          soft: "rgba(248,250,252,0.72)",
          primary: "#60a5fa",
          secondary: "#818cf8",
          accent: "#22d3ee",
        },
      },
      boxShadow: {
        betlab: "0 18px 48px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        betlab: "24px",
      },
      fontFamily: {
        pretendard: ["Pretendard", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
