import type { User } from "@supabase/supabase-js";

export interface AuthContextValue {
  user: User | null;
  rendered: boolean;
  setUser: (user: User | null) => void;
}
