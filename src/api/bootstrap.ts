import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { client } from "@/api/generated/client.gen";
import { emitAuthLogout, tokenStore } from "@/api/tokenStore";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";

client.setConfig({
  baseURL,
  throwOnError: true,
});

const instance = client.instance;

// Attach the access token to every outgoing request.
instance.interceptors.request.use((config) => {
  const access = tokenStore.getAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Single in-flight refresh shared across concurrent 401s.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) {
    throw new Error("No refresh token");
  }
  // Bare axios call (not the shared instance) to avoid interceptor recursion.
  const resp = await axios.post<{ access: string }>(
    `${baseURL}/api/auth/token/refresh/`,
    { refresh },
  );
  tokenStore.setAccess(resp.data.access);
  return resp.data.access;
}

// On 401, try to refresh the access token once, then replay the request.
instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";
    const isAuthCall = url.includes("/auth/token");

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthCall &&
      tokenStore.getRefresh()
    ) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const access = await refreshPromise;
        original.headers.Authorization = `Bearer ${access}`;
        return instance(original);
      } catch {
        tokenStore.clear();
        emitAuthLogout();
      }
    }

    return Promise.reject(error);
  },
);
