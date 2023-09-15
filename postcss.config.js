//postcss.config.js
const tailwindcss = require('tailwindcss');
module.exports = {
    tailwindcss('./tailwind.js'),
  plugins: [require("autoprefixer")],
};
