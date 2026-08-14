/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-navy": "#0A1428",
        "lemon-green": "#A3E635",
        primary: "#A3E635",
        "primary-foreground": "#0A1428",
      },
    },
  },
  plugins: [],
};
