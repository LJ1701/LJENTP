---
name: demo-check
description: Pre-demo check for the LJSportMind MVP (mvp/). Confirms the app builds, the live URL loads, the sign-up / sign-in flow works end to end, and the browser console shows no errors. Use before a class demo or after a deploy.
---

# demo-check

Run these four checks in order for the MVP in `mvp/` (live at https://ljsportmind-mvp.vercel.app). Stop at the first failure, say what failed and why, and suggest the fix. At the end, report a table: check, result (PASS / FAIL / NEEDS USER), evidence.

## 1. The app builds

Run from the project root:

```bash
cd mvp && npm run build
```

PASS if the output contains "Compiled successfully" and no "Error" or "Failed to compile". Report the route table it prints.

## 2. The live URL loads

```bash
curl -s -o /dev/null -w "%{http_code}" https://ljsportmind-mvp.vercel.app
```

PASS if it returns 200 and the page HTML contains "LJSportMind MVP". Then open the URL in the built-in browser pane and take one screenshot as evidence.

## 3. The sign-up / sign-in flow works end to end

Automatic checks (do these yourself):
- The home page shows the sign-in form when signed out.
- `curl -s -o /dev/null -w "%{http_code} %{redirect_url}" https://ljsportmind-mvp.vercel.app/auth/callback` redirects (307) to `/?error=signin`, so a broken link fails safely.
- `curl -s -X POST -o /dev/null -w "%{http_code}" https://ljsportmind-mvp.vercel.app/auth/signout` returns 303.

The real sign-up needs a real inbox (and, once email + password sign-in exists, a real password). Do not create accounts, type passwords or open the owner's email yourself. Ask the user to do it in Chrome or Safari and to tell you each result:
1. Open the live URL, enter their email, submit. Expect the "Check your email" message.
2. Open the email from Supabase Auth and click the link in the same browser. Expect "Signed in as <their email>".
3. Refresh. Expect to still be signed in.
4. Click Sign out. Expect the sign-in form again.

Mark this check NEEDS USER until they confirm all four; PASS once they do. Remind them that Supabase's built-in email sender allows only a few emails an hour.

## 4. No errors in the browser console

In the built-in browser pane, load the home page and `/?error=signin`, then read the console with errors only. PASS if there are no error-level messages. If there are, list each one with the page it came from.
