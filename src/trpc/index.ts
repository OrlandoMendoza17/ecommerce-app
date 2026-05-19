import { createServerClient } from "@/utils/supabase/supabase.server";
import { initTRPC, TRPCError } from "@trpc/server";
import { createContext } from "./trpc.context";
import { mapStatusCodeToTRPCCode } from "./trpc.utils";
import { AxiosError } from "axios";

const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create({
  errorFormatter(opts) {
    const { shape, error } = opts;
    if (error.cause instanceof AxiosError) {
      const response = error.cause.response;
      if (!response) return shape;
      const { status, statusText, data } = response;
      const code = mapStatusCodeToTRPCCode(status);
      return { message: statusText, code, data };
    }
    return shape;
  }
});

const setSupabaseMiddleWare = t.middleware(async options => {
  const { next } = options;
  const supabase = await createServerClient();
  return next({ ctx: { supabase } });
});

const isDashboardUserMiddleware = t.middleware(async options => {
  const { next, path: message } = options;
  const supabase = await createServerClient();

  const res = await supabase.auth.getUser();
  const { user } = res.data;
  const cause = "Invalid session";
  const unauthorized = new TRPCError({ code: "UNAUTHORIZED", cause, message });
  if (!user) throw unauthorized;
  return next({ ctx: { user } });
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

// Doesn't require authentication or authorization
export const publicProcedure = t.procedure.use(setSupabaseMiddleWare);

// Only Dashboard users can access this procedure
export const protectedProcedure = t.procedure
  .use(isDashboardUserMiddleware);