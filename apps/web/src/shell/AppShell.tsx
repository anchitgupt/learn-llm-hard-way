import { Outlet } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { CourseDataProvider, useCourseData } from "./CourseDataProvider";
import { TopHeader } from "./TopHeader";
import { SideNav } from "./SideNav";

/**
 * Inline banner shown when CourseDataProvider's initial fetch fails.
 * Without this, a broken API silently produces an empty UI with no
 * feedback or retry affordance.
 */
function CourseDataErrorBanner() {
  const { error, refresh } = useCourseData();
  if (!error) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 px-4 py-3 mx-8 mt-6 border border-danger/40 rounded-md bg-bg-elevated text-text-primary"
    >
      <AlertTriangle aria-hidden className="h-4 w-4 mt-0.5 text-danger shrink-0" />
      <div className="flex-1">
        <p className="text-[14px] leading-[20px]">
          <span className="font-medium">Couldn&apos;t load course data.</span>{" "}
          <span className="text-text-muted">{error}</span>
        </p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => void refresh()}>
        Retry
      </Button>
    </div>
  );
}

export function AppShell() {
  return (
    <CourseDataProvider>
      <div className="min-h-screen flex flex-col bg-bg-base text-text-primary">
        <TopHeader />
        <CourseDataErrorBanner />
        <div className="flex-1 flex min-h-0">
          <SideNav />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-8">
              <Outlet />
            </div>
          </main>
        </div>
        <Toaster richColors closeButton position="bottom-right" />
      </div>
    </CourseDataProvider>
  );
}
