import { BrowserRouter } from "react-router-dom";
import { FoundationShowcase } from "./components/FoundationShowcase";
import { AppRoutes } from "./routes";

export default function App() {
  if (typeof window !== "undefined" && window.location.pathname === "/__foundation") {
    return <FoundationShowcase />;
  }
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
