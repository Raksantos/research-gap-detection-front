import { useState } from "react";
import type { FormEvent } from "react";
import { Box, Button, chakra, Input, Text } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/authContext";
import { authErrorMessage } from "@/auth/authError";
import { AuthCard } from "@/components/auth/AuthCard";

export function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim() || undefined,
        password,
      });
      // Log straight in so the user lands in the app, not back at the form.
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, "Could not create the account."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Start mapping research gaps">
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
            <chakra.label htmlFor="email" fontSize="sm" fontWeight="500">
              Email{" "}
              <Text as="span" color="fg.subtle">
                (optional)
              </Text>
            </chakra.label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              autoComplete="new-password"
              mt={1}
            />
            <Text color="fg.subtle" fontSize="xs" mt={1}>
              At least 8 characters.
            </Text>
          </Box>

          {error ? (
            <Text color="red.300" fontSize="sm">
              {error}
            </Text>
          ) : null}

          <Button
            type="submit"
            colorPalette="brand"
            disabled={submitting || !username.trim() || password.length < 8}
          >
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </Box>
      </form>

      <Text fontSize="sm" color="fg.muted" textAlign="center">
        Already have an account?{" "}
        <Box asChild color="brand.fg" fontWeight="500">
          <RouterLink to="/login">Sign in</RouterLink>
        </Box>
      </Text>
    </AuthCard>
  );
}
