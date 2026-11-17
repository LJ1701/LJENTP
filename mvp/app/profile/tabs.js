"use client";
import { useEffect } from "react";

// Switches the Passport's tabs in the browser without reloading. Every tab panel is already on the page
// (hidden ones carry the `hidden` attribute), so links still work without JavaScript, and Goldie's tour
// and "See jobs" buttons can open the right tab:
//   window.dispatchEvent(new CustomEvent("passport:show", { detail: { tab: "jobs" } }))
// A job search ("goldie:search") opens the Jobs tab on its own.
const TABS = ["profile", "proof", "path", "jobs", "share"];

export function showTab(tab, push = true) {
  if (!TABS.includes(tab)) return;
  // One-off messages ("Saved", errors) belong to the tab they came from.
  document.querySelectorAll(".flash").forEach((el) => { el.hidden = true; });
  document.querySelectorAll("[data-tab-panel]").forEach((el) => { el.hidden = el.dataset.tabPanel !== tab; });
  document.querySelectorAll("[data-tab-link]").forEach((el) => {
    const on = el.dataset.tabLink === tab;
    el.classList.toggle("on", on);
    if (on) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current");
  });
  if (push) {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") !== tab) {
      url.searchParams.set("tab", tab);
      // Drop one-off messages (saved, error...) so they don't reappear on Back.
      ["saved", "error", "ok", "added", "invited"].forEach((k) => url.searchParams.delete(k));
      url.hash = "";
      window.history.pushState({ tab }, "", url);
    }
  }
}

export default function Tabs({ fallback = "proof" }) {
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.("[data-tab-link]");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      showTab(a.dataset.tabLink);
      document.querySelector(".page-head")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const onShow = (e) => showTab(e.detail?.tab);
    const onSearch = () => showTab("jobs");
    const onPop = () => showTab(new URL(window.location.href).searchParams.get("tab") || fallback, false);
    document.addEventListener("click", onClick);
    window.addEventListener("passport:show", onShow);
    window.addEventListener("goldie:search", onSearch);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("passport:show", onShow);
      window.removeEventListener("goldie:search", onSearch);
      window.removeEventListener("popstate", onPop);
    };
  }, [fallback]);
  return null;
}
