import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { NavLink, Link as RouterLink, useNavigate } from "react-router-dom";
import { LogOut, Telescope } from "lucide-react";
import { useAuth } from "@/auth/authContext";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/search", label: "Search" },
  { to: "/jobs", label: "Jobs" },
  { to: "/gaps", label: "Gaps" },
];

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

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

        <Flex align="center" gap={3}>
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

          <Box w="1px" h={6} bg="border" />

          {isAuthenticated ? (
            <Flex align="center" gap={3}>
              {user ? (
                <Text fontSize="sm" color="fg.muted">
                  {user.username}
                </Text>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                colorPalette="gray"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign out
              </Button>
            </Flex>
          ) : (
            <Button asChild size="sm" colorPalette="brand">
              <RouterLink to="/login">Sign in</RouterLink>
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
