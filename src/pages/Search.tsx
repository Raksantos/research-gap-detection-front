import { FormEvent, useState } from "react";
import { Box, Button, Heading, Spinner, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ingestionRun } from "@/api/generated";
import type {
  IngestionJob,
  RunIngestionResponse,
  SearchRequest,
  SourcesEnum,
} from "@/api/generated";
import { useSelectedProject } from "@/projects/projectContext";
import {
  INGESTION_JOBS_KEY,
  useIngestionJobs,
} from "@/ingestion/useIngestionJobs";

type SearchForm = Omit<SearchRequest, "project_id" | "persist">;

const initialPayload: SearchForm = {
  query: "",
  sources: ["openalex", "arxiv"],
  limit: 50,
  dedupe: true,
  year_min: 2020,
  year_max: new Date().getFullYear(),
  require_abstract: false,
};

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

export function SearchPage() {
  const queryClient = useQueryClient();
  const { selectedProjectId } = useSelectedProject();
  const [form, setForm] = useState<SearchForm>(initialPayload);
  const [formError, setFormError] = useState<string | null>(null);

  const jobsQuery = useIngestionJobs(selectedProjectId);
  const jobs = jobsQuery.data?.jobs ?? [];

  const mutation = useMutation<RunIngestionResponse, Error, SearchRequest>({
    mutationFn: async (body) => {
      const response = await ingestionRun({ body, throwOnError: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INGESTION_JOBS_KEY] });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedProjectId === null) {
      setFormError("Select a project before running a search.");
      return;
    }
    if (!form.query?.trim()) {
      setFormError("Query is required.");
      return;
    }
    if (!form.sources?.length) {
      setFormError("Select at least one source.");
      return;
    }
    setFormError(null);
    mutation.mutate({ ...form, persist: true, project_id: selectedProjectId });
  }

  function toggleSource(source: SourcesEnum, checked: boolean) {
    setForm((prev) => {
      const current = prev.sources ?? [];
      const nextSources = checked
        ? [...new Set([...current, source])]
        : current.filter((item) => item !== source);
      return { ...prev, sources: nextSources };
    });
  }

  return (
    <Stack gap={6}>
      <Heading size="lg">Search</Heading>
      <Text opacity={0.8}>
        Searches run in the background. You can leave this page — you'll get a
        notification when each one finishes.
      </Text>

      <form onSubmit={handleSubmit}>
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Stack gap={4}>
            <Box>
              <label htmlFor="query">Query</label>
              <input
                id="query"
                name="query"
                value={form.query}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, query: event.target.value }))
                }
                placeholder="E.g. graph neural network drug discovery"
                style={inputStyle}
              />
            </Box>

            <Box>
              <Text mb={2}>Sources</Text>
              <Stack gap={2}>
                <label htmlFor="source-openalex">
                  <input
                    id="source-openalex"
                    type="checkbox"
                    checked={form.sources?.includes("openalex") ?? false}
                    onChange={(event) => toggleSource("openalex", event.target.checked)}
                  />{" "}
                  OpenAlex
                </label>
                <label htmlFor="source-arxiv">
                  <input
                    id="source-arxiv"
                    type="checkbox"
                    checked={form.sources?.includes("arxiv") ?? false}
                    onChange={(event) => toggleSource("arxiv", event.target.checked)}
                  />{" "}
                  arXiv
                </label>
              </Stack>
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(3, minmax(0, 1fr))" gap={3}>
              <Box>
                <label htmlFor="limit">Limit</label>
                <input
                  id="limit"
                  type="number"
                  min={1}
                  max={200}
                  value={form.limit ?? 50}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, limit: Number(event.target.value || "1") }))
                  }
                  style={inputStyle}
                />
              </Box>
              <Box>
                <label htmlFor="year-min">Year min</label>
                <input
                  id="year-min"
                  type="number"
                  value={form.year_min ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, year_min: toNumberOrUndefined(event.target.value) }))
                  }
                  style={inputStyle}
                />
              </Box>
              <Box>
                <label htmlFor="year-max">Year max</label>
                <input
                  id="year-max"
                  type="number"
                  value={form.year_max ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, year_max: toNumberOrUndefined(event.target.value) }))
                  }
                  style={inputStyle}
                />
              </Box>
            </Box>

            <Stack gap={2}>
              <label htmlFor="dedupe">
                <input
                  id="dedupe"
                  type="checkbox"
                  checked={form.dedupe ?? true}
                  onChange={(event) => setForm((prev) => ({ ...prev, dedupe: event.target.checked }))}
                />{" "}
                Dedupe
              </label>
              <label htmlFor="require-abstract">
                <input
                  id="require-abstract"
                  type="checkbox"
                  checked={form.require_abstract ?? false}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, require_abstract: event.target.checked }))
                  }
                />{" "}
                Require abstract
              </label>
            </Stack>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Starting..." : "Run search"}
            </Button>
          </Stack>
        </Box>
      </form>

      {formError ? <Text color="red.300">{formError}</Text> : null}
      {mutation.isError ? (
        <Text color="red.300">Failed to start search: {mutation.error.message}</Text>
      ) : null}
      {mutation.isSuccess ? (
        <Text color="green.300">
          Search #{mutation.data.job_id} started — running. You'll be notified
          when it finishes.
        </Text>
      ) : null}

      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Heading size="sm" mb={3}>
          Searches ({jobsQuery.data?.total ?? 0})
        </Heading>
        {jobsQuery.isLoading ? (
          <Box>
            <Spinner size="sm" /> <Text as="span">Loading searches...</Text>
          </Box>
        ) : null}
        {jobsQuery.isError ? (
          <Text color="red.300">Failed to load searches: {jobsQuery.error.message}</Text>
        ) : null}
        {!jobsQuery.isLoading && jobs.length === 0 ? (
          <Text>No searches yet. Run one above.</Text>
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

function JobCard({ job }: Readonly<{ job: IngestionJob }>) {
  const active = job.status === "pending" || job.status === "running";
  return (
    <Box borderWidth="1px" borderRadius="md" p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Text fontWeight="bold">Search #{job.id}</Text>
        <Box display="flex" alignItems="center" gap={2}>
          {active ? <Spinner size="xs" /> : null}
          <Text color={statusColors[job.status] ?? "gray.400"} fontWeight="bold">
            {job.status}
          </Text>
        </Box>
      </Box>
      <Text fontSize="sm" opacity={0.8}>
        {job.query} · {(job.sources ?? []).join(", ") || "all sources"}
      </Text>
      <Text fontSize="sm" opacity={0.8}>
        Created {formatDate(job.created_at)} · Finished {formatDate(job.finished_at)}
      </Text>
      {job.error ? (
        <Text color="red.300" mt={1} fontSize="sm">
          {job.error}
        </Text>
      ) : null}
      {job.stats && Object.keys(job.stats).length > 0 ? (
        <Box as="pre" mt={2} fontSize="xs" overflowX="auto" borderWidth="1px" borderRadius="md" p={2}>
          {JSON.stringify(job.stats, null, 2)}
        </Box>
      ) : null}
    </Box>
  );
}
