// lib/trpc.ts
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

/**
 * ✅ Get backend base URL
 * Works for Web + Mobile
 */
function getBaseUrl(): string {
  // 🌐 WEB (Vercel / Netlify)
  if (Platform.OS === "web") {
    return "https://www.debtsystemmanager.com/api";
  }

  // 📱 MOBILE (Expo / Rork runtime)
  return "https://www.debtsystemmanager.com/api";
}

/**
 * ✅ tRPC Client (safe for Web + Mobile)
 */
export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
          headers: {
            ...(options?.headers ?? {}),
            "Content-Type": "application/json",
          },
        });
      },
    }),
  ],
});
