import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Layout-matching skeleton for the Dashboard while CourseData is loading.
 * Mirrors the real Dashboard structure: header + ContinueCard +
 * TrackProgressGrid + (MissedTopicsPanel | RecentArtifactsPanel).
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8" data-testid="dashboard-skeleton">
      <header className="space-y-2">
        <Skeleton data-testid="skeleton" className="h-3 w-16" />
        <Skeleton data-testid="skeleton" className="h-8 w-64" />
        <Skeleton data-testid="skeleton" className="h-4 w-80" />
      </header>

      <Card>
        <CardHeader>
          <Skeleton data-testid="skeleton" className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton data-testid="skeleton" className="h-24 w-full" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} data-testid="skeleton" className="h-24" />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton data-testid="skeleton" className="h-32" />
        <Skeleton data-testid="skeleton" className="h-32" />
      </div>
    </div>
  );
}
