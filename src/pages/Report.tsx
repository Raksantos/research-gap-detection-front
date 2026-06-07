import { useState } from "react";
import { Badge, Box, Heading, Link, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { gapsJobReport } from "@/api/generated";
import type {
  Confidence,
  FeasibilityReport,
  GapEvidence,
  GapReport,
  Opportunity,
} from "@/api/generated";

const confidenceColors: Record<string, string> = {
  high: "green",
  medium: "yellow",
  low: "red",
};

function scoreColor(value: number): string {
  if (value >= 0.66) {
    return "green";
  }
  if (value >= 0.33) {
    return "yellow";
  }
  return "red";
}

function formatType(type: string): string {
  return type.replace(/_/g, " ");
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function hasContent(value: unknown): boolean {
  if (value == null) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "object") {
    return Object.keys(value as object).length > 0;
  }
  return true;
}

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

export function ReportPage() {
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get("job_id");
  const jobId = jobIdParam ? Number(jobIdParam) : null;
  const hasValidJob = jobId !== null && Number.isFinite(jobId);

  const [topN, setTopN] = useState<number>(10);

  const reportQuery = useQuery<GapReport>({
    queryKey: ["gaps", "report", jobId, topN],
    enabled: hasValidJob,
    queryFn: async () => {
      const response = await gapsJobReport({
        path: { job_id: jobId as number },
        query: { top_n: topN },
        throwOnError: true,
      });
      return response.data;
    },
  });

  if (!hasValidJob) {
    return (
      <Stack gap={3}>
        <Heading size="lg">Report</Heading>
        <Text>
          Pick a gap-detection job from the{" "}
          <Link asChild color="blue.300">
            <RouterLink to="/gaps">Gaps page</RouterLink>
          </Link>{" "}
          to generate its auditable, evidence-grounded report.
        </Text>
      </Stack>
    );
  }

  const report = reportQuery.data;

  return (
    <Stack gap={6}>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box>
          <Link asChild color="blue.300" fontSize="sm">
            <RouterLink to={`/gaps?job_id=${jobId}`}>← Back to gaps</RouterLink>
          </Link>
          <Heading size="lg" mt={1}>
            Report · Job #{jobId}
          </Heading>
        </Box>
        <Box>
          <label htmlFor="top-n">Top N </label>
          <select
            id="top-n"
            value={topN}
            onChange={(event) => setTopN(Number(event.target.value))}
            style={{ padding: "6px" }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Box>
      </Box>

      {reportQuery.isLoading ? (
        <Box>
          <Spinner size="sm" /> <Text as="span">Generating report...</Text>
        </Box>
      ) : null}
      {reportQuery.isError ? (
        <Text color="red.300">Failed to load report: {reportQuery.error.message}</Text>
      ) : null}

      {report ? (
        <Stack gap={6}>
          <Text opacity={0.7} fontSize="sm">
            Generated {formatDate(report.generated_at)}
          </Text>

          {hasContent(report.confidence_summary) ? (
            <JsonSection title="Confidence summary" value={report.confidence_summary} />
          ) : null}
          {hasContent(report.metrics) ? <JsonSection title="Metrics" value={report.metrics} /> : null}

          <Box>
            <Heading size="sm" mb={3}>
              Opportunities ({report.opportunities.length})
            </Heading>
            {report.opportunities.length === 0 ? (
              <Text>No opportunities in this report.</Text>
            ) : (
              <Stack gap={3}>
                {report.opportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity.gap_id} opportunity={opportunity} />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      ) : null}
    </Stack>
  );
}

function JsonSection({ title, value }: Readonly<{ title: string; value: unknown }>) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={4}>
      <Heading size="sm" mb={2}>
        {title}
      </Heading>
      <Box as="pre" fontSize="xs" overflowX="auto" borderWidth="1px" borderRadius="md" p={2}>
        {JSON.stringify(value, null, 2)}
      </Box>
    </Box>
  );
}

function ConfidenceBadge({ confidence }: Readonly<{ confidence: Confidence }>) {
  return (
    <Badge colorPalette={confidenceColors[confidence.level?.toLowerCase()] ?? "gray"} variant="subtle">
      {confidence.level} confidence
    </Badge>
  );
}

function OpportunityCard({ opportunity }: Readonly<{ opportunity: Opportunity }>) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={2}>
          {opportunity.rank != null ? <Text fontWeight="bold">#{opportunity.rank}</Text> : null}
          <Badge colorPalette="blue" variant="subtle">
            {formatType(opportunity.type)}
          </Badge>
          <Text fontSize="sm" opacity={0.7}>
            Gap #{opportunity.gap_id}
          </Text>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <ConfidenceBadge confidence={opportunity.confidence} />
          <Text fontSize="xs" opacity={0.7}>
            rarity {opportunity.rarity_score.toFixed(2)} · support {opportunity.support_count}
          </Text>
        </Box>
      </Box>

      {opportunity.entity_a || opportunity.entity_b ? (
        <Text fontSize="sm" mt={2} fontWeight="500">
          {opportunity.entity_a?.name ?? "?"}
          {opportunity.entity_b ? ` ↔ ${opportunity.entity_b.name}` : ""}
        </Text>
      ) : null}

      {opportunity.inferred?.summary ? <Text mt={2}>{opportunity.inferred.summary}</Text> : null}
      {opportunity.inferred?.rationale ? (
        <Text fontSize="sm" mt={1} opacity={0.85}>
          {opportunity.inferred.rationale}
        </Text>
      ) : null}

      {opportunity.confidence?.reason ? (
        <Text fontSize="xs" mt={2} opacity={0.7}>
          Confidence: {opportunity.confidence.reason}
        </Text>
      ) : null}

      {opportunity.feasibility ? <FeasibilityBlock feasibility={opportunity.feasibility} /> : null}

      {opportunity.extracted_facts.length > 0 ? (
        <Box mt={3}>
          <Heading size="xs" mb={2}>
            Evidence ({opportunity.extracted_facts.length})
          </Heading>
          <Stack gap={2}>
            {opportunity.extracted_facts.map((fact, index) => (
              <EvidenceRow key={`${fact.document_id}-${index}`} evidence={fact} />
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}

function ScoreCell({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <Box>
      <Text fontSize="xs" opacity={0.7}>
        {label}
      </Text>
      <Text fontWeight="600" color={`${scoreColor(value)}.300`}>
        {value.toFixed(2)}
      </Text>
    </Box>
  );
}

function FeasibilityBlock({ feasibility }: Readonly<{ feasibility: FeasibilityReport }>) {
  const datasets = summarizeMatched(feasibility.matched_datasets);
  const benchmarks = summarizeMatched(feasibility.matched_benchmarks);
  const frameworks = summarizeMatched(feasibility.matched_frameworks);
  return (
    <Box mt={3} borderTopWidth="1px" pt={3}>
      <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
        <Heading size="xs">Feasibility</Heading>
        <Badge colorPalette={scoreColor(feasibility.overall_score)} variant="solid">
          overall {feasibility.overall_score.toFixed(2)}
        </Badge>
        {feasibility.cost_tier ? (
          <Badge colorPalette="gray" variant="subtle">
            cost: {feasibility.cost_tier}
          </Badge>
        ) : null}
        {feasibility.complexity_tier ? (
          <Badge colorPalette="gray" variant="subtle">
            complexity: {feasibility.complexity_tier}
          </Badge>
        ) : null}
        {feasibility.maturity_tier ? (
          <Badge colorPalette="gray" variant="subtle">
            maturity: {feasibility.maturity_tier}
          </Badge>
        ) : null}
      </Box>
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(90px, 1fr))" gap={3}>
        <ScoreCell label="Dataset" value={feasibility.dataset_score} />
        <ScoreCell label="Benchmark" value={feasibility.benchmark_score} />
        <ScoreCell label="Framework" value={feasibility.framework_score} />
        <ScoreCell label="Cost" value={feasibility.cost_score} />
        <ScoreCell label="Complexity" value={feasibility.complexity_score} />
        <ScoreCell label="Maturity" value={feasibility.maturity_score} />
      </Box>
      {datasets.length > 0 ? (
        <Text fontSize="sm" mt={2}>
          <Text as="span" opacity={0.7}>
            Datasets:{" "}
          </Text>
          {datasets.join(", ")}
        </Text>
      ) : null}
      {benchmarks.length > 0 ? (
        <Text fontSize="sm">
          <Text as="span" opacity={0.7}>
            Benchmarks:{" "}
          </Text>
          {benchmarks.join(", ")}
        </Text>
      ) : null}
      {frameworks.length > 0 ? (
        <Text fontSize="sm">
          <Text as="span" opacity={0.7}>
            Frameworks:{" "}
          </Text>
          {frameworks.join(", ")}
        </Text>
      ) : null}
      {feasibility.justification ? (
        <Text fontSize="sm" mt={2} opacity={0.85}>
          {feasibility.justification}
        </Text>
      ) : null}
    </Box>
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
