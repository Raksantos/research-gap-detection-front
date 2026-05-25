import { FormEvent, useState } from "react";
import { Box, Button, Heading, Link, Spinner, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { mappingJobsList, mappingRun } from "@/api/generated";
import type { MappingJob, MappingJobList, RunMappingRequest, RunMappingResponse } from "@/api/generated";
import { useSelectedProject } from "@/projects/projectContext";

type RunMappingForm = Omit<RunMappingRequest, "project_id">;

type JobStatus = "pending" | "running" | "success" | "failed";

const statusOptions: Array<JobStatus | ""> = ["", "pending", "running", "success", "failed"];

const statusColors: Record<string, string> = {
  pending: "yellow.300",
  running: "blue.300",
  success: "green.300",
  failed: "red.300",
};

const inputStyle = { width: "100%", padding: "8px", marginTop: "4px" } as const;

function toNumberOrUndefined(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export function JobsPage() {
  const queryClient = useQueryClient();
  const { selectedProjectId } = useSelectedProject();
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [runForm, setRunForm] = useState<RunMappingForm>({});

  const jobsQuery = useQuery<MappingJobList>({
    queryKey: ["mapping", "jobs", selectedProjectId, statusFilter],
    enabled: selectedProjectId !== null,
    queryFn: async () => {
      const response = await mappingJobsList({
        query: {
          project_id: selectedProjectId as number,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        throwOnError: true,
      });
      return response.data;
    },
    refetchInterval: (query) =>
      query.state.data?.jobs.some((job) => job.status === "pending" || job.status === "running")
        ? 2000
        : false,
  });

  const runMutation = useMutation<RunMappingResponse, Error, RunMappingRequest>({
    mutationFn: async (body) => {
      const response = await mappingRun({ body, throwOnError: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mapping", "jobs"] });
    },
  });

  function handleRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedProjectId === null) {
      return;
    }
    runMutation.mutate({ ...runForm, project_id: selectedProjectId });
  }

  const jobs = jobsQuery.data?.jobs ?? [];

  return (
    <Stack gap={6}>
      <Heading size="lg">Jobs</Heading>
      <Text opacity={0.8}>
        Run knowledge-mapping jobs over the selected project's corpus and track their progress.
      </Text>

      {selectedProjectId === null ? (
        <Text color="orange.300">
          Select a project (top-right) to run and list mapping jobs.
        </Text>
      ) : null}

      <form onSubmit={handleRun}>
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Heading size="sm" mb={3}>
            Run mapping
          </Heading>
          <Stack gap={4}>
            <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={3}>
              <Box>
                <label htmlFor="run-source">Source (optional)</label>
                <input
                  id="run-source"
                  value={runForm.source ?? ""}
                  onChange={(event) =>
                    setRunForm((prev) => ({ ...prev, source: event.target.value || undefined }))
                  }
                  placeholder="All persisted documents"
                  style={inputStyle}
                />
              </Box>
              <Box>
                <label htmlFor="run-model">Model (optional)</label>
                <input
                  id="run-model"
                  value={runForm.model ?? ""}
                  onChange={(event) =>
                    setRunForm((prev) => ({ ...prev, model: event.target.value || undefined }))
                  }
                  placeholder="Backend default"
                  style={inputStyle}
                />
              </Box>
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(3, minmax(0, 1fr))" gap={3}>
              <Box>
                <label htmlFor="run-limit">Limit</label>
                <input
                  id="run-limit"
                  type="number"
                  min={1}
                  value={runForm.limit ?? ""}
                  onChange={(event) =>
                    setRunForm((prev) => ({ ...prev, limit: toNumberOrUndefined(event.target.value) }))
                  }
                  style={inputStyle}
                />
              </Box>
              <Box>
                <label htmlFor="run-min-topic-size">Min topic size</label>
                <input
                  id="run-min-topic-size"
                  type="number"
                  min={2}
                  value={runForm.min_topic_size ?? ""}
                  onChange={(event) =>
                    setRunForm((prev) => ({
                      ...prev,
                      min_topic_size: toNumberOrUndefined(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </Box>
              <Box>
                <label htmlFor="run-top-n-words">Top N words</label>
                <input
                  id="run-top-n-words"
                  type="number"
                  min={1}
                  value={runForm.top_n_words ?? ""}
                  onChange={(event) =>
                    setRunForm((prev) => ({
                      ...prev,
                      top_n_words: toNumberOrUndefined(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </Box>
            </Box>

            <Button
              type="submit"
              disabled={runMutation.isPending || selectedProjectId === null}
            >
              {runMutation.isPending ? "Starting..." : "Run mapping job"}
            </Button>
          </Stack>
        </Box>
      </form>

      {runMutation.isError ? (
        <Text color="red.300">Failed to start job: {runMutation.error.message}</Text>
      ) : null}
      {runMutation.isSuccess ? (
        <Text color="green.300">
          Started job #{runMutation.data.job_id} ({runMutation.data.status}).
        </Text>
      ) : null}

      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Heading size="sm">Jobs ({jobsQuery.data?.total ?? 0})</Heading>
          <Box>
            <label htmlFor="status-filter">Status </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as JobStatus | "")}
              style={{ padding: "6px" }}
            >
              {statusOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "All"}
                </option>
              ))}
            </select>
          </Box>
        </Box>

        {jobsQuery.isLoading ? (
          <Box>
            <Spinner size="sm" /> <Text as="span">Loading jobs...</Text>
          </Box>
        ) : null}
        {jobsQuery.isError ? (
          <Text color="red.300">Failed to load jobs: {jobsQuery.error.message}</Text>
        ) : null}

        {selectedProjectId === null ? (
          <Text>No project selected.</Text>
        ) : !jobsQuery.isLoading && jobs.length === 0 ? (
          <Text>No jobs yet. Start one above.</Text>
        ) : (
          <Stack gap={3}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

function JobCard({ job }: Readonly<{ job: MappingJob }>) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Text fontWeight="bold">Job #{job.id}</Text>
        <Text color={statusColors[job.status] ?? "gray.400"} fontWeight="bold">
          {job.status}
        </Text>
      </Box>
      <Text fontSize="sm" opacity={0.8}>
        Created {formatDate(job.created_at)} · Finished {formatDate(job.finished_at)}
      </Text>
      {job.error ? (
        <Text color="red.300" mt={1} fontSize="sm">
          {job.error}
        </Text>
      ) : null}
      {job.stats ? (
        <Box as="pre" mt={2} fontSize="xs" overflowX="auto" borderWidth="1px" borderRadius="md" p={2}>
          {JSON.stringify(job.stats, null, 2)}
        </Box>
      ) : null}
      <Link asChild mt={2} color="blue.300" fontSize="sm">
        <RouterLink to={`/gaps?job_id=${job.id}`}>View summary →</RouterLink>
      </Link>
    </Box>
  );
}
