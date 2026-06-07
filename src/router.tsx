import { createBrowserRouter, Outlet } from "react-router-dom";
import { App } from "@/App";
import { HomePage } from "@/pages/Home";
import { SearchPage } from "@/pages/Search";
import { JobsPage } from "@/pages/Jobs";
import { MapPage } from "@/pages/Map";
import { GapsPage } from "@/pages/Gaps";
import { FeasibilityPage } from "@/pages/Feasibility";
import { ReportPage } from "@/pages/Report";
import { ProjectsPage } from "@/pages/Projects";
import { LoginPage } from "@/pages/Login";
import { RegisterPage } from "@/pages/Register";
import { NotFoundPage } from "@/pages/NotFound";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireProject } from "@/components/projects/RequireProject";

/** Features require both a logged-in user and an active project. */
function ProtectedLayout() {
  return (
    <RequireAuth>
      <RequireProject>
        <Outlet />
      </RequireProject>
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      {
        element: <ProtectedLayout />,
        children: [
          { path: "search", element: <SearchPage /> },
          { path: "jobs", element: <JobsPage /> },
          { path: "map", element: <MapPage /> },
          { path: "gaps", element: <GapsPage /> },
          { path: "feasibility", element: <FeasibilityPage /> },
          { path: "report", element: <ReportPage /> },
        ],
      },
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
