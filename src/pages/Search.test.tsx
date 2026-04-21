import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { SearchPage } from "@/pages/Search";
import { searchDocuments } from "@/api/endpoints/search";
import { system } from "@/theme/system";

vi.mock("@/api/endpoints/search", () => ({
  searchDocuments: vi.fn(),
}));

const mockSearchDocuments = vi.mocked(searchDocuments);

function renderPage() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ChakraProvider value={system}>
        <SearchPage />
      </ChakraProvider>
    </ThemeProvider>,
  );
}

describe("SearchPage", () => {
  beforeEach(() => {
    mockSearchDocuments.mockReset();
  });

  it("submits and renders results on success", async () => {
    mockSearchDocuments.mockResolvedValue({
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
    });

    renderPage();

    fireEvent.change(screen.getByLabelText("Query"), {
      target: { value: "transformer molecules" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run search" }));

    await waitFor(() => {
      expect(mockSearchDocuments).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText("Test document")).toBeInTheDocument();
    expect(screen.getByText("Persisted: 1")).toBeInTheDocument();
  });

  it("renders request error when API fails", async () => {
    mockSearchDocuments.mockRejectedValue(new Error("backend unavailable"));
    renderPage();

    fireEvent.change(screen.getByLabelText("Query"), { target: { value: "query" } });
    fireEvent.click(screen.getByRole("button", { name: "Run search" }));

    expect(await screen.findByText(/Request failed:/)).toBeInTheDocument();
  });

  it("shows loading state while request is running", async () => {
    mockSearchDocuments.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        documents: [],
        per_source_counts: {},
        filtered_out: 0,
        duplicates_collapsed: 0,
        persisted: 0,
      }), 30)),
    );

    renderPage();
    fireEvent.change(screen.getByLabelText("Query"), { target: { value: "query" } });
    fireEvent.click(screen.getByRole("button", { name: "Run search" }));

    expect(screen.getByText("Searching...")).toBeInTheDocument();
    expect(screen.getByText("Fetching documents...")).toBeInTheDocument();
  });
});
