---
name: update-research
description: After new LJSportMind interviews are added to interviews/, recalculate the market size and decision scores, rewrite the interview synthesis, and argue against the idea using only interview evidence. Use when the user says "run update-research" or adds interviews.
---

# update-research

Everything here is private research (`interviews/`, `research/`); never commit or deploy it. These are notes for the user; their report must be written in their own words.

1. **Check the inputs.** Read `interviews/tally.csv` and list any `person-N.md` files that have no matching row, or rows with no file. Ask the user about mismatches; never invent answers.
2. **Recalculate.** From the project root run `node research/model/update.mjs`. It rewrites `research/market-sizing.md` and `research/decision-scores.md`. Report the old and new year-3 revenue and which assumptions interviews replaced.
3. **Synthesise.** Read every `interviews/person-*.md` and write `research/interview-synthesis.md`:
   1. Recurring pains, ranked by how often and how intensely they came up, with verbatim quotes.
   2. Current workarounds.
   3. Evidence of willingness to pay: money or time already spent.
   4. Statements that **contradict** the idea, quoted exactly, not softened.
   5. What to ask better next time.
   Tag every finding with the interviews it came from (person-1, person-3…).
4. **Argue we're wrong.** Append a section to the synthesis: the strongest case, using only interview evidence, that LJSportMind should not be built.
5. **Check the decision notes.** Compare the evidence with the stop-the-idea signals in `research/decision.md`. Say plainly if any has been triggered. Don't edit that file without asking.
6. **Report** in plain English: what changed, which signals moved, and links to [prd.md](prd.md), [research/survey-6q.md](research/survey-6q.md), [research/market-sizing.md](research/market-sizing.md), [research/decision-scores.md](research/decision-scores.md) and [research/interview-synthesis.md](research/interview-synthesis.md).
