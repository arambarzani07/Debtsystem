// app/_layout.tsx
import React, { PropsWithChildren, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";

import { useAppReadiness } from "@/lib/useAppReadiness";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";

import ErrorBoundary from "@/components/ErrorBoundary";
import { DebtContext } from "@/contexts/DebtContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import { SecurityContext } from "@/contexts/SecurityContext";
import { LanguageContext } from "@/contexts/LanguageContext";
import { NotificationContext } from "@/contexts/NotificationContext";
import { AuthContext } from "@/contexts/AuthContext";
import { MarketContext } from "@/contexts/MarketContext";
import { StoryContext } from "@/contexts/StoryContext";
import { PromiseContext } from "@/contexts/PromiseContext";
import { StoreContext } from "@/contexts/StoreContext";
import { FeedbackContext } from "@/contexts/FeedbackContext";
import { PaymentGatewayContext } from "@/contexts/PaymentGatewayContext";

/**
 * Root wrapper:
 * - Web: plain View (no gesture-handler)
 * - Native: GestureHandlerRootView (lazy required)
 */
function AppRootView({ children }: PropsWithChildren) {
  if (Platform.OS === "web") {
    return <View style={styles.container}>{children}</View>;
  }

  // Native-only (lazy require to avoid web bundling issues)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { GestureHandlerRootView } = require("react-native-gesture-handler");
  return <GestureHandlerRootView style={styles.container}>{children}</GestureHandlerRootView>;
}

/**
 * Navigation stack (Expo Router)
 */
function RootStack() {
  return (
    <Stack screenOptions={{ headerBackTitle: "گەڕانەوە" }}>
      {/* Core */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="market-request" options={{ headerShown: false }} />

      {/* Owner/Admin */}
      <Stack.Screen name="owner-dashboard" options={{ headerShown: true, title: "داشبۆرد" }} />
      <Stack.Screen name="add-debtor" options={{ presentation: "modal", title: "زیادکردنی قەرزدار" }} />
      <Stack.Screen name="debtor/[id]" options={{ title: "زانیاری قەرزدار" }} />

      {/* Settings */}
      <Stack.Screen name="settings" options={{ title: "ڕێکخستنەکان" }} />
      <Stack.Screen name="profile" options={{ title: "پرۆفایل" }} />
      <Stack.Screen name="notifications" options={{ title: "ئاگادارکردنەوەکان" }} />
      <Stack.Screen name="transactions" options={{ title: "مامەلەکان" }} />
      <Stack.Screen name="statistics" options={{ title: "ئامارەکان" }} />
      <Stack.Screen name="telegram-settings" options={{ title: "ڕێکخستنەکانی تێلێگرام" }} />
      <Stack.Screen name="manage-chat-ids" options={{ title: "بەڕێوەبردنی چاتەکان" }} />

      {/* Customer */}
      <Stack.Screen name="customer-login" options={{ headerShown: false }} />
      <Stack.Screen name="customer-debt-view/[id]" options={{ title: "بینینی قەرز" }} />

      {/* Info */}
      <Stack.Screen name="about" options={{ title: "دەربارە" }} />
      <Stack.Screen name="help-faq" options={{ title: "یارمەتی" }} />
      <Stack.Screen name="contact-support" options={{ title: "پەیوەندی" }} />
      <Stack.Screen name="whats-new" options={{ title: "نوێکاری" }} />
      <Stack.Screen name="privacy-policy" options={{ title: "سیاسەتی تایبەتمەندی" }} />
      <Stack.Screen name="terms-of-service" options={{ title: "مەرجەکانی خزمەتگوزاری" }} />

      {/* Extras */}
      <Stack.Screen name="social-comparison" options={{ title: "بەراوردی کۆمەڵایەتی" }} />
      <Stack.Screen name="debt-gamification" options={{ title: "یاری قەرز" }} />
      <Stack.Screen name="smart-collection" options={{ title: "کۆکردنەوەی زیرەک" }} />
      <Stack.Screen name="smart-debt-triage" options={{ title: "جیاکردنەوەی قەرز" }} />
      <Stack.Screen name="hourly-backup-settings" options={{ title: "باکئەپ" }} />

      {/* ✅ Dynamic routes MUST use [param] */}
    {/* Dynamic routes */}
     <Stack.Screen
       name="invitation/[marketId]"
       options={{ headerShown: false }}
/>

      <Stack.Screen name="invitation/[marketId]/[debtorId]"
                    options={{ headerShown: false }}
/>

      {/* Not found */}
      <Stack.Screen name="+not-found" options={{ title: "نەدۆزرایەوە" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useAppReadiness();

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 0,
            staleTime: 60_000,
            gcTime: 300_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
            networkMode: "offlineFirst",
          },
          mutations: {
            retry: 0,
            networkMode: "offlineFirst",
          },
        },
      }),
    []
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <LanguageContext>
            <ThemeContext>
              <SecurityContext>
                <NotificationContext>
                  <AuthContext>
                    <MarketContext>
                      <StoryContext>
                        <PromiseContext>
                          <StoreContext>
                            <FeedbackContext>
                              <PaymentGatewayContext>
                                <DebtContext>
                                  <AppRootView>
                                    <RootStack />
                                  </AppRootView>
                                </DebtContext>
                              </PaymentGatewayContext>
                            </FeedbackContext>
                          </StoreContext>
                        </PromiseContext>
                      </StoryContext>
                    </MarketContext>
                  </AuthContext>
                </NotificationContext>
              </SecurityContext>
            </ThemeContext>
          </LanguageContext>
        </trpc.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
