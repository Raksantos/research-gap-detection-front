import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: process.env.OPENAPI_SCHEMA_URL ?? "openapi/schema.json",
  output: "src/api/generated",
  plugins: ["@hey-api/client-axios"],
});
