import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PreferenceSimulation } from "../../types";

interface PreferenceSectionProps {
  simulation: PreferenceSimulation | null;
}

export function PreferenceSection({ simulation }: PreferenceSectionProps) {
  if (!simulation) return null;
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-[16px] font-semibold">Preference simulation</h2>
        <p className="text-[13px] text-text-muted">Which response wins when ranked by a reward model?</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">"{simulation.prompt}"</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {simulation.candidates.map((c) => {
              const isWinner = c.id === simulation.winner.id;
              const score = simulation.rewardScores[c.id];
              return (
                <Card
                  key={c.id}
                  data-candidate={c.id}
                  data-winner={isWinner ? "true" : "false"}
                  className={isWinner ? "border-accent" : ""}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
                    <span className="font-mono text-[12px] text-text-muted">{c.id}</span>
                    {isWinner ? <Badge>Winner</Badge> : null}
                  </CardHeader>
                  <CardContent className="space-y-2 text-[13px]">
                    <p>{c.response}</p>
                    <div className="flex flex-wrap gap-1">
                      {c.traits.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                    </div>
                    <p className="text-[12px] text-text-muted">
                      reward: {typeof score === "number" ? score.toFixed(2) : score}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-[13px] text-text-muted">{simulation.explanation}</p>
        </CardContent>
      </Card>
    </section>
  );
}
