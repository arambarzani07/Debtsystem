/* eslint-disable import/no-unresolved */
// @ts-ignore
import { Hono } from "hono";
// @ts-ignore
import { trpcServer } from "@hono/trpc-server";
/* eslint-enable import/no-unresolved */
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", async (c: any, next: any) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  await next();
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/", (c: any) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
