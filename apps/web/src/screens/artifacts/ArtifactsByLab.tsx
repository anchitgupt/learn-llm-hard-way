import { Stagger, Reveal } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import type { LabRunArtifact } from "../../types";
import { ArtifactCard } from "./ArtifactCard";

interface ArtifactsByLabProps {
  artifacts: LabRunArtifact[];
}

function groupByLab(artifacts: LabRunArtifact[]): Array<{ labId: string; items: LabRunArtifact[] }> {
  const order: string[] = [];
  const map = new Map<string, LabRunArtifact[]>();
  for (const a of artifacts) {
    if (!map.has(a.labId)) {
      map.set(a.labId, []);
      order.push(a.labId);
    }
    map.get(a.labId)!.push(a);
  }
  return order
    .map((labId) => ({ labId, items: map.get(labId)! }))
    .sort((a, b) => b.items.length - a.items.length);
}

export function ArtifactsByLab({ artifacts }: ArtifactsByLabProps) {
  const groups = groupByLab(artifacts);
  return (
    <div className="space-y-8">
      {groups.map(({ labId, items }) => (
        <section key={labId} className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-[14px] text-accent">{labId}</h2>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((a, i) => (
              <Reveal key={`${a.artifactPath}-${i}`}>
                <ArtifactCard artifact={a} />
              </Reveal>
            ))}
          </Stagger>
        </section>
      ))}
    </div>
  );
}
