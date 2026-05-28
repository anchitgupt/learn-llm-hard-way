import { Route, Routes } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { Dashboard } from "./screens/Dashboard";
import { VizShowcase } from "./screens/VizShowcase";
import { ConceptWorkspace } from "./screens/ConceptWorkspace";
import { ConceptMap } from "./screens/ConceptMap";
import {
  ArtifactsRoute, ChatRoute,
  FailuresRoute, GlossaryRoute, TracksRoute
} from "./screens/RouteWrappers";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="tracks"       element={<TracksRoute />} />
        <Route path="concepts"     element={<ConceptMap />} />
        <Route path="concepts/:id" element={<ConceptWorkspace />} />
        <Route path="chat"         element={<ChatRoute />} />
        <Route path="glossary"     element={<GlossaryRoute />} />
        <Route path="artifacts"    element={<ArtifactsRoute />} />
        <Route path="failures"     element={<FailuresRoute />} />
        <Route path="viz"          element={<VizShowcase />} />
      </Route>
    </Routes>
  );
}
