// TRPC context
import { SupabaseClient, User } from "@supabase/supabase-js";

import { createServerClient } from "@/utils/supabase/supabase.server";

/** When true, app uses dev/test data (clubs with is_dev=true). When false, production data only. */
function getUseDevData(): boolean {
  return JSON.parse(process.env.USE_DEV_DATA ?? "false");
}

export const createContext = async () => {
  const supabase = await createServerClient();
  const res = await supabase.auth.getUser();
  const { user } = res.data;

  return { supabase, user, is_dev: getUseDevData() };
};

export type TRPCContext = {
  supabase: SupabaseClient;
  user: User | null;
  /** When true, select only clubs with is_dev=true; on insert set is_dev=true. */
  is_dev: boolean;
};

// TODO: uncomment when supabase improve the performance of the createClient typescript types
// export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
