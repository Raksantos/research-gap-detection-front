import { isAxiosError } from "axios";

/** Best-effort human message out of a DRF/SimpleJWT error response. */
export function authErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string; [key: string]: unknown }
      | undefined;
    if (data) {
      if (typeof data.detail === "string") {
        return data.detail;
      }
      // Field errors look like { username: ["..."], password: ["..."] }.
      const firstField = Object.values(data).find(
        (v) => Array.isArray(v) && v.length > 0,
      ) as string[] | undefined;
      if (firstField) {
        return firstField[0];
      }
    }
  }
  return fallback;
}
