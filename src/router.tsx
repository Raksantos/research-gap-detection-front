import { createBrowserRouter } from "react-router-dom";
import { App } from "@/App";
import { HomePage } from "@/pages/Home";
import { SearchPage } from "@/pages/Search";
import { JobsPage } from "@/pages/Jobs";
import { GapsPage } from "@/pages/Gaps";
import { ProjectsPage } from "@/pages/Projects";
import { LoginPage } from "@/pages/Login";
import { RegisterPage } from "@/pages/Register";
import { NotFoundPage } from "@/pages/NotFound";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "search", element: <SearchPage /> },
      { path: "jobs", element: <JobsPage /> },
      { path: "gaps", element: <GapsPage /> },
      {
        path: "projects",
        element: (
          <RequireAuth>
            <ProjectsPage />
          </RequireAuth>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
