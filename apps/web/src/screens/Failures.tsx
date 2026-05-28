import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FailuresByCategory } from "./failures/FailuresByCategory";
import { PreferenceSection } from "./failures/PreferenceSection";
import { useFailuresData } from "./failures/useFailuresData";

export function Failures() {
  const { failures, preference, loading, error, refresh } = useFailuresData();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">What goes wrong</p>
        <h1 className="text-[28px] leading-[36px] font-semibold">Failure museum</h1>
        <p className="text-text-muted">Categories of failure modes — and the strategies that fix them.</p>
      </header>
      {error ? (
        <Card>
          <CardContent className="py-6 space-y-2">
            <p className="text-red-400">{error}</p>
            <Button onClick={() => void refresh()} size="sm">Retry</Button>
          </CardContent>
        </Card>
      ) : null}
      {loading && failures.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <>
          <FailuresByCategory failures={failures} />
          <PreferenceSection simulation={preference} />
        </>
      )}
    </div>
  );
}
