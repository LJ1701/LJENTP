// Gemini prices in US dollars per 1 million tokens, paid "Standard" tier, copied from Google's pricing page
// (https://ai.google.dev/gemini-api/docs/pricing, which redirects to aistudio.google.com/docs/pricing) on
// 25 Nov 2026. Thinking tokens are billed at the output price ("Output price (including thinking tokens)").
// On the FREE tier both models are "Free of charge" (with daily limits), so these are what the same calls would
// cost once the app moves to the paid tier. Keyed by the model that actually answers (response.modelVersion):
// the app asks for "gemini-3.5-flash", which Google answers with "gemini-3.6-flash" (not listed separately).
export const PRICES_CHECKED = "2026-11-25";
export const PRICES = {
  "gemini-3.6-flash": [
    { until: "2026-12-31", input: 0.75, output: 3.75, cached: 0.075 },
    { from: "2027-01-01", input: 1.5, output: 7.5, cached: 0.075, note: "rise announced on the page; cached price after 1 Jan not stated, assumed unchanged" }
  ],
  "gemini-3.5-flash-lite": [{ input: 0.3, output: 2.5, cached: 0.03 }]
};

// The price that applied on a given date (YYYY-MM-DD) for the model that answered, or null if unknown.
export function priceFor(modelVersion, date = new Date().toISOString().slice(0, 10)) {
  const list = PRICES[modelVersion];
  if (!list) return null;
  return list.find((p) => (!p.until || date <= p.until) && (!p.from || date >= p.from)) || list[list.length - 1];
}

// Dollars for one call: uncached input + cached input + (output + thinking), each at its own price.
export function callCost(row, date) {
  const p = priceFor(row.model_version, date);
  if (!p) return null;
  const cached = row.cached_tokens || 0;
  const fresh = Math.max(0, (row.input_tokens || 0) - cached);
  return (fresh * p.input + cached * p.cached + ((row.output_tokens || 0) + (row.thinking_tokens || 0)) * p.output) / 1e6;
}
