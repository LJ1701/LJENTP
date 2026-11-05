import { createClient } from "@/lib/supabase/server";
import { billingStatus, FREE_ANSWERS } from "@/lib/billing";
import { testMode, getSubscription } from "@/lib/stripe";
import { buy, setProRenewal, joinProgram, requestPilot } from "../billing/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pricing · LJSportMind", description: "Free for everyone. Extra AI answers, Pro, and programs for schools and clubs." };

const day = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function Pricing({ searchParams }) {
  const { error, ok, canceled, pilot, pilot_error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const status = user ? await billingStatus(user.id) : null;
  let cancelling = false;
  if (status?.pro && status.subscription) {
    try { cancelling = !!(await getSubscription(status.subscription)).cancel_at_period_end; } catch { /* show as renewing */ }
  }
  const guest = user?.is_anonymous;

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Pricing</p>
        <h1>Free to build your proof. <span className="gold-text">Pay only for more AI.</span></h1>
        <p className="muted">Your Passport, career matches, plan, live job search, fit checks and proof link are free for everyone, always.</p>
      </div>
      {testMode() && <p className="warn test-banner">Test mode: no real money moves. Pay with card 4242 4242 4242 4242, any future date, any 3-digit code.</p>}
      {error && <p className="error">{error}</p>}
      {ok && <p className="ok">{ok}</p>}
      {canceled && <p className="warn">Payment cancelled. Nothing was charged.</p>}

      {status?.ready && (
        <div className="card plan-status">
          <h2>Your plan</h2>
          <p>{status.pro ? <>Pro: <strong>unlimited AI answers</strong> {cancelling ? `until ${day(status.proUntil)} (cancelled)` : `· renews ${day(status.proUntil)}`}</>
            : status.program ? <>{status.program.name}: <strong>unlimited AI answers</strong> until {day(status.program.until)}</>
            : <>Free: <strong>{status.freeLeft} of {FREE_ANSWERS}</strong> AI answers left this month{status.packLeft > 0 && <> · <strong>{status.packLeft}</strong> bought answers left</>}</>}</p>
          {status.pro && (
            <form action={setProRenewal}>
              <input type="hidden" name="renew" value={cancelling ? "1" : "0"} />
              <button type="submit" className="ghost">{cancelling ? "Keep Pro (renew)" : "Cancel Pro"}</button>
            </form>
          )}
        </div>
      )}

      <div className="price-grid">
        <div className="card price">
          <h2>Free</h2>
          <p className="price-tag">$0</p>
          <ul>
            <li>{FREE_ANSWERS} AI answers a month (Goldie, résumé bullets, PDF reads)</li>
            <li>Unlimited job search and fit checks</li>
            <li>Sports Passport, matches, plan and proof link</li>
          </ul>
          <a className="cta small" href={user ? "/profile" : "/"}>{user ? "Open my Passport" : "Start free"}</a>
        </div>
        <div className="card price">
          <h2>Answer pack</h2>
          <p className="price-tag">$5 <small>one time</small></p>
          <ul>
            <li>25 more AI answers</li>
            <li>They never expire</li>
            <li>Used after your free answers run out</li>
          </ul>
          <form action={buy}><input type="hidden" name="kind" value="pack" /><button type="submit" disabled={!user || guest}>Buy 25 answers</button></form>
        </div>
        <div className="card price featured">
          <span className="badge badge-full">Most AI</span>
          <h2>Pro</h2>
          <p className="price-tag">$9 <small>a month</small></p>
          <ul>
            <li>Unlimited AI answers</li>
            <li>Interview practice as often as you like</li>
            <li>Cancel any time; keep Pro to the end of the month</li>
          </ul>
          <form action={buy}><input type="hidden" name="kind" value="pro" /><button type="submit" disabled={!user || guest || status?.pro}>{status?.pro ? "You have Pro" : "Go Pro"}</button></form>
        </div>
      </div>
      {!user && <p className="muted center"><small>Start free (no account needed), then save your Passport with your email to buy.</small></p>}
      {guest && <p className="muted center"><small>You&apos;re using a guest Passport. <a href="/profile">Save it with your email</a> first, so purchases stay with your account.</small></p>}

      <h2 className="step-title" id="schools">For schools, clubs and programs</h2>
      <div className="card">
        <p className="price-tag">From $1,500 <small>a year per program</small></p>
        <ul>
          <li><strong>Unlimited AI for every student</strong> with one join code</li>
          <li><strong>Director dashboard</strong>: how many students saved a Passport, chose a target, finished plan steps and shared proof</li>
          <li><strong>Outcomes report</strong> for accreditation and program reviews (totals only; never students&apos; names or answers)</li>
          <li>Invoiced to the school: no student pays anything</li>
        </ul>
        <p><a className="cta small" href="/program">Start a free 30-day pilot</a> <small>30 seats, set up in a minute.</small></p>

        <h3>Request a pilot or a quote</h3>
        {pilot ? <p className="ok">Thanks! We&apos;ll email you within 2 working days.</p> : (
          <form action={requestPilot} className="pilot-form">
            {pilot_error && <p className="error">{pilot_error}</p>}
            <div className="row">
              <div><label htmlFor="pr-name">Your name</label><input id="pr-name" name="name" type="text" required maxLength={100} /></div>
              <div><label htmlFor="pr-email">Work email</label><input id="pr-email" name="email" type="email" required maxLength={200} /></div>
            </div>
            <div className="row">
              <div><label htmlFor="pr-org">School, club or program</label><input id="pr-org" name="organization" type="text" required maxLength={150} /></div>
              <div><label htmlFor="pr-role">Your role</label><input id="pr-role" name="role" type="text" placeholder="Program director" maxLength={100} /></div>
            </div>
            <label htmlFor="pr-students">About how many students?</label>
            <input id="pr-students" name="students" type="number" min={1} max={100000} />
            <label htmlFor="pr-msg">Anything we should know? (optional)</label>
            <textarea id="pr-msg" name="message" rows={3} maxLength={1000} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            <button type="submit">Request a pilot</button>
          </form>
        )}
        <h3>Have a join code from your program?</h3>
        {user ? (
          <form action={joinProgram} className="join-form">
            <input type="hidden" name="from" value="pricing" />
            <input type="text" name="code" placeholder="e.g. K7M2QX" maxLength={12} aria-label="Program join code" required />
            <button type="submit">Join</button>
          </form>
        ) : <p><a href="/profile">Start your Passport</a>, then enter the code there.</p>}
        <p><small>Your program director sees totals only, never your name, Passport or chats.</small></p>
      </div>
    </>
  );
}
