import { client } from "@/api/generated/client.gen";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";

client.setConfig({
  baseURL,
  throwOnError: true,
});
