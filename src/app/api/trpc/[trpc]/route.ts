import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/trpc/trpc.router";
import { createContext } from "@/trpc/trpc.context";

const handler = (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
    req,
  });
};

export { handler as GET, handler as POST };
