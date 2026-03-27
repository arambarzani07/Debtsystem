import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import healthCheckRoute from "./routes/health/check/route";
import { backupSaveProcedure } from "./routes/backup/save/route";
import { backupRestoreProcedure } from "./routes/backup/restore/route";

export const appRouter = createTRPCRouter({
  health: createTRPCRouter({
    check: healthCheckRoute,
  }),
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  backup: createTRPCRouter({
    save: backupSaveProcedure,
    restore: backupRestoreProcedure,
  }),
});

export type AppRouter = typeof appRouter;
