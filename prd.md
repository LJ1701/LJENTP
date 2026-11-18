# PRD: The Assist

*Renamed from The Assist on 17 Nov 2026. Tagline: "Every career starts with an assist." The name is the moat: a reference who confirms your work is the assist.*

*Updated 17 Nov 2026. Replaces the 21 Oct 2026 version (kept privately). Rewritten after professor feedback: one problem, one paying customer, a moat we build on purpose, and an honest answer on scale.*

**Live app:** https://ljsportmind-mvp.vercel.app (Next.js + Supabase, folder `mvp/`). The older plain-HTML site at https://ljentp.vercel.app is no longer where new work happens. **LJ LIVE** (`live-studio/`) is a separate product and is not covered here.

---

## 1. The one problem

**Hiring managers in sports can't tell what an entry-level candidate can actually do, and a résumé doesn't show it.**

- Candidates write "ran game-day operations" or "grew the club's Instagram". Anyone can write that.
- So hiring falls back on who you know. Our first interviewee got every sports job through a person who vouched for him. In his words: "Everything is who you know."
- People without that contact have no way to show the same proof.

**What we are *not* solving as the core problem: finding job listings.** Job search stays in the app because it's why people come back (section 6), but it is a supporting feature, not the product. TeamWork Online, LinkedIn and Indeed already list jobs.

**One-line pitch:** *The Assist lets anyone breaking into sports show proof of their work in one link: files, links and references who confirm it with one click. Employers get candidates they can trust.*

## 2. Who it's for

**Users (free): anyone breaking into the sports industry**, whether or not they played. That includes students, recent graduates, career changers, former players and coaches.

**Focus: international candidates.**
- The app already works in 10 languages and searches jobs in 19 countries.
- Candidates say which countries they can already work in and where they'd like to work. Employers see it on the proof page, and job search points them to the countries they listed.
- **Legal boundary:** The Assist does **not** help with visas or work permits, and gives no legal advice. Candidates list only countries where their right to work is already sorted; the app says so where they pick them, and doesn't check it.
- **Why international:**
  - Proof matters most when the employer can't call the candidate's old boss down the road.
  - A verified, translated proof page crosses borders better than a résumé.

**Paying customers: employers.** Teams, clubs, leagues, venues, sports companies, and schools and athletic departments (they hire too).

## 3. Evidence so far (honest)

**Interviews:** 2 people.
- **person-1** (9 Nov), a recent graduate now working in venue events:
  - got every sports job through people, not job boards;
  - spent time but no money on getting in;
  - distrusts AI "robot" tools.
- **person-2** (17 Nov): only a written response after testing the app has been saved so far.
  - He called it a resource for **students**.
  - He suggested dropping "LJ" from the name, and said the homepage repeats who it's for.
  - This is product feedback, not evidence of demand.
- Two people prove nothing. Both pointing at students is a lead to test.

**Survey:** live on Qualtrics, with branches for job seekers, people who work with sports, and school/club staff.

**Outside data on non-athlete job seekers (added after feedback).** Status: ✅ = source opened and checked, ⚠️ = from a search result or summary, not yet checked in the original.

| What | Number | Source | Status |
|---|---|---|---|
| Sport management degrees awarded a year (US) | ~17,500 (2021–22) | [College Factual](https://www.collegefactual.com/majors/parks-recreation-fitness/health-and-physical-education/sports-management/) | ⚠️ |
| Jobs posted on TeamWork Online in a year | 7,653 (2019) | [IU Sports Innovation Institute, 2019 Sports Jobs Report](https://sii.indianapolis.iu.edu/Research/2019-Sports-Jobs-Report.pdf) | ⚠️ |
| Applications per sports job opening | "at least 200" | [Black Enterprise](https://www.blackenterprise.com/social-media-technology-top-growth-sports-employment-sectors/) | ⚠️ unsourced claim, undated |
| Applicants per job, fitness industry (nearest benchmark) | 33 (2022) | [CareerPlug](https://www.careerplug.com/wp-content/uploads/2022/04/Fitness-Industry-Recruiting-Metrics-2022.pdf) | ⚠️ different industry |
| Sport management alumni still in sport | 63% found sport work; only 39% of those stayed (n = 268) | SCHOLE, 2015, vol. 30 | ⚠️ |

**What's still missing:**
- **Hiring managers.** No interviews yet. They are the paying customer, so this is the biggest gap.
- **A reliable applicants-per-posting number for sports.**

**Next:** 3 hiring-manager interviews asking "Would you open this proof link? Would a confirmed reference change who you interview?" Also ask TeamWork Online or teams' HR for applicant counts.

## 4. Competition

The competitor depends on the problem. For "employers can't see what a candidate can do", the closest is:

| | **TeamWork Online** (main competitor) | **The Assist** |
|---|---|---|
| What it is | The biggest sports and live-events job board: listings, applications, a candidate profile, career fairs | A proof page per candidate: portfolio files, links and references who confirm with one click |
| Who pays | Employers (job posts, recruiting tools) | Employers (planned, section 7) |
| What an employer sees | A résumé and an application | Proof: files, links, confirmed references with their comments |
| Size | Claims millions of candidates and thousands of employers ([about](https://teamworkonline.com/pages/about-us), [employers](https://www.teamworkonline.com/pages/for-the-employers)) ⚠️ company's own claims | 0 employers so far |

**Honest view:** TeamWork Online is far bigger and could add portfolios. Our bet is that **confirmed references** take years of real people confirming real work to build, and that can't be added with a software update.

**Others to know:**
- **WorkInSports** and **LinkedIn**: listings and résumés.
- **Prospect HQ**: athlete-only hiring, free for athletes and schools, paid by employers. It's the closest business model, but it's limited to athletes.
- **Free Agent**: a career network for verified college, pro and Olympic athletes, backed by about $17M in angel funding ([BetaKit](https://betakit.com/free-agent-is-building-a-linkedin-style-career-marketplace-for-athletes/)) ⚠️. Athletes only.
- **Tropheo**: verifies sports *accomplishments* with QR codes and NFC tags ([App Store](https://apps.apple.com/us/app/tropheo/id6747730894)). Close to our proof idea, but for athletic records, not jobs.
- **Teamworks**: software colleges use to run their teams. It's not a hiring tool, and is often confused with TeamWork Online.

## 5. The moat we will build: a network of confirmed proof

**There's no moat today.** The AI, the job feed, the matching rules and the translations can all be copied.

**The moat we're building is a network effect:**
1. **Users** ask the people who saw their work (supervisors, coaches, event managers) to **confirm** it. *(Built 17 Nov 2026: one-click confirm link.)*
2. **Those confirmers are sports staff, the future hirers.** Each confirmation shows a sports professional what the platform does, at no cost to us.
3. **Employers join** to see candidates with confirmed proof. Then they post jobs here, ideally only here.
4. **More employers bring more candidates, which brings more confirmations,** which makes the platform more useful to employers.

A copycat can copy the code but starts with **zero confirmations and zero confirmers**.

**What to measure (not sign-ups):**
- confirmed references;
- distinct confirmers;
- employers who open proof links;
- interviews that came from a proof link.

## 6. Scale, and what if job sites block us

**We don't scrape.** Jobs come from two sources that are meant to be used this way (`mvp/lib/jobs.js`):
1. **Adzuna's official job API** (an API is a door a company opens on purpose so other apps can read its data). It covers 19 countries.
2. **Public job feeds that employers publish themselves** through their hiring software (Greenhouse, Lever, Ashby): about 29 sports employers, including Hudl, FanDuel, Genius Sports, The Athletic and TeamSnap.

**Risks:**
- Adzuna could change its terms.
- An employer could switch hiring software.

**Why that's acceptable:**
- Job search is the supporting feature, not the product.
- Each employer feed is independent, so losing one doesn't break the rest.
- The long-term answer is **employers posting directly** on The Assist, which is also the business model.

**Scaling the product itself:** each proof page is one database row plus files in storage. It runs on Vercel and Supabase, which grow with paid plans; the cost rises with users, not with code.

## 7. Business model

**Employers pay. Candidates never pay to build or share proof.**

- **Why employers, in plain terms (not just the numbers):**
  - The employer has the money and the pain: screening hundreds of applications they can't trust.
  - The candidate has the pain but no money.
  - Schools and athletic departments are employers too, so they fit here.
- **Planned paid features (not built):**
  - search candidates with confirmed proof, by role and country;
  - post jobs;
  - contact candidates.
- **Not decided yet:** price and format (per job post, monthly seat or yearly plan). This needs the hiring-manager interviews first.

**Decided 17 Nov: candidates are never charged.** The pricing page now shows "Free" for candidates and "Employers: free for now". The $5 and $9 AI offers were removed from the app (the code stays for anyone already subscribed). Before that, the app charged:
- extra AI answers, $5 for 25;
- Pro, $9 a month;
- a school program, from $1,500 a year (unlimited AI and a dashboard for staff).

These were built before this decision. Keeping user AI payments may be fine as a small extra, but they are not the business.

## 8. Features and status

**Live** = on https://ljsportmind-mvp.vercel.app · **On branch** = built, waiting to be merged · **Not built**.

| # | Feature | Status |
|---|---|---|
| 1 | **Passport in tabs:** Profile → Portfolio → Path → Jobs → Share | Live |
| 2 | **Portfolio:** upload files (PDF, image, short video, 10 MB), add links, name references. No sign-off needed. Each item can be tied to an achievement line | Live |
| 3 | **Reference confirmation:** the user gets a private link and sends it themselves. The reference sees exactly what was claimed and answers "Yes, that's right" (with an optional comment) or "That's not right". The public page shows "Confirmed by <name>" for confirmed ones only. Owners see declines privately | Live (17 Nov) |
| 4 | **Public proof link:** one page for employers. It's on only while the owner switches it on; contacts are hidden unless shown | Live |
| 5 | **Skill detection** from the user's own words, with the line each skill came from | Live |
| 6 | **Career matches** (8 sports career paths) and a saved **plan** | Live |
| 7 | **Job search:** live postings in 19 countries plus 29 employer feeds, with a **fit check** showing which asked-for skills you have proof for | Live |
| 8 | **Goldie**, a guide that answers common requests instantly and uses AI (Google Gemini) for real questions | Live |
| 9 | **10 languages** | Live |
| 10 | **Accounts:** guest first, then save with email | Live |
| 11 | **Where you can work:** "Countries where I can already work" and "Countries I'd like to work in" (up to 10 each, self-stated, no visa advice). The public page shows "Can work in: …, as stated by <name>". The Jobs tab notes when the search country isn't one they listed, with one-click searches in their countries | Live (17 Nov) |
| 12 | **Employer side, step 1:** a "For employers" page. Employers post a role by linking the posting they already have (LinkedIn, Indeed, TeamWork Online or their careers page). After the owner approves it, it shows in candidates' Jobs tab with "Apply on LinkedIn/Indeed/TeamWork Online" and a reminder to include the proof link. Free during early access | Built 17 Nov (needs `mvp/supabase/009_employer_roles.sql`) |
| 12b | **Employer side, step 2:** search confirmed candidates, contact them, pay | Not built |
| 13 | **Stronger confirmation:** check the confirmer's work email; label personal emails | Not built |

**Dropped since October:** LJ Coach Certification and the Body ID scan. Our early (synthetic, AI-simulated) test interviews suggested employers would ignore a certificate made by us, and proof from real work and real people is stronger. To confirm with real hiring managers.

## 9. Why we designed it this way

- **Proof with no sign-off required.** Requiring approval would block anyone whose old supervisor is slow to answer. Confirmation is an optional extra, not a gate.
- **The user sends the confirm link themselves.** We never email people on the user's behalf, so there's no spam risk. A message from someone they know is also more likely to be opened.
- **One-click confirm, no account.** Every extra step loses confirmers, and confirmers are the network.
- **"Added by the user" is shown honestly.** The public page says The Assist doesn't check files or links. Only references who confirmed are marked confirmed.
- **Tabs instead of one long page.** Our professor found the demo scattered, and one long page hid the proof. Each tab now does one job.
- **No dates on achievements.** Many people can't remember exact dates, and dates weren't needed to judge the proof.
- **Guest first.** People try it before giving an email.

## 10. Data we store

- **Accounts:** Supabase Auth (email; guests have no email until they save).
- **Passport:** profile, achievements, plan (`sports_profiles`).
- **Portfolio:** items in `portfolio_items`, and files in a private storage bucket.
  - Row-level security means each user can only read and change their own rows.
  - Visitors can only see a profile while its public link is on.
- **Confirmations:** stored on the reference item: a random 64-character link token, the answer, the date and an optional comment of up to 300 characters. We don't ask confirmers for their email.
- **Never kept:** résumé files read in the browser.

## 11. Known limits

- **A confirmation can be faked.** A user could open their own link in a second browser while signed out.
  - The app blocks confirming while signed in as the owner, and allows one answer per link.
  - The real fix is #13 (work-email check).
  - Until then, the public page shows the confirmer's name and role so an employer can check.
- **The AI runs on Google Gemini's free tier.** It's limited to about 20 requests a day per model. Busy days fall back to a lighter model, then to rules.
- **The job feed depends on Adzuna and on employers' public feeds** (section 6).

## 12. Open questions (next tests)

1. Would hiring managers open a proof link, and would a confirmed reference change who they interview? *(3 interviews)*
2. What would an employer pay, and for what: posts, search or contact?
3. Students first (both interviewees hinted at this), or international candidates first?
4. Which countries first for international placement? Where are our first employers?
5. Name: renamed to **The Assist** (17 Nov), after person-2 said founder initials in a product name look personal. Still to do: a USPTO trademark search and a web address of its own (the app is still at ljsportmind-mvp.vercel.app).
