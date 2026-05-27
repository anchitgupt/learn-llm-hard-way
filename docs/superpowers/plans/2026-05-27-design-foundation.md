# Design Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-rolled CSS layer of the Learn LLM web app with a tokenised, dark-mode-first foundation built on Tailwind + shadcn/ui, without changing how any current screen looks.

**Architecture:** Five sequential, independently verifiable steps. Each step leaves the app working and tested. Tokens live as CSS variables under `[data-theme="dark"]`. Tailwind maps to those variables, so a future light theme is one CSS block away. The old `apps/web/src/styles.css` keeps controlling existing screens until later sub-projects migrate them.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind 3.4, shadcn/ui (CSS-variables style), Motion-for-React, Radix UI primitives, JetBrains Mono + Inter (from fonts.bunny.net), vitest, Playwright.

**Spec:** [docs/superpowers/specs/2026-05-27-design-foundation.md](../specs/2026-05-27-design-foundation.md)

---

## Pre-flight

This plan modifies `main` history. Before starting, create a branch so review and revert are clean.

- [ ] **Pre-flight Step 1: Create a feature branch**

```bash
cd /Users/anchitgupta/Documents/Github/learn-llm-hard-way
git checkout -b design-foundation
git status
```

Expected: branch `design-foundation` checked out, working tree clean.

- [ ] **Pre-flight Step 2: Capture baseline test counts**

Run each suite once and note the counts. The plan's verification steps assume these numbers don't drop.

```bash
source .venv/bin/activate
npm run labs:test 2>&1 | tail -2
npm run api:test  2>&1 | tail -2
npm run web:test  2>&1 | tail -3
```

Expected: labs 20 passed, api 15 passed, web 8 files / 10 tests passed.

---

## Task 1: Add dependencies and Tailwind / PostCSS config

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`

- [ ] **Step 1.1: Add the dependencies**

Run from repo root:

```bash
npm --prefix apps/web install -D \
  tailwindcss@^3.4 postcss@^8 autoprefixer@^10 \
  tailwindcss-animate@^1.0 \
  class-variance-authority@^0.7 clsx@^2.1 tailwind-merge@^2.5
npm --prefix apps/web install lucide-react@^0.460
```

Expected: install succeeds; `apps/web/package.json` lists the new packages.

- [ ] **Step 1.2: Create `apps/web/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

- [ ] **Step 1.3: Create `apps/web/tailwind.config.ts`**

The colour, spacing, and radius keys map to the CSS variables we will define in Task 2. They reference variables that don't exist yet; that's fine — Tailwind only resolves them at render time.

```ts
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
```

- [ ] **Step 1.4: Verify build and existing tests still pass**

Tailwind isn't imported anywhere yet, so this only proves we haven't broken the build pipeline.

```bash
npm --prefix apps/web run build
npm --prefix apps/web test
```

Expected: build succeeds; 8 test files / 10 tests pass.

- [ ] **Step 1.5: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json \
        apps/web/tailwind.config.ts apps/web/postcss.config.js
git commit -m "feat(web): add Tailwind + PostCSS + foundation deps

No styles consumed yet; existing screens unaffected.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Tokens, globals, and typography CSS

**Files:**
- Create: `apps/web/src/styles/tokens.css`
- Create: `apps/web/src/styles/globals.css`
- Create: `apps/web/src/styles/typography.css`
- Modify: `apps/web/index.html`
- Modify: `apps/web/src/main.tsx`
- Create: `apps/web/src/__tests__/foundation-tokens.test.ts`

- [ ] **Step 2.1: Write the failing token test**

`apps/web/src/__tests__/foundation-tokens.test.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest";
import "../styles/tokens.css";

describe("design tokens", () => {
  beforeAll(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  it("exposes the cyan accent token on the dark theme", () => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim();
    expect(value).toBe("#22d3ee");
  });

  it("exposes the base background token", () => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--bg-base")
      .trim();
    expect(value).toBe("#0b1220");
  });
});
```

- [ ] **Step 2.2: Run the test, confirm it fails**

```bash
npm --prefix apps/web test -- foundation-tokens 2>&1 | tail -10
```

Expected: FAIL — module not found (`../styles/tokens.css`).

- [ ] **Step 2.3: Create `apps/web/src/styles/tokens.css`**

```css
:root[data-theme="dark"] {
  /* Surfaces */
  --bg-base: #0b1220;
  --bg-surface: #131a2a;
  --bg-elevated: #1a2238;
  --bg-inset: #060a14;

  /* Text */
  --text-primary: #e6edf7;
  --text-muted: #8a96a8;
  --text-faint: #5a6478;

  /* Borders */
  --border-subtle: #1f2840;
  --border: #2a3450;
  --border-strong: #3a4870;

  /* Accent */
  --accent: #22d3ee;
  --accent-hover: #67e8f9;
  --accent-glow: rgba(34, 211, 238, 0.20);
  --accent-quiet: rgba(34, 211, 238, 0.10);

  /* Status */
  --success: #34d399;
  --warning: #fbbf24;
  --danger: #f87171;
  --info: #60a5fa;

  /* Spacing */
  --s-0: 0;
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 24px;
  --s-6: 32px;
  --s-7: 48px;
  --s-8: 64px;
  --s-9: 96px;

  /* Radius */
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-xl: 20px;
  --r-full: 9999px;

  /* Type families */
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.6);
  --glow-accent: 0 0 0 1px var(--accent-quiet), 0 0 16px var(--accent-glow);

  /* Motion */
  --dur-fast: 140ms;
  --dur-base: 200ms;
  --dur-slow: 320ms;
  --dur-viz: 600ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

- [ ] **Step 2.4: Create `apps/web/src/styles/globals.css`**

```css
@import url("https://fonts.bunny.net/css?family=inter:400,500,600|jetbrains-mono:400&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html,
  body,
  #root {
    height: 100%;
  }

  body {
    background: var(--bg-base);
    color: var(--text-primary);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  *:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: var(--r-sm);
  }

  ::selection {
    background: var(--accent-quiet);
    color: var(--text-primary);
  }
}
```

- [ ] **Step 2.5: Create `apps/web/src/styles/typography.css`**

```css
@layer components {
  .prose-lesson {
    color: var(--text-primary);
    font-size: 15px;
    line-height: 22px;
  }

  .prose-lesson h1 { font-size: 24px; line-height: 32px; font-weight: 600; margin: 24px 0 12px; }
  .prose-lesson h2 { font-size: 20px; line-height: 28px; font-weight: 600; margin: 24px 0 12px; }
  .prose-lesson h3 { font-size: 17px; line-height: 24px; font-weight: 600; margin: 20px 0 8px; }
  .prose-lesson p { margin: 12px 0; }
  .prose-lesson ul,
  .prose-lesson ol { margin: 12px 0 12px 24px; }
  .prose-lesson li { margin: 4px 0; }
  .prose-lesson a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .prose-lesson a:hover { color: var(--accent-hover); }
  .prose-lesson code {
    font-family: var(--font-mono);
    font-size: 14px;
    background: var(--bg-inset);
    padding: 1px 6px;
    border-radius: var(--r-sm);
    border: 1px solid var(--border-subtle);
  }
  .prose-lesson pre {
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 22px;
    background: var(--bg-inset);
    border: 1px solid var(--border-subtle);
    border-radius: var(--r-md);
    padding: 16px;
    overflow-x: auto;
    margin: 16px 0;
  }
  .prose-lesson pre code {
    background: transparent;
    border: 0;
    padding: 0;
  }
  .prose-lesson blockquote {
    margin: 16px 0;
    padding: 8px 16px;
    border-left: 2px solid var(--accent);
    color: var(--text-muted);
  }
}
```

- [ ] **Step 2.6: Update `apps/web/index.html` to set the dark theme**

Find the `<html>` opening tag and change it to:

```html
<html lang="en" data-theme="dark">
```

- [ ] **Step 2.7: Update `apps/web/src/main.tsx` to import the new CSS alongside the existing one**

Add the three new imports **above** the existing `import "./styles.css";` so the old file (loaded last) still wins where it overlaps:

```ts
import "./styles/tokens.css";
import "./styles/globals.css";
import "./styles/typography.css";
import "./styles.css";
```

- [ ] **Step 2.8: Run the token test, confirm it passes**

```bash
npm --prefix apps/web test -- foundation-tokens 2>&1 | tail -10
```

Expected: PASS — both token assertions green.

- [ ] **Step 2.9: Run the full web suite and build**

```bash
npm --prefix apps/web test
npm --prefix apps/web run build
```

Expected: 9 files / 12 tests pass (10 baseline + 2 new); build succeeds.

- [ ] **Step 2.10: Commit**

```bash
git add apps/web/src/styles/ apps/web/src/main.tsx apps/web/index.html \
        apps/web/src/__tests__/foundation-tokens.test.ts
git commit -m "feat(web): introduce dark-theme tokens and globals

Tokens defined under [data-theme=dark]. Old styles.css still loaded last
so existing screens render unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: shadcn init, primitives, and helpers

This task brings in 15 shadcn primitives plus the custom KBD and CodeBlock, the `cn()` helper, and the Motion helpers.

**Files:**
- Create: `apps/web/components.json`
- Create: `apps/web/src/lib/cn.ts`
- Create: `apps/web/src/__tests__/cn.test.ts`
- Create: `apps/web/src/lib/motion.ts`
- Create: `apps/web/src/__tests__/Reveal.test.tsx`
- Create: `apps/web/src/components/ui/*.tsx` (15 shadcn files)
- Create: `apps/web/src/components/ui/kbd.tsx`
- Create: `apps/web/src/components/ui/__tests__/kbd.test.tsx`
- Create: `apps/web/src/components/ui/code-block.tsx`
- Create: `apps/web/src/components/ui/__tests__/code-block.test.tsx`

### 3a. The `cn()` helper

- [ ] **Step 3a.1: Write the failing cn() test**

`apps/web/src/__tests__/cn.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cn } from "../lib/cn";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("strips conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
  it("filters falsy values", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe("a c");
  });
});
```

- [ ] **Step 3a.2: Run and confirm it fails**

```bash
npm --prefix apps/web test -- cn 2>&1 | tail -10
```

Expected: FAIL — module `../lib/cn` not found.

- [ ] **Step 3a.3: Implement `apps/web/src/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3a.4: Run and confirm it passes**

```bash
npm --prefix apps/web test -- cn 2>&1 | tail -10
```

Expected: PASS — 3 assertions.

### 3b. Motion helpers and `<Reveal>` reduced-motion test

- [ ] **Step 3b.1: Write the failing Reveal test**

`apps/web/src/__tests__/Reveal.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reveal } from "../lib/motion";

describe("Reveal", () => {
  it("renders its children", () => {
    render(<Reveal><span>hello</span></Reveal>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders a plain div when prefers-reduced-motion is set", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null
    })) as unknown as typeof window.matchMedia;

    const { container } = render(<Reveal data-testid="reveal"><span>x</span></Reveal>);
    const wrapper = container.firstElementChild;
    expect(wrapper?.tagName).toBe("DIV");
    expect(wrapper?.getAttribute("style") ?? "").not.toContain("opacity");

    window.matchMedia = originalMatchMedia;
  });
});
```

- [ ] **Step 3b.2: Run and confirm it fails**

```bash
npm --prefix apps/web test -- Reveal 2>&1 | tail -10
```

Expected: FAIL — module `../lib/motion` not found.

- [ ] **Step 3b.3: Implement `apps/web/src/lib/motion.ts`**

```tsx
import { motion, type Transition, type Variants } from "motion/react";
import { type PropsWithChildren, type HTMLAttributes } from "react";

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] } }
};

export const panelEnter: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] } }
};

export const listStagger: Variants = {
  show: { transition: { staggerChildren: 0.04 } }
};

export const drawPath: Variants = {
  hidden: { pathLength: 0 },
  show: { pathLength: 1, transition: { duration: 0.6, ease: "easeInOut" } }
};

export const springViz: Transition = { type: "spring", stiffness: 180, damping: 22 };

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type RevealProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function Reveal({ children, ...rest }: RevealProps) {
  if (prefersReducedMotion()) {
    return <div {...rest}>{children}</div>;
  }
  return (
    <motion.div variants={panelEnter} initial="hidden" animate="show" {...rest}>
      {children}
    </motion.div>
  );
}

export function Stagger({ children, ...rest }: RevealProps) {
  if (prefersReducedMotion()) {
    return <div {...rest}>{children}</div>;
  }
  return (
    <motion.div variants={listStagger} initial="hidden" animate="show" {...rest}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 3b.4: Run and confirm both Reveal tests pass**

```bash
npm --prefix apps/web test -- Reveal 2>&1 | tail -10
```

Expected: PASS — 2 assertions.

### 3c. shadcn init and primitives

- [ ] **Step 3c.1: Create `apps/web/components.json`**

Done manually rather than via the interactive `npx shadcn init` so the plan is reproducible.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/cn",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3c.2: Configure the `@/` path alias in TypeScript and Vite**

shadcn-generated files use `@/lib/cn` and `@/components/ui` imports. Without this alias the project fails typecheck.

Edit `apps/web/tsconfig.json` — add `compilerOptions.baseUrl` and `paths`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Edit `apps/web/vite.config.ts` — add a `resolve.alias` entry:

```ts
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true
  }
});
```

- [ ] **Step 3c.3: Add the 15 shadcn primitives**

Run each command from the repo root. `--yes` auto-installs each component's Radix peer deps.

```bash
cd apps/web
npx shadcn@latest add button --yes
npx shadcn@latest add card --yes
npx shadcn@latest add tabs --yes
npx shadcn@latest add dialog --yes
npx shadcn@latest add sheet --yes
npx shadcn@latest add tooltip --yes
npx shadcn@latest add badge --yes
npx shadcn@latest add separator --yes
npx shadcn@latest add scroll-area --yes
npx shadcn@latest add sonner --yes
npx shadcn@latest add progress --yes
npx shadcn@latest add toggle --yes
npx shadcn@latest add switch --yes
npx shadcn@latest add select --yes
npx shadcn@latest add skeleton --yes
cd ../..
```

Expected: 15 files created in `apps/web/src/components/ui/`. New `@radix-ui/react-*` packages added to `apps/web/package.json`.

- [ ] **Step 3c.4: Verify typecheck and build pass after primitives land**

```bash
npm --prefix apps/web run build
```

Expected: typecheck clean, vite build succeeds. (If any shadcn file uses an import path style the codebase rejects, fix the import to use the `@/` alias.)

### 3d. Custom KBD primitive

- [ ] **Step 3d.1: Write the failing KBD test**

`apps/web/src/components/ui/__tests__/kbd.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KBD } from "../kbd";

describe("KBD", () => {
  it("renders inside a <kbd> element with the mono class", () => {
    render(<KBD>Cmd+K</KBD>);
    const el = screen.getByText("Cmd+K");
    expect(el.tagName).toBe("KBD");
    expect(el.className).toMatch(/font-mono/);
  });
});
```

- [ ] **Step 3d.2: Run and confirm it fails**

```bash
npm --prefix apps/web test -- kbd 2>&1 | tail -10
```

Expected: FAIL — `../kbd` not found.

- [ ] **Step 3d.3: Implement `apps/web/src/components/ui/kbd.tsx`**

```tsx
import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export type KBDProps = HTMLAttributes<HTMLElement>;

export const KBD = forwardRef<HTMLElement, KBDProps>(function KBD(
  { className, children, ...rest },
  ref
) {
  return (
    <kbd
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-sm border border-border-subtle bg-bg-inset px-1.5 py-0.5",
        "font-mono text-[12px] leading-[16px] text-text-muted",
        className
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
});
```

- [ ] **Step 3d.4: Run and confirm it passes**

```bash
npm --prefix apps/web test -- kbd 2>&1 | tail -10
```

Expected: PASS.

### 3e. Custom CodeBlock primitive

- [ ] **Step 3e.1: Write the failing CodeBlock test**

`apps/web/src/components/ui/__tests__/code-block.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CodeBlock } from "../code-block";

describe("CodeBlock", () => {
  it("renders code inside a <pre><code> with mono styling", () => {
    render(<CodeBlock>{"print('hi')"}</CodeBlock>);
    const code = screen.getByText("print('hi')");
    expect(code.tagName).toBe("CODE");
    expect(code.closest("pre")).not.toBeNull();
    expect(code.closest("pre")?.className).toMatch(/font-mono/);
  });

  it("exposes a copy button when copyable", () => {
    render(<CodeBlock copyable>{"x"}</CodeBlock>);
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3e.2: Run and confirm it fails**

```bash
npm --prefix apps/web test -- code-block 2>&1 | tail -10
```

Expected: FAIL — `../code-block` not found.

- [ ] **Step 3e.3: Implement `apps/web/src/components/ui/code-block.tsx`**

```tsx
import { type ReactNode, useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export interface CodeBlockProps {
  children: ReactNode;
  language?: string;
  copyable?: boolean;
  className?: string;
}

export function CodeBlock({ children, language, copyable = false, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const text = typeof children === "string" ? children : "";

  async function onCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable; silent */
    }
  }

  return (
    <div className={cn("relative", className)}>
      <pre
        data-language={language}
        className={cn(
          "font-mono text-[14px] leading-[22px] text-text-primary",
          "bg-bg-inset border border-border-subtle rounded-md p-4 overflow-x-auto"
        )}
      >
        <code>{children}</code>
      </pre>
      {copyable && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCopy}
          aria-label="Copy"
          className="absolute top-2 right-2 h-7 w-7 p-0 text-text-muted hover:text-text-primary"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3e.4: Run and confirm both CodeBlock tests pass**

```bash
npm --prefix apps/web test -- code-block 2>&1 | tail -10
```

Expected: PASS — 2 assertions.

### 3f. Verify the whole web suite and commit

- [ ] **Step 3f.1: Run all web tests and build**

```bash
npm --prefix apps/web test
npm --prefix apps/web run build
```

Expected: all tests pass (12 baseline-plus-new from Task 2 + 3 cn + 2 Reveal + 1 kbd + 2 code-block = 20 tests minimum). Build clean.

- [ ] **Step 3f.2: Commit**

```bash
git add apps/web/components.json apps/web/tsconfig.json apps/web/vite.config.ts \
        apps/web/src/lib/ apps/web/src/components/ui/ \
        apps/web/src/__tests__/cn.test.ts \
        apps/web/src/__tests__/Reveal.test.tsx \
        apps/web/package.json apps/web/package-lock.json
git commit -m "feat(web): add shadcn primitives, cn(), Motion helpers, KBD, CodeBlock

15 shadcn components (CSS-variables style) + custom KBD and CodeBlock.
@/ path alias wired in tsconfig and vite. No existing screen touched.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Foundation showcase route

The showcase is reached by typing `/__foundation` in the URL bar. The app has no router; a plain `window.location.pathname` check in `App.tsx` is enough.

**Files:**
- Create: `apps/web/src/components/FoundationShowcase.tsx`
- Modify: `apps/web/src/App.tsx`
- Create: `apps/web/src/__tests__/FoundationShowcase.test.tsx`

- [ ] **Step 4.1: Write the failing showcase test**

`apps/web/src/__tests__/FoundationShowcase.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FoundationShowcase } from "../components/FoundationShowcase";

describe("FoundationShowcase", () => {
  it("renders a heading and at least one Button primitive", () => {
    render(<FoundationShowcase />);
    expect(screen.getByRole("heading", { name: /design foundation/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("renders the cyan accent swatch with its hex code", () => {
    render(<FoundationShowcase />);
    expect(screen.getByText("#22d3ee")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4.2: Run and confirm it fails**

```bash
npm --prefix apps/web test -- FoundationShowcase 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 4.3: Implement `apps/web/src/components/FoundationShowcase.tsx`**

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { KBD } from "@/components/ui/kbd";
import { CodeBlock } from "@/components/ui/code-block";
import { Reveal, Stagger } from "@/lib/motion";

const SWATCHES: Array<[string, string]> = [
  ["--bg-base", "#0b1220"],
  ["--bg-surface", "#131a2a"],
  ["--bg-elevated", "#1a2238"],
  ["--bg-inset", "#060a14"],
  ["--text-primary", "#e6edf7"],
  ["--text-muted", "#8a96a8"],
  ["--text-faint", "#5a6478"],
  ["--accent", "#22d3ee"],
  ["--success", "#34d399"],
  ["--warning", "#fbbf24"],
  ["--danger", "#f87171"],
  ["--info", "#60a5fa"]
];

export function FoundationShowcase() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-8 space-y-10">
      <header>
        <h1 className="text-[32px] leading-[40px] font-semibold">Design Foundation</h1>
        <p className="text-text-muted mt-2">
          Internal showcase route. Verifies every primitive, motion helper, and token swatch.
        </p>
      </header>

      <section>
        <h2 className="text-[20px] leading-[28px] font-semibold mb-4">Tokens</h2>
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SWATCHES.map(([name, hex]) => (
            <Reveal key={name} className="flex items-center gap-3 p-3 bg-bg-surface border border-border-subtle rounded-md">
              <span
                aria-hidden
                className="h-8 w-8 rounded-sm border border-border-subtle"
                style={{ background: `var(${name})` }}
              />
              <div className="text-[13px] leading-[16px]">
                <div className="font-mono text-text-muted">{name}</div>
                <div className="font-mono">{hex}</div>
              </div>
            </Reveal>
          ))}
        </Stagger>
      </section>

      <section>
        <h2 className="text-[20px] leading-[28px] font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Danger</Button>
        </div>
      </section>

      <section>
        <h2 className="text-[20px] leading-[28px] font-semibold mb-4">Card + Tabs</h2>
        <Card className="bg-bg-surface border-border-subtle">
          <CardHeader>
            <CardTitle>Concept Workspace (preview)</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="explanation">
              <TabsList>
                <TabsTrigger value="explanation">Explanation</TabsTrigger>
                <TabsTrigger value="lab">Lab</TabsTrigger>
                <TabsTrigger value="checkpoint">Checkpoint</TabsTrigger>
              </TabsList>
              <TabsContent value="explanation" className="pt-4 text-text-muted">
                The explanation tab uses prose styling from typography.css.
              </TabsContent>
              <TabsContent value="lab" className="pt-4">
                <CodeBlock copyable language="python">{"def softmax(x):\n    e = [math.exp(v) for v in x]\n    s = sum(e)\n    return [v / s for v in e]"}</CodeBlock>
              </TabsContent>
              <TabsContent value="checkpoint" className="pt-4 flex items-center gap-3">
                <Badge>open</Badge>
                <Progress value={60} className="w-48" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-[20px] leading-[28px] font-semibold mb-4">Misc</h2>
        <div className="flex flex-wrap items-center gap-4">
          <KBD>Cmd</KBD>
          <KBD>K</KBD>
          <Switch />
          <Skeleton className="h-6 w-32 bg-bg-elevated" />
          <Separator className="w-32 bg-border" orientation="horizontal" />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4.4: Modify `apps/web/src/App.tsx` to render the showcase on `/__foundation`**

At the top of the file, add the import:

```tsx
import { FoundationShowcase } from "./components/FoundationShowcase";
```

At the very start of the `App` function body (before any hooks), add the path check:

```tsx
if (typeof window !== "undefined" && window.location.pathname === "/__foundation") {
  return <FoundationShowcase />;
}
```

Placement note: React hooks must follow the same order every render, so this **must** be the very first statement inside `App`, before any `useState`/`useEffect`. The URL never changes mid-render in this app, so the early return is safe.

- [ ] **Step 4.5: Run and confirm the showcase test passes**

```bash
npm --prefix apps/web test -- FoundationShowcase 2>&1 | tail -10
```

Expected: PASS — 2 assertions.

- [ ] **Step 4.6: Run the full web suite, build, and a quick visual smoke check**

```bash
npm --prefix apps/web test
npm --prefix apps/web run build
```

Expected: every test passes (no regressions); build clean.

Then start the dev server and load the showcase:

```bash
pkill -f "vite.*5173" 2>/dev/null
npm run web:dev &
sleep 4
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:5173/__foundation
pkill -f "vite.*5173"
```

Expected: HTTP 200.

- [ ] **Step 4.7: Commit**

```bash
git add apps/web/src/components/FoundationShowcase.tsx apps/web/src/App.tsx \
        apps/web/src/__tests__/FoundationShowcase.test.tsx
git commit -m "feat(web): add /__foundation showcase route

Internal route exercising every primitive, motion helper, and token swatch.
Reached by typing the URL; not linked from main navigation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Retire the old `styles.css` cleanly

This is the careful step. The current 354-line `apps/web/src/styles.css` controls every screen. We move the parts the *new* foundation depends on (lesson prose, code blocks) into `typography.css` if they aren't already there, and we empty out the rest — but only after confirming nothing user-facing changes.

**Files:**
- Modify: `apps/web/src/styles/typography.css` (only if existing styles.css has lesson rules not already covered)
- Modify: `apps/web/src/styles.css` (replace its content with a placeholder comment)

- [ ] **Step 5.1: Read the current `apps/web/src/styles.css`**

Open the file and identify which rules are **still in use** vs. **shipped invisibly under** the old chrome. Group them mentally:

- Group A: lesson-body / markdown / code-block rules → move to `typography.css` only if they add behaviour `prose-lesson` doesn't already cover.
- Group B: header / app-shell / button / form / panel rules → all kept inline for now; **do not move** — those screens migrate in sub-projects 2+.

Group B is what we are *not* touching. Only Group A may merge into `typography.css`.

- [ ] **Step 5.2: If Group A rules exist that aren't already in `typography.css`, append them**

Edit `apps/web/src/styles/typography.css`, appending any missing markdown/code rules under the existing `@layer components { … }` block, prefixed with `.prose-lesson` where they apply.

If nothing needs to move, skip this step.

- [ ] **Step 5.3: Replace `apps/web/src/styles.css` content with a holding marker**

Replace the **entire file contents** with:

```css
/*
 * Retired during the Design Foundation sub-project (2026-05-27).
 *
 * This file is intentionally kept empty so existing imports do not break.
 * Each screen migration in sub-projects 2+ will delete its remaining rules
 * and, eventually, remove this file entirely.
 */
```

The import in `src/main.tsx` stays as-is; it now loads a file that contributes no rules. **Existing screens will visibly change at this point** — they had been styled by this file. This is the only step in the sub-project where the running app changes visually.

- [ ] **Step 5.4: Run every suite to prove no test regresses**

```bash
source .venv/bin/activate
npm run labs:test
npm run api:test
npm run web:test
npm --prefix apps/web run build
```

Expected: labs 20 pass, api 15 pass, web suite passes (now 20+ tests with the new ones), build clean.

- [ ] **Step 5.5: Run Playwright e2e to prove user-facing flows still work**

```bash
npm run e2e
```

Expected: all 4 chromium flows pass. The flows assert on text and interactions, not pixel-level styling — they should still pass even though screens now look raw without the old chrome.

- [ ] **Step 5.6: Manual smoke check the dev server**

```bash
pkill -f "uvicorn.*learn_llm_api" 2>/dev/null; pkill -f "vite.*5173" 2>/dev/null
source .venv/bin/activate
npm run api:dev &
sleep 2
npm run web:dev &
sleep 4
curl -sS -o /dev/null -w "root HTTP %{http_code}\n"     http://127.0.0.1:5173/
curl -sS -o /dev/null -w "showcase HTTP %{http_code}\n" http://127.0.0.1:5173/__foundation
curl -sS -o /dev/null -w "api HTTP %{http_code}\n"      http://127.0.0.1:8000/health
pkill -f "uvicorn.*learn_llm_api"; pkill -f "vite.*5173"
```

Expected: all three return HTTP 200. The root page is intentionally un-styled now — that is fine and expected; later sub-projects re-skin each screen using the new primitives.

- [ ] **Step 5.7: Commit**

```bash
git add apps/web/src/styles.css apps/web/src/styles/typography.css
git commit -m "chore(web): retire old styles.css, prose rules in typography.css

styles.css is now empty (placeholder comment only). Existing screens render
un-styled; sub-projects 2+ will migrate each screen to the new foundation.
All test suites + Playwright e2e still pass.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (entire sub-project)

- [ ] **Final 1: Verify branch state**

```bash
git log --oneline main..HEAD
```

Expected: five commits (one per task) on `design-foundation`.

- [ ] **Final 2: Run every gate once more**

```bash
source .venv/bin/activate
npm run labs:test
npm run api:test
npm --prefix apps/web test
npm --prefix apps/web run build
npm run e2e
```

Expected: labs 20, api 15, web suite passes with all new foundation tests, vite build clean, all 4 e2e flows green.

- [ ] **Final 3: Hand off**

Stop here. Do not open a PR or merge to `main` without the user's explicit instruction. Report the commit list and test results, and ask whether to push, open a PR, or hold.
