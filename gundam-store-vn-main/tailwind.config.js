/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 18px 50px rgba(37,99,235,.10)",
      },
    },
  },
  plugins: [],
};
