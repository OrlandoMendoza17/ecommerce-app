import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Crea un cliente de Supabase con service_role key
 * Este cliente bypass RLS (Row Level Security) y debe usarse solo en el servidor
 * 
 * ⚠️ IMPORTANTE: Nunca expongas el service_role key en el cliente
 * Solo úsalo en API routes o server-side code
 */
export const createServiceClient = () => {
  if (typeof window !== "undefined") {
    throw new Error("Service client cannot be used in the browser");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Please add it to your .env.local");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

