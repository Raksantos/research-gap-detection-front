import { FormEvent, useState } from "react";
import { Badge, Box, Button, Heading, Link, Spinner, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { gapsGapDetail, gapsJobGaps, gapsJobsList, gapsRun, mappingJobsList } from "@/api/generated";
import type {
  GapDetail,
  GapDetectionJob,
  GapDetectionJobList,
  GapEvidence,
  GapListItem,
  GapsResponse,
  MappingJobList,
  RunGapDetectionRequest,
  RunGapDetectionResponse,
} from "@/api/generated";
import { useSelectedProject } from "@/projects/projectContext";

type RunGapForm = Omit<RunGapDetectionRequest, "mapping_job_id"> & {
  mapping_job_id: number | "";
};

type JobStatus = "pending" | "running" | "success" | "failed";

const statusOptions: Array<JobStatus | ""> = ["", "pending", "running", "success", "failed"];

const statusColors: Record<string, string> = {
  pending: "yellow.300",
  running: "blue.300",
  success: "green.300",
  failed: "red.300",
};

type GapType = "future_work" | "limitation" | "rare_combination" | "underexplored_topic";

const gapTypeOptions: Array<GapType | ""> = [
  "",
  "future_work",
  "limitation",
  "rare_combination",
  "underexplored_topic",
];

const gapTypeColors: Record<string, string> = {
  future_work: "purple",
  limitation: "orange",
  rare_combination: "teal",
  underexplored_topic: "blue",
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

function formatType(type: string): string {
  return type.replace(/_/g, " ");
}

export function GapsPage() {
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get("job_id");
  const jobId = jobIdParam ? Number(jobIdParam) : null;
  const hasValidJob = jobId !== null && Number.isFinite(jobId);

  if (hasValidJob) {
    return <JobGapsView jobId={jobId as number} />;
  }

  return <GapDetectionOverview />;
}

function GapDetectionOverview() {
  const queryClient = useQueryClient();
  const { selectedProjectId } = useSelectedProject();
  const [searchParams] = useSearchParams();
  const prefilledMappingJob = toNumberOrUndefined(searchParams.get("mapping_job_id") ?? "");

  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [runForm, setRunForm] = useState<RunGapForm>({
    mapping_job_id: prefilledMappingJob ?? "",
  });

  // Gap detection needs a finished mapping job to run against.
  const mappingJobsQuery = useQuery<MappingJobList>({
    queryKey: ["mapping", "jobs", selectedProjectId, "success"],
    enabled: selectedProjectId !== null,
    queryFn: async () => {
      const response = await mappingJobsList({
        query: { project_id: selectedProjectId as number, status: "success" },
        throwOnError: true,
      });
      return response.data;
    },
  });

  const jobsQuery = useQuery<GapDetectionJobList>({
    queryKey: ["gaps", "jobs", selectedProjectId, statusFilter],
    enabled: selectedProjectId !== null,
    queryFn: async () => {
      const response = await gapsJobsList({
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

  const runMutation = useMutation<RunGapDetectionResponse, Error, RunGapDetectionRequest>({
    mutationFn: async (body) => {
      const response = await gapsRun({ body, throwOnError: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gaps", "jobs"] });
    },
  });

  function handleRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (runForm.mapping_job_id === "") {
      return;
    }
    runMutation.mutate({
      mapping_job_id: runForm.mapping_job_id,
      ...(runForm.llm_model ? { llm_model: runForm.llm_model } : {}),
      ...(runForm.rarity_threshold !== undefined ? { rarity_threshold: runForm.rarity_threshold } : {}),
      ...(runForm.max_gaps !== undefined ? { max_gaps: runForm.max_gaps } : {}),
    });
  }

  const mappingJobs = mappingJobsQuery.data?.jobs ?? [];
  const jobs = jobsQuery.data?.jobs ?? [];

  return (
    <Stack gap={6}>
      <Heading size="lg">Gaps</Heading>
      <Text opacity={0.8}>
        Run gap detection over a finished knowledge map to surface under-explored topics,
        rare combinations and limitations — then drill into the supporting evidence.
      </Text>

      {selectedProjectId === null ? (
        <Text color="orange.300">Select a project (top-right) to run and list gap-detection jobs.</Text>
      ) : null}

      <form onSubmit={handleRun}>
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Heading size="sm" mb={3}>
            Run gap detection
          </Heading>
          <Stack gap={4}>
            <Box>
              <label htmlFor="run-mapping-job">Mapping job</label>
              <select
                id="run-mapping-job"
                value={runForm.mapping_job_id}
                onChange={(event) =>
                  setRunForm((prev) => ({
                    ...prev,
                    mapping_job_id: event.target.value ? Number(event.target.value) : "",
                  }))
                }
                style={inputStyle}
              >
                <option value="">
                  {mappingJobsQuery.isLoading ? "Loading mapping jobs..." : "Select a finished mapping job"}
                </option>
                {mappingJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    Job #{job.id} · finished {formatDate(job.finished_at)}
                  </option>
                ))}
              </select>
              {selectedProjectId !== null && !mappingJobsQuery.isLoading && mappingJobs.length === 0 ? (
                <Text fontSize="sm" mt={1} color="orange.300">
                  No finished mapping jobs yet. Run one from the{" "}
                  <Link asChild color="blue.300">
                    <RouterLink to="/jobs">Jobs page</RouterLink>
                  </Link>{" "}
                  first.
                </Text>
              ) : null}
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(3, minmax(0, 1fr))" gap={3}>
              <Box>
                <label htmlFor="run-llm-model">LLM model (optional)</label>
                <input
                  id="run-llm-model"
                  value={runForm.llm_model ?? ""}
                  onChange={(event) =>
                    setRunForm((prev) => ({ ...prev, llm_model: event.target.value || undefined }))
                  }
                  placeholder="Backend default"
                  style={inputStyle}
                />
              </Box>
              <Box>
                <label htmlFor="run-rarity">Rarity threshold</label>
                <input
                  id="run-rarity"
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  value={runForm.rarity_threshold ?? ""}
                  onChange={(event) =>
                    setRunForm((prev) => ({
                      ...prev,
                      rarity_threshold: toNumberOrUndefined(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </Box>
              <Box>
                <label htmlFor="run-max-gaps">Max gaps</label>
                <input
                  id="run-max-gaps"
                  type="number"
                  min={1}
                  value={runForm.max_gaps ?? ""}
                  onChange={(event) =>
                    setRunForm((prev) => ({ ...prev, max_gaps: toNumberOrUndefined(event.target.value) }))
                  }
                  style={inputStyle}
                />
              </Box>
            </Box>

            <Button type="submit" disabled={runMutation.isPending || runForm.mapping_job_id === ""}>
              {runMutation.isPending ? "Starting..." : "Run gap detection"}
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
          <Heading size="sm">Gap-detection jobs ({jobsQuery.data?.total ?? 0})</Heading>
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
          <Text>No gap-detection jobs yet. Start one above.</Text>
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

function JobCard({ job }: Readonly<{ job: GapDetectionJob }>) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Text fontWeight="bold">Job #{job.id}</Text>
        <Text color={statusColors[job.status] ?? "gray.400"} fontWeight="bold">
          {job.status}
        </Text>
      </Box>
      <Text fontSize="sm" opacity={0.8}>
        Mapping job #{job.mapping_job_id}
        {job.llm_model ? ` · ${job.llm_model}` : ""}
      </Text>
      <Text fontSize="sm" opacity={0.8}>
        Created {formatDate(job.created_at)} · Finished {formatDate(job.finished_at)}
      </Text>
      {job.error ? (
        <Text color="red.300" mt={1} fontSize="sm">
          {job.error}
        </Text>
      ) : null}
      {job.status === "success" ? (
        <Box display="flex" gap={4} mt={2}>
          <Link asChild color="blue.300" fontSize="sm">
            <RouterLink to={`/gaps?job_id=${job.id}`}>View gaps →</RouterLink>
          </Link>
          <Link asChild color="blue.300" fontSize="sm">
            <RouterLink to={`/feasibility?gap_detection_job_id=${job.id}`}>Assess feasibility →</RouterLink>
          </Link>
        </Box>
      ) : null}
    </Box>
  );
}

function JobGapsView({ jobId }: Readonly<{ jobId: number }>) {
  const [typeFilter, setTypeFilter] = useState<GapType | "">("");

  const gapsQuery = useQuery<GapsResponse>({
    queryKey: ["gaps", "job-gaps", jobId, typeFilter],
    queryFn: async () => {
      const response = await gapsJobGaps({
        path: { job_id: jobId },
        query: typeFilter ? { type: typeFilter } : undefined,
        throwOnError: true,
      });
      return response.data;
    },
  });

  const gaps = gapsQuery.data?.gaps ?? [];

  return (
    <Stack gap={6}>
      <Box>
        <Link asChild color="blue.300" fontSize="sm">
          <RouterLink to="/gaps">← All gap-detection jobs</RouterLink>
        </Link>
        <Heading size="lg" mt={1}>
          Gaps · Job #{jobId}
        </Heading>
      </Box>

      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
          <Heading size="sm">Detected gaps ({gapsQuery.data?.total ?? 0})</Heading>
          <Box>
            <label htmlFor="type-filter">Type </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as GapType | "")}
              style={{ padding: "6px" }}
            >
              {gapTypeOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option ? formatType(option) : "All"}
                </option>
              ))}
            </select>
          </Box>
        </Box>

        {gapsQuery.isLoading ? (
          <Box>
            <Spinner size="sm" /> <Text as="span">Loading gaps...</Text>
          </Box>
        ) : null}
        {gapsQuery.isError ? (
          <Text color="red.300">Failed to load gaps: {gapsQuery.error.message}</Text>
        ) : null}

        {!gapsQuery.isLoading && gaps.length === 0 ? (
          <Text>No gaps for this job{typeFilter ? " with this type" : ""}.</Text>
        ) : (
          <Stack gap={3}>
            {gaps.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

function GapCard({ gap }: Readonly<{ gap: GapListItem }>) {
  const [expanded, setExpanded] = useState(false);

  const detailQuery = useQuery<GapDetail>({
    queryKey: ["gaps", "gap", gap.id],
    enabled: expanded,
    queryFn: async () => {
      const response = await gapsGapDetail({ path: { gap_id: gap.id }, throwOnError: true });
      return response.data;
    },
  });

  return (
    <Box borderWidth="1px" borderRadius="md" p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Badge colorPalette={gapTypeColors[gap.type] ?? "gray"} variant="subtle">
          {formatType(gap.type)}
        </Badge>
        <Text fontSize="xs" opacity={0.7}>
          rarity {gap.rarity_score.toFixed(2)} · support {gap.support_count}
        </Text>
      </Box>

      {gap.entity_a || gap.entity_b ? (
        <Text fontSize="sm" mt={2} fontWeight="500">
          {gap.entity_a?.name ?? "?"}
          {gap.entity_b ? ` ↔ ${gap.entity_b.name}` : ""}
        </Text>
      ) : null}

      <Text mt={1}>{gap.summary}</Text>

      <Button mt={2} size="xs" variant="outline" onClick={() => setExpanded((prev) => !prev)}>
        {expanded ? "Hide details" : "Show rationale & evidence"}
      </Button>

      {expanded ? (
        <Box mt={3}>
          {detailQuery.isLoading ? (
            <Box>
              <Spinner size="sm" /> <Text as="span">Loading details...</Text>
            </Box>
          ) : null}
          {detailQuery.isError ? (
            <Text color="red.300">Failed to load details: {detailQuery.error.message}</Text>
          ) : null}
          {detailQuery.data ? <GapDetailView detail={detailQuery.data} /> : null}
        </Box>
      ) : null}
    </Box>
  );
}

function GapDetailView({ detail }: Readonly<{ detail: GapDetail }>) {
  return (
    <Stack gap={3}>
      {detail.rationale ? (
        <Box>
          <Heading size="xs" mb={1}>
            Rationale
          </Heading>
          <Text fontSize="sm" opacity={0.9}>
            {detail.rationale}
          </Text>
        </Box>
      ) : null}

      <Box>
        <Heading size="xs" mb={2}>
          Evidence ({detail.evidence.length})
        </Heading>
        {detail.evidence.length === 0 ? (
          <Text fontSize="sm" opacity={0.7}>
            No evidence recorded.
          </Text>
        ) : (
          <Stack gap={2}>
            {detail.evidence.map((item, index) => (
              <EvidenceRow key={`${item.document_id}-${index}`} evidence={item} />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

function EvidenceRow({ evidence }: Readonly<{ evidence: GapEvidence }>) {
  const href = evidence.url ?? (evidence.doi ? `https://doi.org/${evidence.doi}` : null);
  return (
    <Box borderWidth="1px" borderRadius="md" p={2}>
      <Box display="flex" justifyContent="space-between" gap={2}>
        <Text fontSize="sm" fontWeight="500">
          {href ? (
            <Link href={href} color="blue.300" target="_blank" rel="noreferrer">
              {evidence.title}
            </Link>
          ) : (
            evidence.title
          )}
        </Text>
        <Text fontSize="xs" opacity={0.7} flexShrink={0}>
          {evidence.phrase_type} · conf {evidence.llm_confidence.toFixed(2)}
        </Text>
      </Box>
      {evidence.quote ? (
        <Text fontSize="sm" mt={1} opacity={0.85} fontStyle="italic">
          “{evidence.quote}”
        </Text>
      ) : null}
    </Box>
  );
}
