import type { PropsWithChildren } from "react";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { Telescope } from "lucide-react";

type AuthCardProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

/** Centered full-page shell used by the login and register screens. */
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <Flex minH="100vh" align="center" justify="center" px={4}>
      <Box w="full" maxW="sm">
        <Flex direction="column" align="center" gap={2.5} mb={6}>
          <Flex
            align="center"
            justify="center"
            boxSize={11}
            borderRadius="lg"
            bg="brand.solid"
            color="brand.contrast"
          >
            <Telescope size={24} strokeWidth={2.2} />
          </Flex>
          <Heading size="lg" letterSpacing="-0.01em" textAlign="center">
            {title}
          </Heading>
          <Text color="fg.muted" fontSize="sm" textAlign="center">
            {subtitle}
          </Text>
        </Flex>

        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="xl"
          bg="bg.panel"
          p={6}
        >
          <Stack gap={4}>{children}</Stack>
        </Box>
      </Box>
    </Flex>
  );
}
