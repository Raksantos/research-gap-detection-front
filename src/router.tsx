import { createBrowserRouter } from "react-router-dom";
import { App } from "@/App";
import { HomePage } from "@/pages/Home";
import { SearchPage } from "@/pages/Search";
import { JobsPage } from "@/pages/Jobs";
import { GapsPage } from "@/pages/Gaps";
import { NotFoundPage } from "@/pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "search", element: <SearchPage /> },
      { path: "jobs", element: <JobsPage /> },
      { path: "gaps", element: <GapsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
