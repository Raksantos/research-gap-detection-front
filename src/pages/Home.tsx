import { Fragment } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  ChevronRight,
  type LucideIcon,
  Network,
  Search,
  Sparkles,
  Target,
  Telescope,
  Workflow,
} from "lucide-react";

const features: Array<{
  to: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  cta: string;
}> = [
  {
    to: "/search",
    icon: Telescope,
    title: "Multi-source search",
    desc: "Query OpenAlex & arXiv in a single pass — results are normalized, deduplicated, filtered and optionally persisted to the corpus.",
    cta: "Search the literature",
  },
  {
    to: "/jobs",
    icon: Workflow,
    title: "Mapping jobs",
    desc: "Kick off async knowledge-mapping runs over the persisted corpus and follow each job from pending to success.",
    cta: "Manage jobs",
  },
  {
    to: "/map",
    icon: Network,
    title: "Knowledge map",
    desc: "Explore topics, key entities and their co-occurrences to see where the literature is dense — and where it isn't.",
    cta: "Explore the map",
  },
  {
    to: "/gaps",
    icon: Target,
    title: "Gap detection",
    desc: "Run gap detection over a knowledge map to surface under-explored topics and rare combinations, each backed by evidence.",
    cta: "Detect gaps",
  },
  {
    to: "/feasibility",
    icon: Sparkles,
    title: "Feasibility",
    desc: "Score each detected gap by how tractable it is — matched datasets, benchmarks and frameworks weighed against cost and complexity.",
    cta: "Assess feasibility",
  },
  {
    to: "/agents",
    icon: Bot,
    title: "Agents",
    desc: "Drive the multi-agent orchestration graphs end-to-end, pausing for human review at key decisions before resuming.",
    cta: "Run the agents",
  },
];

const steps: Array<{ icon: LucideIcon; title: string }> = [
  { icon: Search, title: "Search & ingest" },
  { icon: Network, title: "Map the corpus" },
  { icon: Target, title: "Detect the gaps" },
];

function IconBadge({ icon: Icon, size = 22 }: { icon: LucideIcon; size?: number }) {
  return (
    <Flex
      align="center"
      justify="center"
      boxSize={11}
      flexShrink={0}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="brand.muted"
      bg="brand.subtle"
      color="brand.fg"
    >
      <Icon size={size} strokeWidth={2} />
    </Flex>
  );
}

export function HomePage() {
  return (
    <Stack gap={{ base: 10, md: 14 }}>
      {/* Hero */}
      <Box
        position="relative"
        overflow="hidden"
        borderWidth="1px"
        borderColor="border"
        borderRadius="2xl"
        bg="bg.panel"
        px={{ base: 6, md: 10 }}
        py={{ base: 10, md: 14 }}
      >
        <Box
          aria-hidden
          position="absolute"
          top="-45%"
          right="-8%"
          boxSize="480px"
          rounded="full"
          bg="brand.solid"
          opacity={0.14}
          filter="blur(120px)"
          pointerEvents="none"
        />
        <Stack gap={6} maxW="2xl" position="relative">
          <Badge
            colorPalette="brand"
            variant="subtle"
            alignSelf="flex-start"
            px={3}
            py={1}
            borderRadius="full"
          >
            <Sparkles size={14} />
            Research Gap Detection
          </Badge>

          <Heading
            size={{ base: "2xl", md: "4xl" }}
            lineHeight="1.1"
            letterSpacing="-0.02em"
          >
            Map the literature.{" "}
            <Box as="span" color="brand.fg">
              Surface the gaps.
            </Box>
          </Heading>

          <Text fontSize={{ base: "md", md: "lg" }} color="fg.muted" maxW="xl">
            A workbench for systematic literature review: search OpenAlex and
            arXiv, build a knowledge map over the corpus, and spot the topics
            that nobody has connected yet.
          </Text>

          <Flex gap={3} pt={2} wrap="wrap">
            <Button asChild colorPalette="brand" size="lg">
              <RouterLink to="/search">
                <Telescope size={18} />
                Start a search
                <ArrowRight size={16} />
              </RouterLink>
            </Button>
            <Button asChild variant="outline" size="lg">
              <RouterLink to="/jobs">Browse mapping jobs</RouterLink>
            </Button>
          </Flex>
        </Stack>
      </Box>

      {/* Pipeline */}
      <Flex
        align="center"
        justify="space-between"
        gap={{ base: 4, md: 2 }}
        wrap={{ base: "wrap", md: "nowrap" }}
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        bg="bg.panel"
        px={{ base: 5, md: 8 }}
        py={5}
      >
        {steps.map((step, index) => (
          <Fragment key={step.title}>
            <Flex align="center" gap={3} flex="1" minW="200px">
              <IconBadge icon={step.icon} size={20} />
              <Box>
                <Text
                  fontSize="xs"
                  color="fg.subtle"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Step {index + 1}
                </Text>
                <Text fontWeight="600">{step.title}</Text>
              </Box>
            </Flex>
            {index < steps.length - 1 && (
              <Box color="fg.subtle" display={{ base: "none", md: "block" }}>
                <ChevronRight size={22} />
              </Box>
            )}
          </Fragment>
        ))}
      </Flex>

      {/* Capabilities */}
      <Stack gap={5}>
        <Heading size="md">What you can do</Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
          {features.map((feature) => (
            <Box
              key={feature.to}
              asChild
              display="flex"
              flexDirection="column"
              gap={4}
              h="full"
              p={6}
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              bg="bg.panel"
              transition="border-color .18s ease, transform .18s ease, background .18s ease"
              _hover={{
                borderColor: "brand.emphasized",
                transform: "translateY(-3px)",
                bg: "bg.subtle",
              }}
            >
              <RouterLink to={feature.to}>
                <IconBadge icon={feature.icon} />
                <Box>
                  <Heading size="md" mb={1}>
                    {feature.title}
                  </Heading>
                  <Text color="fg.muted" fontSize="sm" lineHeight="1.55">
                    {feature.desc}
                  </Text>
                </Box>
                <Flex
                  mt="auto"
                  align="center"
                  gap={1}
                  color="brand.fg"
                  fontWeight="600"
                  fontSize="sm"
                >
                  {feature.cta}
                  <ArrowRight size={15} />
                </Flex>
              </RouterLink>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>

      {/* Roadmap note */}
      <Flex
        align="center"
        gap={3}
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="lg"
        bg="bg.subtle"
        px={5}
        py={4}
        color="fg.muted"
        fontSize="sm"
      >
        <Box color="accent.fg" flexShrink={0}>
          <Sparkles size={18} />
        </Box>
        <Text>
          On the roadmap: embedding-based deduplication and multi-agent gap
          detection over the knowledge map.
        </Text>
      </Flex>
    </Stack>
  );
}
