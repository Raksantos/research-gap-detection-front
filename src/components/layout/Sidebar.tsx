import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { Layers, Network, Search, type LucideIcon } from "lucide-react";

const capabilities: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Search, label: "Multi-source search & dedupe" },
  { icon: Layers, label: "Async mapping jobs" },
  { icon: Network, label: "Topic & entity knowledge map" },
];

export function Sidebar() {
  return (
    <Box
      w="260px"
      flexShrink={0}
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      bg="bg.panel"
      p={5}
      display={{ base: "none", lg: "block" }}
    >
      <Heading
        size="xs"
        mb={4}
        color="fg.subtle"
        textTransform="uppercase"
        letterSpacing="wider"
      >
        Capabilities
      </Heading>
      <Stack as="ul" gap={3} listStyleType="none">
        {capabilities.map(({ icon: Icon, label }) => (
          <Flex as="li" key={label} align="center" gap={3}>
            <Box color="brand.fg" flexShrink={0}>
              <Icon size={18} strokeWidth={2} />
            </Box>
            <Text fontSize="sm">{label}</Text>
          </Flex>
        ))}
      </Stack>
      <Box borderTopWidth="1px" borderColor="border.muted" mt={5} pt={4}>
        <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
          Embedding-based dedupe and multi-agent gap detection remain on the
          roadmap.
        </Text>
      </Box>
    </Box>
  );
}
