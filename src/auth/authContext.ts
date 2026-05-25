import { createContext, useContext } from "react";
import type { User } from "@/api/generated";

export type RegisterInput = {
  username: string;
  email?: string;
  password: string;
};

export type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  /** True while the initial "who am I" check is resolving. */
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
