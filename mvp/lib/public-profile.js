import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { signedUrls } from "./portfolio";

// Reads one public proof profile without a session (the page, its link preview and its share image all
// use this). The database function only returns a profile while its owner has the link switched on.
export const getPublicProfile = cache(async (code) => {
  if (!/^[a-z0-9]{10}$/.test(String(code))) return null;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await supabase.rpc("public_profile", { code });
  return (data && data[0]) || null;
});


// The owner's portfolio (files, links, references) plus short-lived links to open the files. Empty until
// supabase/006_portfolio.sql has been run, or while the public link is switched off.
export const getPublicPortfolio = cache(async (code) => {
  if (!/^[a-z0-9]{10}$/.test(String(code))) return { items: [], urls: {} };
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("public_portfolio", { code });
  if (error || !data) return { items: [], urls: {} };
  return { items: data, urls: await signedUrls(supabase, data) };
});

// Trust badges for one public profile: email confirmed, school email, LinkedIn connected.
// Empty until supabase/013_trust.sql has been run.
export const getPublicTrust = cache(async (code) => {
  if (!/^[a-z0-9]{10}$/.test(String(code))) return null;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("public_trust", { code });
  return error || !data ? null : data[0] || null;
});
