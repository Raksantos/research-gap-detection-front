import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchPage } from "@/pages/Search";
import { ingestionSearch } from "@/api/generated";
import type { SearchResponse } from "@/api/generated";
import { system } from "@/theme/system";

vi.mock("@/api/generated", async () => {
  const actual = await vi.importActual<typeof import("@/api/generated")>("@/api/generated");
  return {
    ...actual,
    ingestionSearch: vi.fn(),
  };
});

const mockIngestionSearch = ingestionSearch as unknown as ReturnType<typeof vi.fn>;

function buildResponse(data: SearchResponse) {
  return { data, status: 200, statusText: "OK", headers: {}, config: {} };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ChakraProvider value={system}>
        <QueryClientProvider client={queryClient}>
          <SearchPage />
        </QueryClientProvider>
      </ChakraProvider>
    </ThemeProvider>,
  );
}

describe("SearchPage", () => {
  beforeEach(() => {
    mockIngestionSearch.mockReset();
  });

  it("submits and renders results on success", async () => {
    mockIngestionSearch.mockResolvedValue(
      buildResponse({
        documents: [
          {
            source: "openalex",
            external_id: "123",
            title: "Test document",
            abstract: "A useful abstract.",
            authors: [],
            year: 2024,
            doi: null,
            keywords: [],
            url: null,
          },
        ],
        per_source_counts: { openalex: 1 },
        filtered_out: 0,
        duplicates_collapsed: 0,
        persisted: 1,
      }),
    );

    renderPage();

    fireEvent.change(screen.getByLabelText("Query"), {
      target: { value: "transformer molecules" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run search" }));

    await waitFor(() => {
      expect(mockIngestionSearch).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText("Test document")).toBeInTheDocument();
    expect(screen.getByText("Persisted: 1")).toBeInTheDocument();
  });

  it("renders request error when API fails", async () => {
    mockIngestionSearch.mockRejectedValue(new Error("backend unavailable"));
    renderPage();

    fireEvent.change(screen.getByLabelText("Query"), { target: { value: "query" } });
    fireEvent.click(screen.getByRole("button", { name: "Run search" }));

    expect(await screen.findByText(/Request failed:/)).toBeInTheDocument();
  });

  it("shows loading state while request is running", async () => {
    mockIngestionSearch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                buildResponse({
                  documents: [],
                  per_source_counts: {},
                  filtered_out: 0,
                  duplicates_collapsed: 0,
                  persisted: 0,
                }),
              ),
            30,
          ),
        ),
    );

    renderPage();
    fireEvent.change(screen.getByLabelText("Query"), { target: { value: "query" } });
    fireEvent.click(screen.getByRole("button", { name: "Run search" }));

    expect(screen.getByText("Searching...")).toBeInTheDocument();
    expect(screen.getByText("Fetching documents...")).toBeInTheDocument();
  });
});
