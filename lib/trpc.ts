import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const sanitizeBaseUrl = (value: string) => {
  if (!value) {
    return "";
  }

  let sanitized = value.trim();

  while (sanitized.endsWith("/")) {
    sanitized = sanitized.slice(0, -1);
  }

  if (sanitized.toLowerCase().endsWith("/api")) {
    sanitized = sanitized.slice(0, -4);
  }

  return sanitized;
};

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    const normalized = sanitizeBaseUrl(process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    console.log("Using API base URL:", normalized || "<empty>");
    return normalized;
  }

  console.log("⚠️ EXPO_PUBLIC_RORK_API_BASE_URL not set, API calls will not work");
  return "";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (url, options) => {
        const baseUrl = getBaseUrl();
        
        if (!baseUrl) {
          console.log('ℹ️ Backend not configured - using local storage only');
          return new Response(
            JSON.stringify({ error: { message: 'Backend not configured', code: 'BACKEND_NOT_CONFIGURED' } }),
            { status: 503, headers: { 'content-type': 'application/json' } }
          );
        }
        
        const maxRetries = 3;
        let retryCount = 0;
        let delay = 1000;
        
        while (retryCount <= maxRetries) {
          try {
            const response = await fetch(url, options);
            
            if (response.status === 429) {
              if (retryCount < maxRetries) {
                console.warn(`⚠️ Rate limit hit (429), retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
                retryCount++;
                continue;
              } else {
                console.error('⚠️ Rate limit exceeded after retries');
                throw new Error('Rate limit exceeded. Please try again later.');
              }
            }
            
            if (!response.ok) {
              if (response.status === 404) {
                console.warn('⚠️ Backend endpoint not found (404)');
                throw new Error('Backend endpoint not available');
              }
              if (response.status === 403) {
                console.warn('⚠️ Backend access forbidden (403) - backend may not be deployed or configured correctly');
                throw new Error('Backend not available');
              }
              console.error('tRPC HTTP error:', response.status, response.statusText);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('application/json')) {
              console.warn('⚠️ Invalid content type:', contentType);
              throw new Error('Backend not available - invalid response');
            }
            
            return response;
          } catch (error) {
            if (retryCount >= maxRetries || !(error instanceof Error && error.message.includes('Rate limit'))) {
              console.warn('⚠️ tRPC fetch error:', error);
              throw error;
            }
          }
        }
        
        throw new Error('Request failed after retries');
      },
    }),
  ],
});
