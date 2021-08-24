module.exports = {
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      mono: ['"Fira Mono"', "monospace"],
      serif: ['"Inter"', "sans-serif"],
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
