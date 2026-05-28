export interface Heading {
  level: 2 | 3;
  text: string;
  slug: string;
}

/**
 * Pulls `##` and `###` lines out of the lesson markdown. The slug matches
 * GitHub-style anchor generation so the in-doc link works once we render
 * a heading with the same `id` attribute.
 */
export function extractHeadings(md: string): Heading[] {
  const headings: Heading[] = [];
  const lines = md.split("\n");
  let inFence = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!match) continue;
    const level = (match[1].length === 2 ? 2 : 3) as 2 | 3;
    const text = match[2].trim();
    headings.push({ level, text, slug: slugify(text) });
  }
  return headings;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
