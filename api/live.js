// Real match data for LIVE Studio, from ESPN's public scoreboard feed (no key needed).
// GET /api/live?sport=soccer           -> today's games across the leagues below
// GET /api/live?sport=soccer&league=eng.1&id=123 -> one game with its key events
// Only what the feed reports is returned: official score, status, clock and, for soccer,
// goals and red cards with the player and minute. Nothing is inferred or invented here.

const LEAGUES = {
  soccer: [
    ["eng.1", "Premier League"], ["esp.1", "LaLiga"], ["ger.1", "Bundesliga"], ["ita.1", "Serie A"],
    ["fra.1", "Ligue 1"], ["usa.1", "MLS"], ["mex.1", "Liga MX"], ["uefa.champions", "Champions League"],
    ["uefa.europa", "Europa League"], ["usa.nwsl", "NWSL"]
  ],
  basketball: [["nba", "NBA"], ["wnba", "WNBA"]],
  football: [["nfl", "NFL"], ["college-football", "College Football"]]
};

const BASE = "https://site.api.espn.com/apis/site/v2/sports";

async function scoreboard(sport, league) {
  const res = await fetch(`${BASE}/${sport}/${encodeURIComponent(league)}/scoreboard`, { headers: { "User-Agent": "LJSportMind/1.0" } });
  if (!res.ok) throw new Error(`feed ${res.status}`);
  return res.json();
}

function side(c) {
  const team = c.team || {};
  return { id: String(team.id || ""), name: team.shortDisplayName || team.displayName || "", abbr: team.abbreviation || "", score: Number(c.score) || 0 };
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

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const url = new URL(req.url, "http://localhost");
  const sport = url.searchParams.get("sport") || "soccer";
  const league = url.searchParams.get("league");
  const id = url.searchParams.get("id");
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
      res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=10");
      return res.end(JSON.stringify({ game: normalize(sport, league, meta[1], e), source: "ESPN" }));
    }

    const lists = await Promise.allSettled(leagues.map(([key]) => scoreboard(sport, key)));
    const order = { in: 0, pre: 1, post: 2 };
    const games = lists
      .flatMap((r, i) => (r.status === "fulfilled" ? (r.value.events || []).map((e) => normalize(sport, leagues[i][0], leagues[i][1], e)) : []))
      .sort((a, b) => order[a.state] - order[b.state] || String(a.start).localeCompare(String(b.start)))
      .slice(0, 60)
      .map(({ events, ...g }) => ({ ...g, events: events.length }));
    res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=20");
    return res.end(JSON.stringify({ games, source: "ESPN" }));
  } catch {
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: "The live score feed isn't responding. Try again in a minute." }));
  }
};
