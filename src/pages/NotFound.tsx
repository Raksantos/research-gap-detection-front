import { Heading, Text } from "@chakra-ui/react";

export function NotFoundPage() {
  return (
    <>
      <Heading size="lg" mb={2}>
        Page not found
      </Heading>
      <Text>The requested route does not exist.</Text>
    </>
  );
}
