import { Route, Routes } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { Dashboard } from "./screens/Dashboard";
import {
  ArtifactsRoute, ChatRoute, ConceptMapRoute, ConceptRoute,
  FailuresRoute, GlossaryRoute, TracksRoute
} from "./screens/RouteWrappers";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="tracks"       element={<TracksRoute />} />
        <Route path="concepts"     element={<ConceptMapRoute />} />
        <Route path="concepts/:id" element={<ConceptRoute />} />
        <Route path="chat"         element={<ChatRoute />} />
        <Route path="glossary"     element={<GlossaryRoute />} />
        <Route path="artifacts"    element={<ArtifactsRoute />} />
        <Route path="failures"     element={<FailuresRoute />} />
      </Route>
    </Routes>
  );
}
