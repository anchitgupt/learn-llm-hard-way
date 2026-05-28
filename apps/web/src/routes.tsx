import { Route, Routes } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { Dashboard } from "./screens/Dashboard";
import { VizShowcase } from "./screens/VizShowcase";
import { ConceptWorkspace } from "./screens/ConceptWorkspace";
import { ConceptMap } from "./screens/ConceptMap";
import { ChatPlayground } from "./screens/ChatPlayground";
import { Glossary } from "./screens/Glossary";
import { Tracks } from "./screens/Tracks";
import {
  ArtifactsRoute,
  FailuresRoute
} from "./screens/RouteWrappers";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="tracks"       element={<Tracks />} />
        <Route path="concepts"     element={<ConceptMap />} />
        <Route path="concepts/:id" element={<ConceptWorkspace />} />
        <Route path="chat"         element={<ChatPlayground />} />
        <Route path="glossary"     element={<Glossary />} />
        <Route path="artifacts"    element={<ArtifactsRoute />} />
        <Route path="failures"     element={<FailuresRoute />} />
        <Route path="viz"          element={<VizShowcase />} />
      </Route>
    </Routes>
  );
}
