import { useEffect, useState } from "react";
import { FailureMuseum } from "../components/FailureMuseum";
import { MigrationBanner } from "../shell/MigrationBanner";
import { fetchChatFailures } from "../api";
import type { FailureCase } from "../types";

export function FailuresRoute() {
  const [cases, setCases] = useState<FailureCase[]>([]);
  useEffect(() => {
    void fetchChatFailures().then(setCases).catch(() => { /* best-effort */ });
  }, []);
  return (
    <>
      <MigrationBanner scheduledIn={7} />
      <FailureMuseum cases={cases} />
    </>
  );
}
