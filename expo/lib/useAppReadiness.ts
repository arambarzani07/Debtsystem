import { useEffect } from "react";
import { Platform } from "react-native";

type EnvKey =
  | "EXPO_PUBLIC_RORK_DB_ENDPOINT"
  | "EXPO_PUBLIC_RORK_DB_NAMESPACE"
  | "EXPO_PUBLIC_RORK_DB_TOKEN"
  | "EXPO_PUBLIC_RORK_API_BASE_URL"
  | "EXPO_PUBLIC_TOOLKIT_URL"
  | "EXPO_PUBLIC_PROJECT_ID"
  | "EXPO_PUBLIC_TEAM_ID";

const ENV: Record<EnvKey, string | undefined> = {
  EXPO_PUBLIC_RORK_DB_ENDPOINT: process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT,
  EXPO_PUBLIC_RORK_DB_NAMESPACE: process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE,
  EXPO_PUBLIC_RORK_DB_TOKEN: process.env.EXPO_PUBLIC_RORK_DB_TOKEN,
  EXPO_PUBLIC_RORK_API_BASE_URL: process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
  EXPO_PUBLIC_TOOLKIT_URL: process.env.EXPO_PUBLIC_TOOLKIT_URL,
  EXPO_PUBLIC_PROJECT_ID: process.env.EXPO_PUBLIC_PROJECT_ID,
  EXPO_PUBLIC_TEAM_ID: process.env.EXPO_PUBLIC_TEAM_ID,
};

function safeEnv(key: EnvKey): string | undefined {
  const v = ENV[key];
  if (typeof v === "string" && v.length > 0) return v;
  return undefined;
}

export function useAppReadiness() {
  useEffect(() => {
    const required: EnvKey[] = [
      "EXPO_PUBLIC_RORK_DB_ENDPOINT",
      "EXPO_PUBLIC_RORK_DB_NAMESPACE",
      "EXPO_PUBLIC_RORK_DB_TOKEN",
    ];

    const missing = required.filter((k) => !safeEnv(k));

    console.log("[App] Ready check start", {
      platform: Platform.OS,
      isWeb: Platform.OS === "web",
      requiredEnvMissing: missing,
      projectId: safeEnv("EXPO_PUBLIC_PROJECT_ID") ? "(set)" : "(missing)",
      teamId: safeEnv("EXPO_PUBLIC_TEAM_ID") ? "(set)" : "(missing)",
    });

    if (missing.length > 0) {
      console.warn("[App] Missing required env vars", missing);
    }

    console.log("[App] System ready ✅ / سیستەمەکە ئامادەیە");
  }, []);
}
