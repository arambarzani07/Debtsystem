import { publicProcedure } from "@/backend/trpc/create-context";

export default publicProcedure.query(() => {
  return {
    status: "ok",
    message: "Backend is working correctly",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  };
});
