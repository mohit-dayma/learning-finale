"use client";

import { createAuthClient } from "better-auth/react";

// Same-domain app: no baseURL needed. Cookies are httpOnly and
// managed by the server. Nothing auth-related uses localStorage.
export const authClient = createAuthClient({});

export const { signIn, signUp, signOut, useSession } = authClient;
