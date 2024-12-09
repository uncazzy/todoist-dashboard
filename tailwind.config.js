/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-pink-700',    // berry_red
    'bg-red-600',     // red
    'bg-orange-400',  // orange
    'bg-yellow-400',  // yellow
    'bg-lime-600',    // olive_green
    'bg-lime-500',    // lime_green
    'bg-green-600',   // green
    'bg-teal-400',    // mint_green
    'bg-cyan-600',    // teal
    'bg-sky-500',     // sky_blue
    'bg-blue-300',    // light_blue
    'bg-blue-500',    // blue
    'bg-purple-500',  // grape
    'bg-fuchsia-600', // violet
    'bg-fuchsia-300', // lavender
    'bg-pink-500',    // magenta
    'bg-red-400',     // salmon
    'bg-neutral-500', // charcoal
    'bg-neutral-400', // grey
    'bg-stone-400',   // taupe
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
