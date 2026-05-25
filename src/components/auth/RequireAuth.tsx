import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Flex, Spinner } from "@chakra-ui/react";
import { useAuth } from "@/auth/authContext";

/**
 * Gate for authenticated routes. While the session is being resolved it shows a
 * spinner; once resolved it either renders children or redirects to /login,
 * preserving the attempted location so we can bounce back after login.
 */
export function RequireAuth({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Flex minH="40vh" align="center" justify="center">
        <Spinner size="lg" color="brand.fg" />
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
