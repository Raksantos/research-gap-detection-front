import { useQuery } from "@tanstack/react-query";
import { ingestionJobsList } from "@/api/generated";
import type { IngestionJobList } from "@/api/generated";

export type IngestionStatus = "pending" | "running" | "success" | "failed";

export const INGESTION_JOBS_KEY = "ingestionJobs" as const;

/**
 * Shared list of a project's ingestion jobs. Polls every 2s while any job is
 * still pending/running, then stops. Both the Search page and the global
 * notification watcher read this single cache entry, so polling happens once.
 */
export function useIngestionJobs(
  projectId: number | null,
  statusFilter?: IngestionStatus | "",
) {
  return useQuery<IngestionJobList>({
    queryKey: [INGESTION_JOBS_KEY, projectId, statusFilter ?? ""],
    enabled: projectId !== null,
    queryFn: async () => {
      const response = await ingestionJobsList({
        query: {
          project_id: projectId as number,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        throwOnError: true,
      });
      return response.data;
    },
    refetchInterval: (query) =>
      query.state.data?.jobs.some(
        (job) => job.status === "pending" || job.status === "running",
      )
        ? 2000
        : false,
  });
}
