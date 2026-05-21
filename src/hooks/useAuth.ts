"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/supabase.client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setRendered(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, rendered, setUser };
}

