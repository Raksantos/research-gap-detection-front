import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { system } from "@/theme/system";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ChakraProvider value={system}>
        <RouterProvider router={router} />
      </ChakraProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
