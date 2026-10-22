import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase on the server, acting as the signed-in user (session read from cookies).
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a server component, where cookies are read-only; middleware refreshes them.
        }
      }
    }
  });
}
