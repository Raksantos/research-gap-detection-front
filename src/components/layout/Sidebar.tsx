import { Box, Heading, Stack, Text } from "@chakra-ui/react";

export function Sidebar() {
  return (
    <Box w="260px" borderWidth="1px" borderRadius="md" p={4}>
      <Heading size="sm" mb={3}>
        Roadmap
      </Heading>
      <Stack as="ul" pl={5} gap={2}>
        <Box as="li">Async jobs orchestration</Box>
        <Box as="li">Embedding-based dedupe</Box>
        <Box as="li">Multi-agent gap detection</Box>
      </Stack>
      <Text fontSize="sm" mt={4} opacity={0.8}>
        This UI is structured to absorb upcoming backend capabilities.
      </Text>
    </Box>
  );
}
