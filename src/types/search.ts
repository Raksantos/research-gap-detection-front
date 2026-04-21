export type Source = "openalex" | "arxiv";

export interface SearchRequest {
  query: string;
  sources: Source[];
  limit: number;
  dedupe: boolean;
  persist: boolean;
  year_min?: number;
  year_max?: number;
  require_abstract: boolean;
}

export interface DocumentItem {
  source: string;
  external_id: string;
  title: string;
  abstract: string | null;
  authors: string[];
  year: number | null;
  doi: string | null;
  keywords: string[];
  url: string | null;
}

export interface SearchResponse {
  documents: DocumentItem[];
  per_source_counts: Record<string, number>;
  filtered_out: number;
  duplicates_collapsed: number;
  persisted: number;
}
