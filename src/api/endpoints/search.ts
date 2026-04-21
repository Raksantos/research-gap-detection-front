import { apiClient } from "@/api/client";
import type { SearchRequest, SearchResponse } from "@/types/search";

export async function searchDocuments(payload: SearchRequest): Promise<SearchResponse> {
  const { data } = await apiClient.post<SearchResponse>("/ingest/search/", payload);
  return data;
}
