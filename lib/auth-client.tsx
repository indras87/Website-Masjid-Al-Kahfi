"use client";

import { createAuthClient } from "better-auth/react";
import { useState, useEffect, ReactNode } from "react";

// Resolve base URL for better-auth
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

// Extract hooks and utilities from authClient
export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
