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
