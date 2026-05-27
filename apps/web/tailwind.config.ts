import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class", "[data-theme='dark']"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          inset: "var(--bg-inset)"
        },
        text: {
          primary: "var(--text-primary)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)"
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)"
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)"
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)"
      },
      borderRadius: {
        sm: "var(--r-sm)",
        DEFAULT: "var(--r-md)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"]
      },
      transitionTimingFunction: {
        out: "var(--ease-out)"
      },
      transitionDuration: {
        fast: "140ms",
        base: "200ms",
        slow: "320ms",
        viz: "600ms"
      }
    }
  },
  plugins: [animate]
} satisfies Config;
