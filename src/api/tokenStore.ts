/**
 * Persistent JWT storage + a tiny pub/sub so the API layer can tell the React
 * tree that auth was lost (e.g. refresh failed) without importing React here.
 */
const ACCESS_KEY = "rgd.access";
const REFRESH_KEY = "rgd.refresh";

export const tokenStore = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh?: string): void => {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) {
      localStorage.setItem(REFRESH_KEY, refresh);
    }
  },
  setAccess: (access: string): void => {
    localStorage.setItem(ACCESS_KEY, access);
  },
  clear: (): void => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  hasSession: (): boolean => Boolean(localStorage.getItem(ACCESS_KEY)),
};

export const AUTH_LOGOUT_EVENT = "rgd:auth-logout";

/** Fired by the API layer when the session can no longer be recovered. */
export function emitAuthLogout(): void {
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}
