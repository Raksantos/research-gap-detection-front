import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { AUTH_LOGOUT_EVENT } from "@/api/tokenStore";
import { ProjectContext } from "@/projects/projectContext";

const STORAGE_KEY = "rgd.selectedProjectId";

function readStored(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : null;
}

/**
 * Holds the active project id, persisted across reloads. The selection is
 * dropped when the session ends so it never bleeds between logins.
 */
export function ProjectProvider({ children }: PropsWithChildren) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    readStored,
  );

  const selectProject = useCallback((id: number | null) => {
    setSelectedProjectId(id);
    if (id === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  }, []);

  // The session can end via manual logout or a failed refresh; both broadcast
  // AUTH_LOGOUT_EVENT. Subscribe so we forget the selection on the way out.
  useEffect(() => {
    const onLogout = () => {
      setSelectedProjectId(null);
      localStorage.removeItem(STORAGE_KEY);
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, []);

  const value = useMemo(
    () => ({ selectedProjectId, selectProject }),
    [selectedProjectId, selectProject],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}
