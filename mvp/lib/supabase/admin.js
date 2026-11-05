import { createClient } from "@supabase/supabase-js";

// Supabase with the secret service-role key: SERVER ONLY. It skips row level security, so it's used just for
// billing (counting AI answers, applying payments, programs) after the code has checked who the user is.
export function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
