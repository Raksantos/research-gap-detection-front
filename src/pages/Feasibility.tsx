import { FormEvent, useState } from "react";
import { Badge, Box, Button, Heading, Link, Spinner, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { feasibilityAssess, feasibilityList, gapsJobsList } from "@/api/generated";
import type {
  FeasibilityAssessRequest,
  FeasibilityAssessResponse,
  FeasibilityAssessment,
  GapDetectionJobList,
} from "@/api/generated";
import { useSelectedProject } from "@/projects/projectContext";

type AssessForm = {
  max_gaps?: number;
  force_refresh: boolean;
  llm_model?: string;
};

const inputStyle = { width: "100%", padding: "8px", marginTop: "4px" } as const;

function toNumberOrUndefined(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatScore(value: number): string {
  return value.toFixed(2);
}

function scoreColor(value: number): string {
  if (value >= 0.66) {
    return "green";
  }
  if (value >= 0.33) {
    return "yellow";
  }
  return "red";
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

/** matched_* fields are free-form JSON; coerce to a list of display labels. */
function summarizeMatched(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    if (typeof item === "string") {
      return item;
    }
    if (item && typeof item === "object" && "name" in item) {
      return String((item as { name: unknown }).name);
    }
    return JSON.stringify(item);
  });
}

export function FeasibilityPage() {
  const queryClient = useQueryClient();
  const { selectedProjectId } = useSelectedProject();
  const [searchParams] = useSearchParams();
  const prefilledJob = toNumberOrUndefined(searchParams.get("gap_detection_job_id") ?? "");

  const [jobId, setJobId] = useState<number | "">(prefilledJob ?? "");
  const [form, setForm] = useState<AssessForm>({ force_refresh: false });

  // Feasibility runs over a finished gap-detection job (project-scoped selector).
  const jobsQuery = useQuery<GapDetectionJobList>({
    queryKey: ["gaps", "jobs", selectedProjectId, "success"],
    enabled: selectedProjectId !== null,
    queryFn: async () => {
      const response = await gapsJobsList({
        query: { project_id: selectedProjectId as number, status: "success" },
        throwOnError: true,
      });
      return response.data;
    },
  });

  // List is owner-scoped on the backend; filter by job to stay coherent with the project.
  const assessmentsQuery = useQuery<FeasibilityAssessment[]>({
    queryKey: ["feasibility", "list", jobId],
    enabled: jobId !== "",
    queryFn: async () => {
      const response = await feasibilityList({
        query: { gap_detection_job_id: jobId as number },
        throwOnError: true,
      });
      return response.data;
    },
  });

  const assessMutation = useMutation<FeasibilityAssessResponse, Error, FeasibilityAssessRequest>({
    mutationFn: async (body) => {
      const response = await feasibilityAssess({ body, throwOnError: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feasibility", "list"] });
    },
  });

  function handleAssess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (jobId === "") {
      return;
    }
    assessMutation.mutate({
      gap_detection_job_id: jobId,
      force_refresh: form.force_refresh,
      ...(form.max_gaps !== undefined ? { max_gaps: form.max_gaps } : {}),
      ...(form.llm_model ? { llm_model: form.llm_model } : {}),
    });
  }

  const jobs = jobsQuery.data?.jobs ?? [];
  const assessments = assessmentsQuery.data ?? [];

  return (
    <Stack gap={6}>
      <Heading size="lg">Feasibility</Heading>
      <Text opacity={0.8}>
        Score the detected gaps of a finished gap-detection job by how tractable they are —
        available datasets, benchmarks and frameworks, weighed against cost and complexity.
      </Text>

      {selectedProjectId === null ? (
        <Text color="orange.300">Select a project (top-right) to assess gap-detection jobs.</Text>
      ) : null}

      <form onSubmit={handleAssess}>
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Heading size="sm" mb={3}>
            Assess feasibility
          </Heading>
          <Stack gap={4}>
            <Box>
              <label htmlFor="assess-job">Gap-detection job</label>
              <select
                id="assess-job"
                value={jobId}
                onChange={(event) => setJobId(event.target.value ? Number(event.target.value) : "")}
                style={inputStyle}
              >
                <option value="">
                  {jobsQuery.isLoading ? "Loading gap-detection jobs..." : "Select a finished gap-detection job"}
                </option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    Job #{job.id} · mapping #{job.mapping_job_id}
                  </option>
                ))}
              </select>
              {selectedProjectId !== null && !jobsQuery.isLoading && jobs.length === 0 ? (
                <Text fontSize="sm" mt={1} color="orange.300">
                  No finished gap-detection jobs yet. Run one from the{" "}
                  <Link asChild color="blue.300">
                    <RouterLink to="/gaps">Gaps page</RouterLink>
                  </Link>{" "}
                  first.
                </Text>
              ) : null}
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={3}>
              <Box>
                <label htmlFor="assess-llm-model">LLM model (optional)</label>
                <input
                  id="assess-llm-model"
                  value={form.llm_model ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, llm_model: event.target.value || undefined }))
                  }
                  placeholder="Backend default"
                  style={inputStyle}
                />
              </Box>
              <Box>
                <label htmlFor="assess-max-gaps">Max gaps</label>
                <input
                  id="assess-max-gaps"
                  type="number"
                  min={1}
                  value={form.max_gaps ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, max_gaps: toNumberOrUndefined(event.target.value) }))
                  }
                  style={inputStyle}
                />
              </Box>
            </Box>

            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={form.force_refresh}
                onChange={(event) => setForm((prev) => ({ ...prev, force_refresh: event.target.checked }))}
              />
              Force refresh (re-assess gaps that already have a score)
            </label>

            <Button type="submit" disabled={assessMutation.isPending || jobId === ""}>
              {assessMutation.isPending ? "Assessing..." : "Assess feasibility"}
            </Button>
            {assessMutation.isPending ? (
              <Text fontSize="sm" opacity={0.7}>
                This runs synchronously and may take a while for many gaps.
              </Text>
            ) : null}
          </Stack>
        </Box>
      </form>

      {assessMutation.isError ? (
        <Text color="red.300">Failed to assess: {assessMutation.error.message}</Text>
      ) : null}
      {assessMutation.isSuccess ? (
        <Text color="green.300">Assessed {assessMutation.data.assessed_count} gap(s).</Text>
      ) : null}

      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Heading size="sm" mb={3}>
          Assessments{jobId !== "" ? ` · Job #${jobId}` : ""} ({assessments.length})
        </Heading>

        {jobId === "" ? (
          <Text>Pick a gap-detection job above to see its feasibility assessments.</Text>
        ) : assessmentsQuery.isLoading ? (
          <Box>
            <Spinner size="sm" /> <Text as="span">Loading assessments...</Text>
          </Box>
        ) : assessmentsQuery.isError ? (
          <Text color="red.300">Failed to load assessments: {assessmentsQuery.error.message}</Text>
        ) : assessments.length === 0 ? (
          <Text>No assessments yet for this job. Run an assessment above.</Text>
        ) : (
          <Stack gap={3}>
            {assessments.map((assessment) => (
              <AssessmentCard key={assessment.gap_id} assessment={assessment} />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

function ScoreCell({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <Box>
      <Text fontSize="xs" opacity={0.7}>
        {label}
      </Text>
      <Text fontWeight="600" color={`${scoreColor(value)}.300`}>
        {formatScore(value)}
      </Text>
    </Box>
  );
}

function MatchedList({ title, value }: Readonly<{ title: string; value: unknown }>) {
  const items = summarizeMatched(value);
  if (items.length === 0) {
    return null;
  }
  return (
    <Box>
      <Text fontSize="xs" opacity={0.7}>
        {title} ({items.length})
      </Text>
      <Text fontSize="sm">{items.join(", ")}</Text>
    </Box>
  );
}

function AssessmentCard({ assessment }: Readonly<{ assessment: FeasibilityAssessment }>) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Text fontWeight="bold">Gap #{assessment.gap_id}</Text>
        <Box display="flex" alignItems="center" gap={2}>
          <Badge colorPalette={scoreColor(assessment.overall_score)} variant="solid">
            overall {formatScore(assessment.overall_score)}
          </Badge>
          {assessment.cost_tier ? (
            <Badge colorPalette="gray" variant="subtle">
              cost: {assessment.cost_tier}
            </Badge>
          ) : null}
          {assessment.complexity_tier ? (
            <Badge colorPalette="gray" variant="subtle">
              complexity: {assessment.complexity_tier}
            </Badge>
          ) : null}
        </Box>
      </Box>

      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(90px, 1fr))"
        gap={3}
        mt={3}
      >
        <ScoreCell label="Dataset" value={assessment.dataset_score} />
        <ScoreCell label="Benchmark" value={assessment.benchmark_score} />
        <ScoreCell label="Framework" value={assessment.framework_score} />
        <ScoreCell label="Cost" value={assessment.cost_score} />
        <ScoreCell label="Complexity" value={assessment.complexity_score} />
      </Box>

      <Stack gap={1} mt={3}>
        <MatchedList title="Matched datasets" value={assessment.matched_datasets} />
        <MatchedList title="Matched benchmarks" value={assessment.matched_benchmarks} />
        <MatchedList title="Matched frameworks" value={assessment.matched_frameworks} />
      </Stack>

      {assessment.justification ? (
        <Text fontSize="sm" mt={3} opacity={0.9}>
          {assessment.justification}
        </Text>
      ) : null}

      <Text fontSize="xs" mt={2} opacity={0.6}>
        {assessment.llm_model ? `${assessment.llm_model} · ` : ""}updated {formatDate(assessment.updated_at)}
      </Text>
    </Box>
  );
}
