import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { Heading } from "./headings";

interface ToCProps {
  headings: Heading[];
}

/**
 * Sticky table of contents. Highlights the section currently in view using
 * IntersectionObserver. Hides on small screens via Tailwind responsive
 * classes; the caller decides where to mount.
 */
export function ToC({ headings }: ToCProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(headings[0]?.slug ?? null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const elements = headings
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        // Pick the entry highest on the page among visible ones.
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        if (top.target.id) setActiveSlug(top.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: [0, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className="text-[13px]">
      <p className="text-[11px] uppercase tracking-wide text-text-muted mb-2">On this page</p>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.slug} className={h.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${h.slug}`}
              data-active={h.slug === activeSlug ? "true" : undefined}
              className={cn(
                "block py-0.5 text-text-muted hover:text-text-primary transition-colors",
                h.slug === activeSlug && "text-accent"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
