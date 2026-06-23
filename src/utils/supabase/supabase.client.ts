import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let browserClient: SupabaseClient<Database> | undefined

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}