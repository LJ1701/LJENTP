import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

// Reads one public proof profile without a session (the page, its link preview and its share image all
// use this). The database function only returns a profile while its owner has the link switched on.
export const getPublicProfile = cache(async (code) => {
  if (!/^[a-z0-9]{10}$/.test(String(code))) return null;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await supabase.rpc("public_profile", { code });
  return (data && data[0]) || null;
});

// The proof the owner attached to their achievements (links, references, numbers, places). Empty until
// supabase/006_proof_items.sql has been run, or while the link is switched off.
export const getPublicProof = cache(async (code) => {
  if (!/^[a-z0-9]{10}$/.test(String(code))) return [];
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("public_proof_items", { code });
  return error ? [] : data || [];
});
