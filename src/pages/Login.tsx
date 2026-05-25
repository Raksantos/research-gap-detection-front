import { useState } from "react";
import type { FormEvent } from "react";
import { Box, Button, chakra, Input, Text } from "@chakra-ui/react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/authContext";
import { authErrorMessage } from "@/auth/authError";
import { AuthCard } from "@/components/auth/AuthCard";

type LocationState = { from?: { pathname: string } } | null;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as LocationState)?.from?.pathname ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, "Could not sign in. Check your credentials."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your research workspace">
      <form onSubmit={handleSubmit}>
        <Box display="flex" flexDirection="column" gap={4}>
          <Box>
            <chakra.label htmlFor="username" fontSize="sm" fontWeight="500">
              Username
            </chakra.label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              mt={1}
            />
          </Box>

          <Box>
            <chakra.label htmlFor="password" fontSize="sm" fontWeight="500">
              Password
            </chakra.label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              mt={1}
            />
          </Box>

          {error ? (
            <Text color="red.300" fontSize="sm">
              {error}
            </Text>
          ) : null}

          <Button
            type="submit"
            colorPalette="brand"
            disabled={submitting || !username.trim() || !password}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </Box>
      </form>

      <Text fontSize="sm" color="fg.muted" textAlign="center">
        No account?{" "}
        <Box asChild color="brand.fg" fontWeight="500">
          <RouterLink to="/register">Create one</RouterLink>
        </Box>
      </Text>
    </AuthCard>
  );
}
