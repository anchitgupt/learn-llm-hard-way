import { useCourseData } from "../shell/CourseDataProvider";
import { Stagger, Reveal } from "@/lib/motion";
import { TrackCard } from "./tracks/TrackCard";

export function Tracks() {
  const { tracks, progressRecords } = useCourseData();
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">Map of the course</p>
        <h1 className="text-[28px] leading-[36px] font-semibold">Tracks</h1>
        <p className="text-text-muted">Each track is a guided path through related concepts.</p>
      </header>
      <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tracks.map((t) => (
          <Reveal key={t.id}>
            <TrackCard track={t} progress={progressRecords} />
          </Reveal>
        ))}
      </Stagger>
    </div>
  );
}
