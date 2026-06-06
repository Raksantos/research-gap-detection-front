import { useEffect, useRef } from "react";
import { useAuth } from "@/auth/authContext";
import { useSelectedProject } from "@/projects/projectContext";
import { toaster } from "@/components/ui/toaster";
import { useIngestionJobs } from "@/ingestion/useIngestionJobs";

const TERMINAL = new Set(["success", "failed"]);
const ACTIVE = new Set(["pending", "running"]);

/**
 * App-level watcher: polls the selected project's ingestion jobs and fires a
 * toast when one finishes — regardless of which page is open. Mounted once in
 * the AppShell. Statuses are tracked per project; switching projects resets the
 * tracker so a stale job never triggers a spurious toast.
 */
export function useIngestionNotifications() {
  const { isAuthenticated } = useAuth();
  const { selectedProjectId } = useSelectedProject();
  const projectId = isAuthenticated ? selectedProjectId : null;
  const { data } = useIngestionJobs(projectId);

  const tracker = useRef<{ projectId: number | null; seen: Map<number, string> }>(
    { projectId: null, seen: new Map() },
  );

  useEffect(() => {
    if (tracker.current.projectId !== projectId) {
      tracker.current = { projectId, seen: new Map() };
    }
    const jobs = data?.jobs;
    if (!jobs) {
      return;
    }
    const seen = tracker.current.seen;
    for (const job of jobs) {
      const prev = seen.get(job.id);
      if (prev && ACTIVE.has(prev) && TERMINAL.has(job.status)) {
        if (job.status === "success") {
          const persisted =
            (job.stats as { persisted?: number } | undefined)?.persisted ??
            job.result_count;
          toaster.create({
            type: "success",
            title: `Search #${job.id} finished`,
            description: `${persisted} document(s) added to the corpus.`,
          });
        } else {
          toaster.create({
            type: "error",
            title: `Search #${job.id} failed`,
            description: job.error || "The ingestion job did not complete.",
          });
        }
      }
      seen.set(job.id, job.status);
    }
  }, [data, projectId]);
}
