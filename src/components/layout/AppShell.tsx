import type { PropsWithChildren } from "react";
import { Box, Container, Flex } from "@chakra-ui/react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useIngestionNotifications } from "@/ingestion/useIngestionNotifications";

export function AppShell({ children }: PropsWithChildren) {
  useIngestionNotifications();
  return (
    <Box minH="100vh">
      <Navbar />
      <Container maxW="7xl" py={6}>
        <Flex gap={6} align="flex-start">
          <Sidebar />
          <Box flex="1">{children}</Box>
        </Flex>
      </Container>
      <Toaster />
    </Box>
  );
}
