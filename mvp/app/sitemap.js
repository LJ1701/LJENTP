import { CAREER_SLUGS } from "@/lib/careers";

// Tells search engines which public pages exist. Passports and proof links are private or opt-in, so they're left out.
const BASE = "https://ljsportmind-mvp.vercel.app";
export default function sitemap() {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/careers`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...CAREER_SLUGS.map((s) => ({ url: `${BASE}/careers/${s}`, lastModified: now, changeFrequency: "daily", priority: 0.8 })),
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.5 }
  ];
}
