import { useCallback, useState } from "react";

type AsyncStatus = "idle" | "loading" | "success" | "error";

export function useAsync<TData, TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<TData>,
) {
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      setStatus("loading");
      setError(null);
      try {
        const response = await fn(...args);
        setData(response);
        setStatus("success");
        return response;
      } catch (err) {
        setStatus("error");
        const normalizedError = err instanceof Error ? err : new Error("Unknown error");
        setError(normalizedError);
        throw normalizedError;
      }
    },
    [fn],
  );

  return { status, data, error, run };
}
