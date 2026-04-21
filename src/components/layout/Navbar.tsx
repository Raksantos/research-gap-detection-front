import { Box, Flex, Heading, Link } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/search", label: "Search" },
  { to: "/jobs", label: "Jobs" },
  { to: "/gaps", label: "Gaps" },
];

export function Navbar() {
  return (
    <Box borderBottomWidth="1px" as="header">
      <Flex maxW="7xl" mx="auto" px={6} py={4} align="center" justify="space-between">
        <Heading size="md">Research Gap Detection</Heading>
        <Flex gap={4}>
          {navItems.map((item) => (
            <Link key={item.to} asChild>
              <NavLink to={item.to}>{item.label}</NavLink>
            </Link>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}
