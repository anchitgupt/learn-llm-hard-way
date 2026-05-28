import { Stagger, Reveal } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import type { FailureCase } from "../../types";
import { FailureCard } from "./FailureCard";

function groupAndSort(failures: FailureCase[]) {
  const order: string[] = [];
  const map = new Map<string, FailureCase[]>();
  for (const f of failures) {
    if (!map.has(f.category)) {
      map.set(f.category, []);
      order.push(f.category);
    }
    map.get(f.category)!.push(f);
  }
  return order
    .map((category) => ({ category, items: map.get(category)! }))
    .sort((a, b) => b.items.length - a.items.length || a.category.localeCompare(b.category));
}

interface FailuresByCategoryProps {
  failures: FailureCase[];
}

export function FailuresByCategory({ failures }: FailuresByCategoryProps) {
  const groups = groupAndSort(failures);
  return (
    <div className="space-y-8">
      {groups.map(({ category, items }) => (
        <section key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold capitalize">{category}</h2>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((f) => (
              <Reveal key={f.id}>
                <FailureCard failure={f} />
              </Reveal>
            ))}
          </Stagger>
        </section>
      ))}
    </div>
  );
}
