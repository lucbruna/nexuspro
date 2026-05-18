/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans","-apple-system","sans-serif"],
        mono: ["JetBrains Mono","monospace"],
      },
    },
  },
  plugins: [],
};
