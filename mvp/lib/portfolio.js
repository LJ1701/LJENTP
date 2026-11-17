// Portfolio files live in a private Storage bucket, so pages make short-lived links to open them.
// Works with the owner's session (their own files) or signed out (files of a profile whose public link is on).
export async function signedUrls(supabase, items) {
  const paths = (items || []).filter((i) => i.kind === "file" && i.file_path).map((i) => i.file_path);
  if (!paths.length) return {};
  const { data, error } = await supabase.storage.from("portfolio").createSignedUrls(paths, 60 * 60);
  if (error || !data) return {};
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
}
