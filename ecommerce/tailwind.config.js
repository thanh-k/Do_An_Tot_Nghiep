/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#bcd6ff",
          300: "#8eb9ff",
          400: "#5a92ff",
          500: "#326fff",
          600: "#1f54f5",
          700: "#1e45e1",
          800: "#213bb6",
          900: "#22378f"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        "hero-pattern":
          "radial-gradient(circle at top right, rgba(27, 93, 247, 0.18), transparent 38%), radial-gradient(circle at left center, rgba(20,184,166,0.12), transparent 28%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #1e293b 100%)",
      }
    },
  },
  plugins: [],
};
