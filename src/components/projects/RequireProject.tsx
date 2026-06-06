import type { PropsWithChildren } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Flex, Heading, Spinner, Stack, Text } from "@chakra-ui/react";
import { useAuth } from "@/auth/authContext";
import { useSelectedProject } from "@/projects/projectContext";
import { useProjects } from "@/projects/useProjects";

/**
 * Gate for project-scoped features. Renders children only when the user has an
 * active project that still exists; otherwise it prompts them to create or
 * select one. Assumes it sits inside <RequireAuth>, so the user is logged in.
 */
export function RequireProject({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const { selectedProjectId } = useSelectedProject();
  const { data: projects, isLoading } = useProjects(isAuthenticated);

  if (isLoading) {
    return (
      <Flex minH="40vh" align="center" justify="center">
        <Spinner size="lg" color="brand.fg" />
      </Flex>
    );
  }

  const hasProjects = (projects?.length ?? 0) > 0;
  const activeExists =
    selectedProjectId !== null &&
    (projects?.some((p) => p.id === selectedProjectId) ?? false);

  if (!activeExists) {
    return (
      <Box borderWidth="1px" borderRadius="md" p={6} maxW="lg">
        <Stack gap={3}>
          <Heading size="md">
            {hasProjects ? "Select a project" : "Create a project"}
          </Heading>
          <Text color="fg.muted">
            {hasProjects
              ? "This feature works on a project's corpus. Pick an active project to continue."
              : "You need at least one project before using this feature. Create one to get started."}
          </Text>
          <Button asChild colorPalette="brand" alignSelf="flex-start">
            <RouterLink to="/projects">
              {hasProjects ? "Go to projects" : "Create a project"}
            </RouterLink>
          </Button>
        </Stack>
      </Box>
    );
  }

  return <>{children}</>;
}
