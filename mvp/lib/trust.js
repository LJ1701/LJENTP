import { lookup } from "node:dns/promises";
import net from "node:net";

// Trust helpers (supabase/013_trust.sql has the database side).

// Free email providers. A confirmation from one is labelled "personal email"; an employer must post a role
// from a work email, not one of these. Keep in step with is_personal_email_domain() in 013_trust.sql.
const PERSONAL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com", "hotmail.com", "hotmail.co.uk", "outlook.com",
  "live.com", "msn.com", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "gmx.de",
  "gmx.net", "mail.com", "yandex.com", "yandex.ru", "qq.com", "163.com", "126.com", "zoho.com", "web.de", "libero.it",
  "orange.fr", "free.fr", "wanadoo.fr", "laposte.net", "t-online.de", "btinternet.com", "sky.com", "virginmedia.com",
  "comcast.net", "att.net", "verizon.net", "sbcglobal.net", "bellsouth.net", "rediffmail.com", "naver.com", "yahoo.co.jp"
]);

export const emailDomain = (email) => String(email || "").trim().toLowerCase().split("@")[1] || "";
export function isPersonalDomain(domain) {
  const d = String(domain || "").toLowerCase();
  return PERSONAL.has(d) || /^(yahoo|hotmail|outlook)\./.test(d);
}

// Private and local addresses the server must never fetch (so a "link" can't be used to reach internal systems).
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:");
}

async function safeUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (!["http:", "https:"].includes(u.protocol) || u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  if (!host.includes(".") || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || net.isIP(host)) return null;
  try {
    const addrs = await lookup(host, { all: true });
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) return null;
  } catch { return null; }
  return u;
}

// Fetches a public page (following up to 3 redirects, each checked) and says whether `code` appears in it.
// Reads at most 3 MB and gives up after 8 seconds. Returns "found", "missing" or "unreachable".
export async function pageContains(url, code) {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    const u = await safeUrl(current);
    if (!u) return "unreachable";
    let res;
    try {
      res = await fetch(u, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: { "user-agent": "Mozilla/5.0 (compatible; TheAssistLinkCheck/1.0)", accept: "text/html,*/*" }
      });
    } catch { return "unreachable"; }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location"), u).toString();
      continue;
    }
    if (!res.ok || !res.body) return "unreachable";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      text += decoder.decode(value, { stream: true });
      if (text.includes(code)) { reader.cancel().catch(() => {}); return "found"; }
      if (size > 3 * 1024 * 1024) { reader.cancel().catch(() => {}); break; }
    }
    return text.includes(code) ? "found" : "missing";
  }
  return "unreachable";
}
