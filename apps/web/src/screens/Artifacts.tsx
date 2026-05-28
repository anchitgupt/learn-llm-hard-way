import { Link } from "react-router-dom";
import { useCourseData } from "../shell/CourseDataProvider";
import { Card, CardContent } from "@/components/ui/card";
import { ArtifactsByLab } from "./artifacts/ArtifactsByLab";

export function Artifacts() {
  const { recentArtifacts } = useCourseData();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">Runs</p>
        <h1 className="text-[28px] leading-[36px] font-semibold">Artifacts from your labs</h1>
        <p className="text-text-muted">Recent lab outputs grouped by experiment.</p>
      </header>
      {recentArtifacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="text-text-muted">No artifacts yet. Run a lab from a concept page to see results here.</p>
            <Link to="/concepts" className="text-accent hover:underline">Open Concept Map →</Link>
          </CardContent>
        </Card>
      ) : (
        <ArtifactsByLab artifacts={recentArtifacts} />
      )}
    </div>
  );
}
