import { useQuery } from "@tanstack/react-query";
import { projectsList } from "@/api/generated";
import type { Project } from "@/api/generated";

export const PROJECTS_QUERY_KEY = ["projects"] as const;

/**
 * Shared list of the current user's projects. Disabled until authenticated so
 * we don't fire a guaranteed 401 before login. Cached under one key so the
 * Navbar indicator and the Projects page reuse a single request.
 */
export function useProjects(enabled = true) {
  return useQuery<Project[]>({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: async () => (await projectsList({ throwOnError: true })).data,
    enabled,
  });
}
