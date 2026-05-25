import { createContext, useContext } from "react";

export type ProjectContextValue = {
  /** The project currently scoping the workspace, or null when none is chosen. */
  selectedProjectId: number | null;
  selectProject: (id: number | null) => void;
};

export const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useSelectedProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error(
      "useSelectedProject must be used within a <ProjectProvider>",
    );
  }
  return ctx;
}
