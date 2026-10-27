/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Deep, trustworthy teal — the platform's clinical/primary color
        teal: {
          50: "#EEF7F6",
          100: "#D3EBE8",
          200: "#A7D7D0",
          300: "#78C0B6",
          400: "#4CA89B",
          500: "#2E8E80",
          600: "#0C8479",
          700: "#0A6A62",
          800: "#0B534D",
          900: "#0C4440",
        },
        // Deep ink navy for text and dark sections
        ink: {
          50: "#F2F5F8",
          100: "#DCE3EB",
          400: "#5C6B7F",
          600: "#33445C",
          800: "#182741",
          900: "#0F1B2D",
        },
        // Warm amber accent — used sparingly for human/interpreter touches & CTAs
        amber: {
          50: "#FDF3E3",
          100: "#FBE6C2",
          400: "#EFB65C",
          500: "#E8A33D",
          600: "#CE8A25",
        },
        // Soft mint surface tint
        mist: {
          50: "#F5FAF9",
          100: "#EAF5F3",
        },
        // Signal red for urgent/cancel states
        signal: {
          500: "#D64545",
          600: "#B93636",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(15, 27, 45, 0.18)",
      },
    },
  },
  plugins: [],
};
