import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authMe, authRegister, authTokenCreate } from "@/api/generated";
import type { TokenObtainPair, User } from "@/api/generated";
import { AUTH_LOGOUT_EVENT, emitAuthLogout, tokenStore } from "@/api/tokenStore";
import { AuthContext } from "@/auth/authContext";
import type { AuthContextValue, RegisterInput } from "@/auth/authContext";

const ME_QUERY_KEY = ["auth", "me"] as const;

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [hasSession, setHasSession] = useState<boolean>(() =>
    tokenStore.hasSession(),
  );

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => (await authMe({ throwOnError: true })).data,
    enabled: hasSession,
    retry: false,
    staleTime: Infinity,
  });

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setHasSession(false);
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
  }, [queryClient]);

  // The API layer fires this when a refresh fails and the session is dead.
  useEffect(() => {
    const onLogout = () => clearSession();
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, [clearSession]);

  const login = useCallback(
    async (username: string, password: string) => {
      const { data } = await authTokenCreate({
        // access/refresh are response-only; the generated body type still lists
        // them, so we cast the credentials we actually send.
        body: { username, password } as TokenObtainPair,
        throwOnError: true,
      });
      tokenStore.set(data.access, data.refresh);
      setHasSession(true);
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
    [queryClient],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<User> => {
      const { data } = await authRegister({ body: input, throwOnError: true });
      return data;
    },
    [],
  );

  const logout = useCallback(() => {
    // Broadcast so other providers (e.g. project selection) reset too; the
    // AUTH_LOGOUT_EVENT listener above performs the session teardown.
    queryClient.clear();
    emitAuthLogout();
  }, [queryClient]);

  const user = meQuery.data ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading: hasSession && meQuery.isLoading,
      login,
      register,
      logout,
    }),
    [user, hasSession, meQuery.isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
