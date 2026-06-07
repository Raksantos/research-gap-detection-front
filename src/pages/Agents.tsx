import { FormEvent, useState } from "react";
import { Badge, Box, Button, Heading, Link, Spinner, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { agentsRunCreate, agentsRunList, agentsRunResume } from "@/api/generated";
import type {
  AgentRun,
  AgentRunCreate,
  AgentRunCreated,
  AgentRunResume,
  GraphEnum,
} from "@/api/generated";
import { useSelectedProject } from "@/projects/projectContext";

type GraphOption = GraphEnum;

const graphOptions: Array<{ value: GraphOption; label: string }> = [
  { value: "gap_detection", label: "Gap detection" },
  { value: "feasibility", label: "Feasibility" },
  { value: "end_to_end", label: "End to end" },
];

const statusColors: Record<string, string> = {
  pending: "yellow.300",
  running: "blue.300",
  awaiting_human_review: "purple.300",
  success: "green.300",
  failed: "red.300",
};

const inputStyle = { width: "100%", padding: "8px", marginTop: "4px" } as const;

type CreateForm = {
  graph: GraphOption;
  mapping_job_id?: number;
  gap_detection_job_id?: number;
  max_gaps?: number;
  gap_approval: boolean;
};

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

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

/** pending_review is the untyped payload passed to the graph's interrupt(). */
type PendingReview = { node?: string; gaps?: Array<{ id: number; summary?: string; rarity_score?: number }> };

function asPendingReview(value: unknown): PendingReview | null {
  if (value && typeof value === "object") {
    return value as PendingReview;
  }
  return null;
}

export function AgentsPage() {
  const queryClient = useQueryClient();
  const { selectedProjectId } = useSelectedProject();

  const [form, setForm] = useState<CreateForm>({ graph: "gap_detection", gap_approval: true });

  // The list endpoint is owner-scoped: it returns runs across ALL the user's
  // projects (the API exposes no project filter), unlike the other list pages.
  const runsQuery = useQuery<AgentRun[]>({
    queryKey: ["agents", "runs"],
    queryFn: async () => {
      const response = await agentsRunList({ throwOnError: true });
      return response.data;
    },
    refetchInterval: (query) =>
      query.state.data?.some((run) => run.status === "pending" || run.status === "running")
        ? 2000
        : false,
  });

  const createMutation = useMutation<AgentRunCreated, Error, AgentRunCreate>({
    mutationFn: async (body) => {
      const response = await agentsRunCreate({ body, throwOnError: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", "runs"] });
    },
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedProjectId === null) {
      return;
    }
    const config: Record<string, unknown> = { hitl: { gap_approval: form.gap_approval } };
    if (form.mapping_job_id !== undefined) {
      config.mapping_job_id = form.mapping_job_id;
    }
    if (form.gap_detection_job_id !== undefined) {
      config.gap_detection_job_id = form.gap_detection_job_id;
    }
    if (form.max_gaps !== undefined) {
      config.max_gaps = form.max_gaps;
    }
    createMutation.mutate({ graph: form.graph, project_id: selectedProjectId, config });
  }

  const runs = runsQuery.data ?? [];

  return (
    <Stack gap={6}>
      <Heading size="lg">Agents</Heading>
      <Text opacity={0.8}>
        Run the multi-agent orchestration graphs (gap detection, feasibility, end-to-end). Graphs
        can pause for human review — approve or steer them, then resume. This list shows all of your
        agent runs across projects.
      </Text>

      {selectedProjectId === null ? (
        <Text color="orange.300">Select a project (top-right) to start an agent run.</Text>
      ) : null}

      <form onSubmit={handleCreate}>
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Heading size="sm" mb={3}>
            Start a run
          </Heading>
          <Stack gap={4}>
            <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={3}>
              <Box>
                <label htmlFor="run-graph">Graph</label>
                <select
                  id="run-graph"
                  value={form.graph}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, graph: event.target.value as GraphOption }))
                  }
                  style={inputStyle}
                >
                  {graphOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Box>
              <Box>
                <label htmlFor="run-max-gaps">Max gaps (optional)</label>
                <input
                  id="run-max-gaps"
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

            <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={3}>
              <Box>
                <label htmlFor="run-mapping-job">Mapping job id (optional)</label>
                <input
                  id="run-mapping-job"
                  type="number"
                  min={1}
                  value={form.mapping_job_id ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, mapping_job_id: toNumberOrUndefined(event.target.value) }))
                  }
                  style={inputStyle}
                />
              </Box>
              <Box>
                <label htmlFor="run-gap-job">Gap-detection job id (optional)</label>
                <input
                  id="run-gap-job"
                  type="number"
                  min={1}
                  value={form.gap_detection_job_id ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      gap_detection_job_id: toNumberOrUndefined(event.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </Box>
            </Box>

            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={form.gap_approval}
                onChange={(event) => setForm((prev) => ({ ...prev, gap_approval: event.target.checked }))}
              />
              Pause for human gap approval (HITL)
            </label>

            <Button type="submit" disabled={createMutation.isPending || selectedProjectId === null}>
              {createMutation.isPending ? "Starting..." : "Start run"}
            </Button>
          </Stack>
        </Box>
      </form>

      {createMutation.isError ? (
        <Text color="red.300">Failed to start run: {createMutation.error.message}</Text>
      ) : null}
      {createMutation.isSuccess ? (
        <Text color="green.300">
          Started run {createMutation.data.run_id} ({createMutation.data.status}).
        </Text>
      ) : null}

      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Heading size="sm" mb={3}>
          Runs ({runs.length})
        </Heading>

        {runsQuery.isLoading ? (
          <Box>
            <Spinner size="sm" /> <Text as="span">Loading runs...</Text>
          </Box>
        ) : null}
        {runsQuery.isError ? (
          <Text color="red.300">Failed to load runs: {runsQuery.error.message}</Text>
        ) : null}

        {!runsQuery.isLoading && runs.length === 0 ? (
          <Text>No agent runs yet. Start one above.</Text>
        ) : (
          <Stack gap={3}>
            {runs.map((run) => (
              <RunCard key={run.id} run={run} />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

function RunCard({ run }: Readonly<{ run: AgentRun }>) {
  const showGapLinks = run.related_job_id != null && (run.graph === "gap_detection" || run.graph === "end_to_end");
  return (
    <Box borderWidth="1px" borderRadius="md" p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={2}>
          <Badge colorPalette="gray" variant="subtle">
            {run.graph}
          </Badge>
          <Text fontSize="xs" opacity={0.6}>
            {run.id}
          </Text>
        </Box>
        <Text color={statusColors[run.status] ?? "gray.400"} fontWeight="bold">
          {formatStatus(run.status)}
        </Text>
      </Box>

      <Text fontSize="sm" opacity={0.8} mt={1}>
        {run.current_node ? `Node: ${run.current_node} · ` : ""}Updated {formatDate(run.updated_at)}
        {run.finished_at ? ` · Finished ${formatDate(run.finished_at)}` : ""}
      </Text>

      {run.error ? (
        <Text color="red.300" mt={1} fontSize="sm">
          {run.error}
        </Text>
      ) : null}

      {showGapLinks ? (
        <Box display="flex" gap={4} mt={2}>
          <Link asChild color="blue.300" fontSize="sm">
            <RouterLink to={`/gaps?job_id=${run.related_job_id}`}>View gaps →</RouterLink>
          </Link>
          <Link asChild color="blue.300" fontSize="sm">
            <RouterLink to={`/report?job_id=${run.related_job_id}`}>View report →</RouterLink>
          </Link>
        </Box>
      ) : null}

      {run.status === "awaiting_human_review" ? <ResumeForm run={run} /> : null}
    </Box>
  );
}

function ResumeForm({ run }: Readonly<{ run: AgentRun }>) {
  const queryClient = useQueryClient();
  const review = asPendingReview(run.pending_review);
  const gapApprovalGaps =
    review?.node === "gap_approval" && Array.isArray(review.gaps) ? review.gaps : null;

  const [node, setNode] = useState<string>(review?.node ?? run.current_node ?? "");
  const [decisionText, setDecisionText] = useState<string>("{}");
  const [parseError, setParseError] = useState<string | null>(null);

  const resumeMutation = useMutation<AgentRunCreated, Error, AgentRunResume>({
    mutationFn: async (body) => {
      const response = await agentsRunResume({ path: { run_id: run.id }, body, throwOnError: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", "runs"] });
    },
  });

  function approveAll() {
    const ids = (gapApprovalGaps ?? []).map((gap) => gap.id);
    setDecisionText(JSON.stringify({ approved_gap_ids: ids }, null, 2));
    setParseError(null);
  }

  function handleResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let decision: Record<string, unknown>;
    try {
      decision = JSON.parse(decisionText);
    } catch {
      setParseError("Decision must be valid JSON.");
      return;
    }
    if (typeof decision !== "object" || decision === null || Array.isArray(decision)) {
      setParseError("Decision must be a JSON object.");
      return;
    }
    setParseError(null);
    resumeMutation.mutate({ node, decision });
  }

  return (
    <Box mt={3} borderTopWidth="1px" pt={3}>
      <Heading size="xs" mb={2}>
        Human review required
      </Heading>

      {review ? (
        <Box as="pre" fontSize="xs" overflowX="auto" borderWidth="1px" borderRadius="md" p={2} mb={3}>
          {JSON.stringify(review, null, 2)}
        </Box>
      ) : (
        <Text fontSize="sm" opacity={0.7} mb={3}>
          No review payload attached.
        </Text>
      )}

      {gapApprovalGaps ? (
        <Box mb={3}>
          <Text fontSize="sm" mb={1}>
            {gapApprovalGaps.length} gap(s) awaiting approval.
          </Text>
          <Button size="xs" variant="outline" onClick={approveAll}>
            Approve all → fill decision
          </Button>
        </Box>
      ) : null}

      <form onSubmit={handleResume}>
        <Stack gap={3}>
          <Box>
            <label htmlFor={`resume-node-${run.id}`}>Node</label>
            <input
              id={`resume-node-${run.id}`}
              value={node}
              onChange={(event) => setNode(event.target.value)}
              style={inputStyle}
            />
          </Box>
          <Box>
            <label htmlFor={`resume-decision-${run.id}`}>Decision (JSON)</label>
            <textarea
              id={`resume-decision-${run.id}`}
              value={decisionText}
              onChange={(event) => setDecisionText(event.target.value)}
              rows={5}
              style={{ ...inputStyle, fontFamily: "monospace" }}
            />
          </Box>
          {parseError ? <Text color="red.300" fontSize="sm">{parseError}</Text> : null}
          {resumeMutation.isError ? (
            <Text color="red.300" fontSize="sm">
              Failed to resume: {resumeMutation.error.message}
            </Text>
          ) : null}
          <Button type="submit" size="sm" disabled={resumeMutation.isPending || !node.trim()}>
            {resumeMutation.isPending ? "Resuming..." : "Resume run"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
