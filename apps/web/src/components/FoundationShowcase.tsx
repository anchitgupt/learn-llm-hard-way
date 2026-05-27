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
