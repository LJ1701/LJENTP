// Search engines may read the public pages; signed-in and payment pages stay out of search results.
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/profile", "/program", "/billing", "/auth"] }],
    sitemap: "https://ljsportmind-mvp.vercel.app/sitemap.xml"
  };
}
