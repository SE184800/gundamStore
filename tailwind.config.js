/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 18px 50px rgba(37,99,235,.10)",
      },
      borderRadius: {
        "4xl": "28px",
        "5xl": "32px",
        "6xl": "36px",
      },
    },
  },
  plugins: [],
};
