// Real match data for LIVE Studio, from ESPN's public scoreboard feed (no key needed).
// GET /api/live?sport=soccer           -> today's games across the leagues below
// GET /api/live?sport=soccer&league=eng.1&id=123 -> one game with its key events
// Only what the feed reports is returned: official score, status, clock and, for soccer,
// goals and red cards with the player and minute. Nothing is inferred or invented here.

const LEAGUES = {
  soccer: [
    ["eng.1", "Premier League"], ["esp.1", "LaLiga"], ["ger.1", "Bundesliga"], ["ita.1", "Serie A"],
    ["fra.1", "Ligue 1"], ["uefa.champions", "Champions League"], ["uefa.europa", "Europa League"],
    ["uefa.europa.conf", "Conference League"], ["usa.1", "MLS"], ["mex.1", "Liga MX"], ["bra.1", "Brasileirão"],
    ["arg.1", "Liga Profesional"], ["por.1", "Primeira Liga"], ["ned.1", "Eredivisie"], ["tur.1", "Süper Lig"],
    ["ksa.1", "Saudi Pro League"], ["jpn.1", "J1 League"], ["ind.1", "Indian Super League"], ["eng.2", "Championship"],
    ["usa.nwsl", "NWSL"]
  ],
  basketball: [["nba", "NBA"], ["wnba", "WNBA"], ["mens-college-basketball", "NCAA Men's"], ["womens-college-basketball", "NCAA Women's"]],
  football: [["nfl", "NFL"], ["college-football", "College Football"]],
  baseball: [["mlb", "MLB"]],
  hockey: [["nhl", "NHL"]]
};

const BASE = "https://site.api.espn.com/apis/site/v2/sports";

// One retry and a time limit per league, so a single slow or flaky league can't take the whole list down.
async function scoreboard(sport, league, tries = 2) {
  try {
    const res = await fetch(`${BASE}/${sport}/${encodeURIComponent(league)}/scoreboard`, {
      headers: { "User-Agent": "LJSportMind/1.0" },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error(`feed ${res.status}`);
    return await res.json();
  } catch (err) {
    if (tries > 1) return scoreboard(sport, league, tries - 1);
    throw err;
  }
}

function side(c) {
  const team = c.team || {};
  const hex = (v) => (/^[0-9a-f]{6}$/i.test(String(v || "")) ? String(v).toLowerCase() : "");
  return {
    id: String(team.id || ""), name: team.shortDisplayName || team.displayName || "", abbr: team.abbreviation || "",
    score: Number(c.score) || 0, color: hex(team.color), alt: hex(team.alternateColor)
  };
}

// Soccer key events: goals (including penalties and own goals) and red cards, in match order.
function soccerEvents(comp, homeId) {
  return (comp.details || [])
    .map((d) => {
      const type = d.scoringPlay ? "goal" : d.redCard ? "red" : null;
      if (!type) return null;
      const teamId = String((d.team && d.team.id) || "");
      return {
        type,
        minute: (d.clock && d.clock.displayValue) || "",
        team: teamId === homeId ? "h" : "a",
        player: ((d.athletesInvolved || [])[0] || {}).displayName || "",
        penalty: !!d.penaltyKick,
        ownGoal: !!d.ownGoal
      };
    })
    .filter(Boolean);
}

function normalize(sport, league, leagueName, e) {
  const comp = (e.competitions || [])[0] || {};
  const comps = comp.competitors || [];
  const home = side(comps.find((c) => c.homeAway === "home") || {});
  const away = side(comps.find((c) => c.homeAway === "away") || {});
  const st = (e.status && e.status.type) || {};
  return {
    id: String(e.id),
    sport,
    league,
    leagueName,
    start: e.date,
    state: st.state || "pre", // pre | in | post
    detail: st.shortDetail || st.detail || "",
    clock: (e.status && e.status.displayClock) || "",
    period: (e.status && e.status.period) || 0,
    home,
    away,
    events: sport === "soccer" ? soccerEvents(comp, home.id) : []
  };
}

// The last good answer for each request while this instance is warm. If ESPN blips, viewers keep the
// latest scores (marked stale) instead of an error.
const lastGood = new Map();

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const url = new URL(req.url, "http://localhost");
  const sport = url.searchParams.get("sport") || "soccer";
  const league = url.searchParams.get("league");
  const id = url.searchParams.get("id");
  const key = `${sport}|${league || ""}|${id || ""}`;
  const send = (body, cache) => {
    lastGood.set(key, body);
    res.setHeader("Cache-Control", cache);
    return res.end(JSON.stringify(body));
  };
  const leagues = LEAGUES[sport];
  if (!leagues) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Unknown sport." }));
  }

  try {
    if (league && id) {
      const meta = leagues.find(([key]) => key === league);
      if (!meta) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: "Unknown league." }));
      }
      const data = await scoreboard(sport, league);
      const e = (data.events || []).find((x) => String(x.id) === id);
      if (!e) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Game not found in today's feed." }));
      }
      return send({ game: normalize(sport, league, meta[1], e), source: "ESPN" }, "s-maxage=10, stale-while-revalidate=10");
    }

    const lists = await Promise.allSettled(leagues.map(([key]) => scoreboard(sport, key)));
    const failed = lists.filter((r) => r.status === "rejected");
    if (failed.length) console.error(`live feed: ${failed.length}/${lists.length} ${sport} leagues failed:`, failed[0].reason && failed[0].reason.message);
    if (lists.every((r) => r.status === "rejected")) throw new Error("feed down");
    const order = { in: 0, pre: 1, post: 2 };
    const games = lists
      .flatMap((r, i) => (r.status === "fulfilled" ? (r.value.events || []).map((e) => normalize(sport, leagues[i][0], leagues[i][1], e)) : []))
      .sort((a, b) => order[a.state] - order[b.state] || String(a.start).localeCompare(String(b.start)))
      .slice(0, 120)
      .map(({ events, ...g }) => ({ ...g, events: events.length }));
    return send({ games, source: "ESPN" }, "s-maxage=20, stale-while-revalidate=20");
  } catch {
    if (lastGood.has(key)) {
      res.setHeader("Cache-Control", "s-maxage=5");
      return res.end(JSON.stringify({ ...lastGood.get(key), stale: true }));
    }
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: "The live score feed isn't responding. Try again in a minute." }));
  }
};
