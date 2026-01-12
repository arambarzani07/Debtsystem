// lib/trpc.ts
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

/**
 * Backend URL
 * - Web: ❌ disable tRPC
 * - Mobile: ✅ Rork backend
 */
function getBaseUrl(): string | null {
  // 🌐 WEB
  if (Platform.OS === "web") {
    return null;
  }

  // 📱 MOBILE (Rork)
  return "https://www.debtsystemmanager.com/api";
}

const baseUrl = getBaseUrl();

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: baseUrl
    ? [
        httpBatchLink({
          url: `${baseUrl}/trpc`,
          headers() {
            return {
              "Content-Type": "application/json",
            };
          },
        }),
      ]
    : [], // 👈 web = no tRPC calls
});
