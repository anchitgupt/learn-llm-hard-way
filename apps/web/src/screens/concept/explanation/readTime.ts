/**
 * Strip markdown syntax to a rough word count so the read-time estimate
 * doesn't double-count fence delimiters or list markers.
 */
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")     // fenced code
    .replace(/`[^`]*`/g, " ")            // inline code
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1") // links → label
    .replace(/[#>*_~`-]/g, " ");
}

export function wordCount(md: string): number {
  const text = stripMarkdown(md).trim();
  if (text.length === 0) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function readMinutes(md: string, wordsPerMinute = 200): number {
  const words = wordCount(md);
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / wordsPerMinute));
}
