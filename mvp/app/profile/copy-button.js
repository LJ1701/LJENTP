"use client";
import { useState } from "react";

export default function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000); } catch { setDone(false); }
    }}>{done ? "Copied ✓" : "Copy my link"}</button>
  );
}
