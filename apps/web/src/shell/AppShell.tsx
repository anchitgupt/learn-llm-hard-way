import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { CourseDataProvider } from "./CourseDataProvider";
import { TopHeader } from "./TopHeader";
import { SideNav } from "./SideNav";

export function AppShell() {
  return (
    <CourseDataProvider>
      <div className="min-h-screen flex flex-col bg-bg-base text-text-primary">
        <TopHeader />
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
