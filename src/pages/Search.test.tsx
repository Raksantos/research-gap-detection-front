import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchPage } from "@/pages/Search";
import { ingestionRun, ingestionJobsList } from "@/api/generated";
import type { IngestionJob, IngestionJobList, RunIngestionResponse } from "@/api/generated";
import { system } from "@/theme/system";
import { ProjectProvider } from "@/projects/ProjectProvider";

vi.mock("@/api/generated", async () => {
  const actual = await vi.importActual<typeof import("@/api/generated")>("@/api/generated");
  return {
    ...actual,
    ingestionRun: vi.fn(),
    ingestionJobsList: vi.fn(),
  };
});

const mockIngestionRun = ingestionRun as unknown as ReturnType<typeof vi.fn>;
const mockIngestionJobsList = ingestionJobsList as unknown as ReturnType<typeof vi.fn>;

function buildResponse<T>(data: T) {
  return { data, status: 200, statusText: "OK", headers: {}, config: {} };
}

function makeJob(overrides: Partial<IngestionJob> = {}): IngestionJob {
  return {
    id: 3,
    status: "success",
    query: "transformers",
    sources: ["arxiv"],
    limit: 50,
    params: {},
    stats: { persisted: 2 },
    result_count: 2,
    error: "",
    created_at: "2026-05-28T00:00:00Z",
    finished_at: "2026-05-28T00:01:00Z",
    ...overrides,
  };
}

function emptyList(): IngestionJobList {
  return { total: 0, jobs: [] };
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
          <ProjectProvider>
            <SearchPage />
          </ProjectProvider>
        </QueryClientProvider>
      </ChakraProvider>
    </ThemeProvider>,
  );
}

describe("SearchPage", () => {
  beforeEach(() => {
    mockIngestionRun.mockReset();
    mockIngestionJobsList.mockReset();
    // A project must be selected for the search form to submit.
    localStorage.setItem("rgd.selectedProjectId", "1");
    mockIngestionJobsList.mockResolvedValue(buildResponse(emptyList()));
  });

  it("starts an async search and shows the running banner", async () => {
    mockIngestionRun.mockResolvedValue(
      buildResponse<RunIngestionResponse>({
        job_id: 7,
        status: "pending",
        task_id: "abc",
      }),
    );

    renderPage();

    fireEvent.change(screen.getByLabelText("Query"), {
      target: { value: "transformer molecules" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run search" }));

    await waitFor(() => {
      expect(mockIngestionRun).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText(/Search #7 started/)).toBeInTheDocument();
  });

  it("renders an error when starting the search fails", async () => {
    mockIngestionRun.mockRejectedValue(new Error("backend unavailable"));
    renderPage();

    fireEvent.change(screen.getByLabelText("Query"), { target: { value: "query" } });
    fireEvent.click(screen.getByRole("button", { name: "Run search" }));

    expect(await screen.findByText(/Failed to start search:/)).toBeInTheDocument();
  });

  it("lists existing searches from the jobs query", async () => {
    mockIngestionJobsList.mockResolvedValue(
      buildResponse<IngestionJobList>({ total: 1, jobs: [makeJob({ id: 3 })] }),
    );

    renderPage();

    expect(await screen.findByText("Search #3")).toBeInTheDocument();
  });
});
