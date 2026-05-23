import { Box, Flex, Heading } from "@chakra-ui/react";
import { NavLink, Link as RouterLink } from "react-router-dom";
import { Telescope } from "lucide-react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/search", label: "Search" },
  { to: "/jobs", label: "Jobs" },
  { to: "/gaps", label: "Gaps" },
];

export function Navbar() {
  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex="docked"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.panel"
    >
      <Flex
        maxW="7xl"
        mx="auto"
        px={6}
        py={3}
        align="center"
        justify="space-between"
        gap={4}
      >
        <Flex asChild align="center" gap={2.5}>
          <RouterLink to="/">
            <Flex
              align="center"
              justify="center"
              boxSize={9}
              borderRadius="lg"
              bg="brand.solid"
              color="brand.contrast"
            >
              <Telescope size={20} strokeWidth={2.2} />
            </Flex>
            <Heading size="md" letterSpacing="-0.01em">
              Research Gap Detection
            </Heading>
          </RouterLink>
        </Flex>

        <Flex as="nav" gap={1}>
          {navItems.map((item) => (
            <Box
              key={item.to}
              asChild
              px={3}
              py={2}
              borderRadius="md"
              fontSize="sm"
              fontWeight="500"
              color="fg.muted"
              transition="color .15s ease, background .15s ease"
              _hover={{ color: "fg", bg: "bg.muted" }}
              css={{ "&.active": { color: "brand.fg", bg: "brand.subtle" } }}
            >
              <NavLink to={item.to} end={item.to === "/"}>
                {item.label}
              </NavLink>
            </Box>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}
