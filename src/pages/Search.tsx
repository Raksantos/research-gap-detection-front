import { FormEvent, useMemo, useState } from "react";
import { Box, Button, Heading, Spinner, Stack, Text } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { ingestionSearch } from "@/api/generated";
import type { SearchRequest, SearchResponse, SourcesEnum } from "@/api/generated";

const initialPayload: SearchRequest = {
  query: "",
  sources: ["openalex", "arxiv"],
  limit: 50,
  dedupe: true,
  persist: true,
  year_min: 2020,
  year_max: new Date().getFullYear(),
  require_abstract: false,
};

function toNumberOrUndefined(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function SearchPage() {
  const [form, setForm] = useState<SearchRequest>(initialPayload);
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation<SearchResponse, Error, SearchRequest>({
    mutationFn: async (body) => {
      const response = await ingestionSearch({ body, throwOnError: true });
      return response.data;
    },
  });

  const data = mutation.data;
  const hasResults = Boolean(data && data.documents.length);

  const stats = useMemo(() => {
    if (!data) {
      return null;
    }
    return [
      ["Filtered out", data.filtered_out],
      ["Duplicates collapsed", data.duplicates_collapsed],
      ["Persisted", data.persisted],
      ...Object.entries(data.per_source_counts).map(([source, count]) => [
        `Count (${source})`,
        count,
      ]),
    ] as [string, number][];
  }, [data]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.query.trim()) {
      setFormError("Query is required.");
      return;
    }
    if (!form.sources?.length) {
      setFormError("Select at least one source.");
      return;
    }
    setFormError(null);
    mutation.mutate(form);
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

      <form onSubmit={handleSubmit}>
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Stack gap={4}>
            <Box>
              <label htmlFor="query">Query</label>
              <input
                id="query"
                name="query"
                value={form.query}
                onChange={(event) => setForm((prev) => ({ ...prev, query: event.target.value }))}
                placeholder="E.g. graph neural network drug discovery"
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
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
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
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
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
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
                  style={{ width: "100%", padding: "8px", marginTop: "4px" }}
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
              <label htmlFor="persist">
                <input
                  id="persist"
                  type="checkbox"
                  checked={form.persist ?? true}
                  onChange={(event) => setForm((prev) => ({ ...prev, persist: event.target.checked }))}
                />{" "}
                Persist
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
              {mutation.isPending ? "Searching..." : "Run search"}
            </Button>
          </Stack>
        </Box>
      </form>

      {formError ? <Text color="red.300">{formError}</Text> : null}
      {mutation.isError ? (
        <Text color="red.300">Request failed: {mutation.error.message}</Text>
      ) : null}

      {mutation.isPending ? (
        <Box>
          <Spinner size="sm" /> <Text as="span">Fetching documents...</Text>
        </Box>
      ) : null}

      {stats ? (
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Heading size="sm" mb={3}>
            Search stats
          </Heading>
          <Stack gap={1}>
            {stats.map(([label, value]) => (
              <Text key={label}>
                {label}: {value}
              </Text>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Heading size="sm" mb={3}>
          Documents
        </Heading>
        {!hasResults ? (
          <Text>No documents yet. Submit a query to start.</Text>
        ) : (
          <Stack gap={3}>
            {data?.documents.map((doc) => (
              <Box key={`${doc.source}:${doc.external_id}`} borderWidth="1px" borderRadius="md" p={3}>
                <Text fontWeight="bold">{doc.title}</Text>
                <Text fontSize="sm" opacity={0.8}>
                  {doc.source} - {doc.year ?? "n/a"}
                </Text>
                {doc.abstract ? <Text mt={2}>{doc.abstract}</Text> : null}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
