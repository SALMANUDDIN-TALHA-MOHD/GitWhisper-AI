import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// Single unified client used by ALL pages (home, login, dashboard, repo)
// @supabase/ssr's createBrowserClient stores the session in cookies,
// which are shared between client and server — no mismatch possible.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
