import { useState } from "react";
import type { FormEvent } from "react";
import {
  Badge,
  Box,
  Button,
  chakra,
  Flex,
  Heading,
  Input,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2 } from "lucide-react";
import { projectsCreate, projectsDelete } from "@/api/generated";
import type { Project, ProjectWritable } from "@/api/generated";
import { PROJECTS_QUERY_KEY, useProjects } from "@/projects/useProjects";
import { useSelectedProject } from "@/projects/projectContext";

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const { selectedProjectId, selectProject } = useSelectedProject();
  const projectsQuery = useProjects();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation<Project, Error, ProjectWritable>({
    mutationFn: async (body) =>
      (await projectsCreate({ body, throwOnError: true })).data,
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      selectProject(project.id);
      setName("");
      setDescription("");
    },
  });

  const deleteMutation = useMutation<number, Error, number>({
    mutationFn: async (projectId) => {
      await projectsDelete({ path: { project_id: projectId }, throwOnError: true });
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      if (projectId === selectedProjectId) {
        selectProject(null);
      }
    },
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    createMutation.mutate({
      name: trimmed,
      description: description.trim() || undefined,
    });
  }

  function handleDelete(project: Project) {
    // Confirm now while a project owns nothing; Phase 5 makes this cascade to
    // ingestion/mapping/gap jobs, so the guard should already be muscle memory.
    if (
      window.confirm(
        `Delete project "${project.name}"? This cannot be undone.`,
      )
    ) {
      deleteMutation.mutate(project.id);
    }
  }

  const projects = projectsQuery.data ?? [];

  return (
    <Stack gap={6}>
      <Box>
        <Heading size="lg" letterSpacing="-0.01em">
          Projects
        </Heading>
        <Text color="fg.muted" mt={1}>
          Each project scopes its own research effort. Select one to make it the
          active workspace.
        </Text>
      </Box>

      <Box borderWidth="1px" borderColor="border" borderRadius="xl" bg="bg.panel" p={5}>
        <Heading size="sm" mb={4}>
          New project
        </Heading>
        <form onSubmit={handleCreate}>
          <Stack gap={4}>
            <Box>
              <chakra.label htmlFor="project-name" fontSize="sm" fontWeight="500">
                Name
              </chakra.label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gaps in multimodal retrieval"
                mt={1}
              />
            </Box>
            <Box>
              <chakra.label
                htmlFor="project-description"
                fontSize="sm"
                fontWeight="500"
              >
                Description{" "}
                <Text as="span" color="fg.subtle">
                  (optional)
                </Text>
              </chakra.label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={3}
                mt={1}
              />
            </Box>
            {createMutation.isError ? (
              <Text color="red.300" fontSize="sm">
                Could not create the project: {createMutation.error.message}
              </Text>
            ) : null}
            <Box>
              <Button
                type="submit"
                colorPalette="brand"
                disabled={createMutation.isPending || !name.trim()}
              >
                {createMutation.isPending ? "Creating..." : "Create project"}
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>

      <Box>
        <Heading size="sm" mb={3}>
          Your projects ({projects.length})
        </Heading>

        {projectsQuery.isLoading ? (
          <Flex align="center" gap={2} color="fg.muted">
            <Spinner size="sm" /> <Text>Loading projects...</Text>
          </Flex>
        ) : null}
        {projectsQuery.isError ? (
          <Text color="red.300">
            Failed to load projects: {projectsQuery.error.message}
          </Text>
        ) : null}

        {!projectsQuery.isLoading && projects.length === 0 ? (
          <Text color="fg.muted">No projects yet. Create one above.</Text>
        ) : (
          <Stack gap={3}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={project.id === selectedProjectId}
                onSelect={() => selectProject(project.id)}
                onDelete={() => handleDelete(project)}
                isDeleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables === project.id
                }
              />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

type ProjectCardProps = {
  project: Project;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

function ProjectCard({
  project,
  isActive,
  onSelect,
  onDelete,
  isDeleting,
}: Readonly<ProjectCardProps>) {
  return (
    <Box
      borderWidth="1px"
      borderColor={isActive ? "brand.solid" : "border"}
      borderRadius="lg"
      bg="bg.panel"
      p={4}
    >
      <Flex justify="space-between" align="flex-start" gap={4}>
        <Box minW={0}>
          <Flex align="center" gap={2}>
            <Heading size="sm" truncate>
              {project.name}
            </Heading>
            {isActive ? (
              <Badge colorPalette="brand" variant="subtle">
                Active
              </Badge>
            ) : null}
          </Flex>
          {project.description ? (
            <Text fontSize="sm" color="fg.muted" mt={1}>
              {project.description}
            </Text>
          ) : null}
          <Text fontSize="xs" color="fg.subtle" mt={2}>
            Created {formatDate(project.created_at)}
          </Text>
        </Box>
        <Flex gap={2} flexShrink={0}>
          <Button
            size="sm"
            colorPalette="brand"
            variant={isActive ? "subtle" : "solid"}
            onClick={onSelect}
            disabled={isActive}
          >
            {isActive ? <Check size={16} /> : null}
            {isActive ? "Selected" : "Select"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            colorPalette="red"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={`Delete ${project.name}`}
          >
            <Trash2 size={16} />
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
