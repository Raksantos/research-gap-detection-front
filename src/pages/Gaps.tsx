import type { ReactNode } from "react";
import { Box, Heading, Link, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { mappingJobSummary } from "@/api/generated";
import type { MappingSummary, SummaryCoOccurrence, SummaryEntity, SummaryTopic } from "@/api/generated";

export function GapsPage() {
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get("job_id");
  const jobId = jobIdParam ? Number(jobIdParam) : null;
  const hasValidJob = jobId !== null && Number.isFinite(jobId);

  const summaryQuery = useQuery<MappingSummary>({
    queryKey: ["mapping", "summary", jobId],
    enabled: hasValidJob,
    queryFn: async () => {
      const response = await mappingJobSummary({
        path: { job_id: jobId as number },
        throwOnError: true,
      });
      return response.data;
    },
  });

  if (!hasValidJob) {
    return (
      <Stack gap={3}>
        <Heading size="lg">Gaps</Heading>
        <Text>
          Pick a job from the{" "}
          <Link asChild color="blue.300">
            <RouterLink to="/jobs">Jobs page</RouterLink>
          </Link>{" "}
          to inspect its knowledge map (topics, key entities and co-occurrences).
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={6}>
      <Heading size="lg">Gaps · Job #{jobId}</Heading>

      {summaryQuery.isLoading ? (
        <Box>
          <Spinner size="sm" /> <Text as="span">Loading summary...</Text>
        </Box>
      ) : null}
      {summaryQuery.isError ? (
        <Text color="red.300">Failed to load summary: {summaryQuery.error.message}</Text>
      ) : null}

      {summaryQuery.data ? <SummaryView summary={summaryQuery.data} /> : null}
    </Stack>
  );
}

function SummaryView({ summary }: Readonly<{ summary: MappingSummary }>) {
  return (
    <Stack gap={6}>
      <Text opacity={0.8}>Status: {summary.status}</Text>

      <Section title={`Topics (${summary.topics.length})`}>
        {summary.topics.length === 0 ? (
          <Text>No topics for this job.</Text>
        ) : (
          <Stack gap={3}>
            {summary.topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </Stack>
        )}
      </Section>

      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap={4}>
        <EntityList title="Top methods" entities={summary.top_methods} />
        <EntityList title="Top datasets" entities={summary.top_datasets} />
        <EntityList title="Top tasks" entities={summary.top_tasks} />
        <EntityList title="Top metrics" entities={summary.top_metrics} />
      </Box>

      <Section title={`Co-occurrences (${summary.top_cooccurrences.length})`}>
        {summary.top_cooccurrences.length === 0 ? (
          <Text>No co-occurrences for this job.</Text>
        ) : (
          <Stack gap={2}>
            {summary.top_cooccurrences.map((edge) => (
              <CoOccurrenceRow key={`${edge.entity_a.id}-${edge.entity_b.id}`} edge={edge} />
            ))}
          </Stack>
        )}
      </Section>
    </Stack>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={4}>
      <Heading size="sm" mb={3}>
        {title}
      </Heading>
      {children}
    </Box>
  );
}

function TopicCard({ topic }: Readonly<{ topic: SummaryTopic }>) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Text fontWeight="bold">{topic.label}</Text>
        <Text fontSize="sm" opacity={0.8}>
          {topic.size} docs
        </Text>
      </Box>
      {topic.keywords.length ? (
        <Text fontSize="sm" mt={1} opacity={0.8}>
          {topic.keywords.join(", ")}
        </Text>
      ) : null}
    </Box>
  );
}

function EntityList({ title, entities }: Readonly<{ title: string; entities: SummaryEntity[] }>) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={3}>
      <Heading size="xs" mb={2}>
        {title}
      </Heading>
      {entities.length === 0 ? (
        <Text fontSize="sm" opacity={0.7}>
          —
        </Text>
      ) : (
        <Stack gap={1}>
          {entities.map((entity) => (
            <Box key={entity.id} display="flex" justifyContent="space-between" gap={2}>
              <Text fontSize="sm">{entity.name}</Text>
              <Text fontSize="sm" opacity={0.7}>
                {entity.document_count}
              </Text>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function CoOccurrenceRow({ edge }: Readonly<{ edge: SummaryCoOccurrence }>) {
  return (
    <Box display="flex" justifyContent="space-between" gap={2}>
      <Text fontSize="sm">
        {edge.entity_a.name} ↔ {edge.entity_b.name}
      </Text>
      <Text fontSize="sm" opacity={0.7}>
        {edge.weight}
      </Text>
    </Box>
  );
}
