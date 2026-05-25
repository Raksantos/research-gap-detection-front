import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "@/api/bootstrap";
import { queryClient } from "@/api/queryClient";
import { router } from "@/router";
import { system } from "@/theme/system";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProjectProvider } from "@/projects/ProjectProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ChakraProvider value={system}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProjectProvider>
              <RouterProvider router={router} />
            </ProjectProvider>
          </AuthProvider>
          {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
        </QueryClientProvider>
      </ChakraProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
