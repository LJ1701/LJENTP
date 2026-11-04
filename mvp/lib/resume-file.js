import "server-only";
import { inflateRawSync } from "node:zlib";
import { pdfText } from "./gemini";

// Turns an uploaded résumé file into plain text for the Passport's résumé filler.
// Word (.docx) and text files are read here on the server with no AI; PDFs are read by Gemini.
export const MAX_RESUME_BYTES = 4 * 1024 * 1024;

// One file from a .zip (a .docx is a zip of XML files), found through the zip's central directory.
function zipEntry(buf, wanted) {
  let end = buf.length - 22;
  while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) return null;
  let p = buf.readUInt32LE(end + 16);
  for (let i = buf.readUInt16LE(end + 10); i > 0 && p + 46 <= buf.length; i--) {
    if (buf.readUInt32LE(p) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (name === wanted) {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(start, start + size);
      return method === 0 ? data : method === 8 ? inflateRawSync(data) : null;
    }
    p += 46 + nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
  return null;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function docxText(buf) {
  const xml = zipEntry(buf, "word/document.xml");
  if (!xml) return "";
  return xml.toString("utf8")
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br[^>]*\/>|<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => (e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e] ?? m))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Returns { text, via } or { error } where error is a short code the page turns into a message.
export async function resumeFileText(file) {
  if (!file || typeof file.arrayBuffer !== "function" || !file.size) return { error: "empty" };
  if (file.size > MAX_RESUME_BYTES) return { error: "big" };
  const name = String(file.name || "").toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  if (name.endsWith(".txt")) return { text: buf.toString("utf8").slice(0, 12000), via: "file" };
  if (name.endsWith(".docx")) {
    const text = docxText(buf);
    return text ? { text: text.slice(0, 12000), via: "file" } : { error: "unreadable" };
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    if (buf.subarray(0, 5).toString() !== "%PDF-") return { error: "unreadable" };
    const res = await pdfText(buf.toString("base64"));
    return res.error ? res : { text: res.text.slice(0, 12000), via: "ai" };
  }
  return { error: "type" };
}
