# Design: The Assist

*Updated 18 Nov 2026. Every value below comes from the live app's style file, `mvp/app/globals.css` on GitHub `main` (deployed at https://theassist.vercel.app), plus the fonts in `mvp/app/layout.js`. If the app changes, update this file to match it, not the other way round. LJ LIVE has its own look and is not covered here.*


## 1. The idea

**Clean, trustworthy, earned.** The app's own rule, written at the top of its style file:
- white = clean and open;
- navy = trust (headings, buttons, links);
- green = confirmed or success **only**;
- gold = achievement (one headline word and the logo only);
- red and amber = problems and warnings **only**.

## 2. Core colours (the app's tokens)

| Token | Hex | Job | Where the app uses it |
|---|---|---|---|
| `--bg` | `#f6f7f9` | Page background | Every page |
| `--card` | `#ffffff` | Cards | Cards, panels, inputs |
| `--card-2` | `#fafbfc` | Second-level surface | Inner boxes, loading skeletons |
| `--text` | `#1b2333` | Main text | Body text, headings |
| `--muted` | `#5b6472` | Secondary text | Hints, sources, captions |
| `--accent` | `#1f4e8c` | Action (blue) | Buttons, links, focus, Goldie's border |
| `--navy` | `#16213a` | Trust (deep navy) | Logo circle, story avatars, dark accents |
| `--gold-ink` | `#a8741f` | Achievement | `.gold-text` (one headline word), story quote bar, "referral" step dot |
| `--ok` | `#1e7a44` | Confirmed / success | "✓ Confirmed", proof found, saved |
| `--ok-bg` | `#e7f5ec` | Background for success | Success notes |
| `--bad` | `#b42318` | Error / gap | Errors, the fit check's "gap" icon |
| `--warn` | `#b54708` | Warning | "Claimed, not proven" icon, test banner |
| `--border` | `#e3e6eb` | Lines | Card borders |
| `--border-soft` | `#eceef2` | Faint lines | Dividers |
| `--tint` | `rgba(31, 78, 140, 0.06)` | Light blue wash | Selected and hover states |

**Naming quirk:** the token called `--gold` is navy (`#16213a`), left over from the old dark theme. For real gold, use `--gold-ink`.

## 3. Supporting colours (used once or twice, each with one job)

| Hex | Paired with | Job | Where |
|---|---|---|---|
| `#b7dfc5` | `--ok-bg` | Green border | "Found in your achievements", pending notes |
| `#fdecea` | `--bad` | Red background | Fit-check gap icon |
| `#eaf1fb` / `#d3e2f4` | — | Blue background and border | The user's own chat messages (Goldie) |
| `#fbf6ec` / `#efe2c6` | — | Warm gold background and border | The big quote on a Story page |
| `#fbf3e2` | — | Warm gold background | Goldie's "cheer" message |
| `#eef1f5` | — | Shimmer | Job list loading skeleton |
| `#ff4d4d` | — | "Live" dot | The pulsing live-jobs dot only |
| `rgba(31, 78, 140, 0.07–0.18)` | — | Blue glows and rings | Buttons on hover, the hero rings |
| `rgba(16, 24, 40, 0.05)` / `0.12` | — | Shadows | Cards (`--shadow`), Goldie |

**Logo gold gradient** (logo only): `#e9c77b` → `#c9974a` → `#9c6f2f`, top to bottom.

**Rules:**
- **At most one gold element per screen,** besides the logo.
- **Green means proven.** If something isn't confirmed, it isn't green.
- **Red and amber only for problems.** Never use them for decoration.
- **Keep body text contrast at WCAG AA** (4.5:1). `#5b6472` on `#f6f7f9` passes; don't go lighter.

## 4. Fonts

| Role | Font | Weights loaded | Variable | Where |
|---|---|---|---|---|
| **Display** | Space Grotesk | 600, 700 | `--font-display` | h1–h3, brand name, card titles, numbers |
| **Body** | Inter | all (variable font) | `--font-body` | Everything else |

**How the fonts load:**
- **Fallback:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`.
- **Character sets:** both fonts load Latin and Latin Extended, so the 10 languages display correctly.
- **Single HTML files** (like the pitch deck) load the same fonts from Google Fonts.

## 5. Type sizes

**App (as built):**

| Element | Size |
|---|---|
| Page title (h1) | 30–44 px, grows with the screen |
| Section and card titles | 17–20 px |
| Body | 16 px, line height 1.55 |
| Small text | 13–14 px, the most common sizes in the app |
| Tiny labels | 12 px (badges and chips only) |

**Slides (designed at 1920 × 1080):**
- **No text smaller than 30 pt (40 px),** including footers and sources.
- **Title:** 84 px.
- **Big numbers:** 110 px.
- **Card titles:** 48 px.
- **Body:** 40 px.
- If it doesn't fit, cut words; don't shrink the text.

## 6. Shape and layout

**Corner radius:**

| Radius | Used for |
|---|---|
| `999px` | Pills: buttons, chips, tags |
| `14px` | Cards (`--radius`) |
| `12px` | Notes and boxes |
| `10px` | Inputs |
| `20px` | Goldie's panel |
| 28 px | Slides only |

**Other layout values:**
- **Shadow:** `0 1px 2px rgba(16, 24, 40, 0.05)`, almost flat.
- **Width:** the page is 960 px, and the reading column is 760 px.
- **Phone gutter:** 16 px, with no sideways scrolling.

**Slides:**
- 120 px side margins.
- **Each slide has:**
  - a label at the top;
  - one message as the title;
  - at most three blocks underneath;
  - a footer for the source and the slide number.
- **All slides are light, like the app.** Navy appears only in the logo. Quotes use the Story quote box (`#fbf6ec`, a `#efe2c6` border and a gold bar).

## 7. The logo

- **The design:** a navy circle with a gold-gradient ring, a white **A**, and a gold curved pass as the crossbar ending in an arrowhead. It's the assist.
- **Minimum size:** 32 px.
- **Don't** stretch it, recolour it, or put it on a busy background.

## 8. Words (part of the design)

| Say | Don't say | Why |
|---|---|---|
| "Confirmed by [name]" | "Verified" | We don't check it ourselves (yet) |
| "Added by [user]" | "Proven" | For files and links nobody confirmed |
| "Proof" | "Certification", "badge" | Certification was dropped |
| "Jobs abroad" (an expansion) | "Focus on international candidates" | International is an expansion |

- **Never write "AI-powered"** as a selling point.
- **Tagline:** "Every career starts with an assist."
- **Second line:** "Show what you've done. See how others got in."

## 9. Checklist before shipping anything

- [ ] Colours come from sections 2–3, and each is used only for its job.
- [ ] At most one gold element per screen, besides the logo.
- [ ] Fonts are Space Grotesk (600/700) and Inter only.
- [ ] App text is at least 12 px (badges only), 13–14 px for small print. Slide text is at least 40 px.
- [ ] It works on a phone with no sideways scrolling.
- [ ] It uses only words from section 8's "Say" column.
