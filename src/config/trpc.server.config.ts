import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";

import "server-only";

import type { AppRouter } from "@/trpc/trpc.router";
import { appRouter } from "@/trpc/trpc.router";
import { buildQueryClient } from "./query.config";
import { createContext } from "@/trpc/trpc.context";
import { createCallerFactory } from "@/trpc";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(buildQueryClient);
const caller = createCallerFactory(appRouter)(createContext);
const helpers = createHydrationHelpers<AppRouter>(caller, getQueryClient);

export const { trpc: trpcServer, HydrateClient } = helpers;

/** Direct server caller for RSC (metadata, notFound, etc.). Not cached in React Query. */
export const getServerCaller = cache(async () => {
  const ctx = await createContext();
  return createCallerFactory(appRouter)(ctx);
});
