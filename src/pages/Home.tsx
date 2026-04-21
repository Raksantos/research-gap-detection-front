import { Heading, Stack, Text } from "@chakra-ui/react";

export function HomePage() {
  return (
    <Stack gap={3}>
      <Heading size="lg">Frontend for Research Gap Detection</Heading>
      <Text>
        Use the Search page to query OpenAlex/arXiv and inspect deduplication and filtering
        metrics from the backend.
      </Text>
    </Stack>
  );
}
