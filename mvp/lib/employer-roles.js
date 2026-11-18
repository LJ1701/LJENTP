import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

// Roles employers posted on The Assist (approved by the owner), newest first. Empty until
// supabase/009_employer_roles.sql has been run. Contact details are never returned.
export const approvedRoles = cache(async () => {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("approved_roles");
  return error || !data ? [] : data;
});

// Where a posting lives, from its web address: the label on the "Apply on …" button.
export function sourceOf(url) {
  let host = "";
  try { host = new URL(url).hostname.toLowerCase(); } catch { return "other"; }
  if (/(^|\.)linkedin\.com$/.test(host)) return "linkedin";
  if (/(^|\.)indeed\.[a-z.]+$/.test(host)) return "indeed";
  if (/(^|\.)teamworkonline\.com$/.test(host)) return "teamwork";
  return "other";
}
