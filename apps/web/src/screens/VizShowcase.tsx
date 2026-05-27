import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal, Stagger } from "@/lib/motion";
import {
  AttentionMap,
  EmbeddingSpace,
  LossCurve,
  SamplingPlot,
  TokenFlow
} from "@/viz";
import { demoEmbeddings } from "@/viz/data/demoEmbeddings";
import type { AttentionMatrix, TokenItem } from "@/viz/data/types";

const demoTokens: TokenItem[] = [
  { id: 5, text: "The" },
  { id: 421, text: "tiny" },
  { id: 82, text: "model" },
  { id: 17, text: "reads" },
  { id: 901, text: "text" },
  { id: 4, text: "as" },
  { id: 230, text: "tokens" },
  { id: 12, text: "and" }
];

const demoAttention: AttentionMatrix = {
  tokens: ["the", "tiny", "model"],
  scores: [
    [1.0, -Infinity, -Infinity],
    [0.5, 0.5, -Infinity],
    [0.34, 0.33, 0.33]
  ]
};

const demoLoss = [
  {
    label: "train",
    values: Array.from({ length: 100 }, (_, i) =>
      2.5 * Math.exp(-i / 30) + 0.4 + Math.sin(i / 5) * 0.05
    )
  },
  {
    label: "val",
    values: Array.from({ length: 100 }, (_, i) =>
      2.7 * Math.exp(-i / 32) + 0.5 + Math.cos(i / 7) * 0.05
    )
  }
];

const demoSamples = [
  { token: "the", probability: 0.51 },
  { token: "a", probability: 0.3 },
  { token: "an", probability: 0.19 }
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="bg-bg-surface border-border-subtle">
      <CardHeader>
        <CardTitle>
          <h2 className="text-[17px] leading-[24px]">{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function VizShowcase() {
  return (
    <Stagger className="space-y-8">
      <Reveal>
        <header>
          <p className="text-[12px] uppercase tracking-wide text-text-muted">Library</p>
          <h1 className="text-[28px] leading-[36px] font-semibold">Educational visualizations</h1>
          <p className="text-text-muted">
            Five reusable viz with sample data. Each is a pure component fed by typed props.
          </p>
        </header>
      </Reveal>

      <Reveal>
        <Section title="TokenFlow">
          <TokenFlow tokens={demoTokens} />
        </Section>
      </Reveal>

      <Reveal>
        <Section title="AttentionMap">
          <AttentionMap data={demoAttention} showRowSums />
        </Section>
      </Reveal>

      <Reveal>
        <Section title="LossCurve">
          <LossCurve series={demoLoss} showRollingMean />
        </Section>
      </Reveal>

      <Reveal>
        <Section title="SamplingPlot">
          <SamplingPlot candidates={demoSamples} selectedToken="the" temperature={1.0} />
        </Section>
      </Reveal>

      <Reveal>
        <Section title="EmbeddingSpace">
          <EmbeddingSpace points={demoEmbeddings} selectedId="cat" />
        </Section>
      </Reveal>
    </Stagger>
  );
}
