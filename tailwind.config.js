/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  corePlugins: {
    preflight: false,       // don't reset — MUI already handles base styles
  },
  theme: {
    extend: {
      animation: {
        float: "float 16s ease-in-out infinite",
        "grid-move": "grid-move 4s linear infinite",
        beam: "beam 8s linear infinite",
        shine: "shine 4s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(40px, -50px) scale(1.15)" },
        },
        "grid-move": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(60px)" },
        },
        beam: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(calc(100vw + 300px))" },
        },
        shine: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};
