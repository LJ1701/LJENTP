// Game-day weather from Open-Meteo (no key). Runs on the server; Next.js keeps each answer for 30 minutes,
// so each city is fetched at most twice an hour however many people open the page.
// Open-Meteo is free for non-commercial use and asks for credit (shown on the page).

const DEFAULT_CITY = "Dallas";

export async function gameDayWeather(location) {
  const city = (location || "").split(",")[0].trim() || DEFAULT_CITY;
  try {
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&name=${encodeURIComponent(city)}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(4000)
    }).then((r) => (r.ok ? r.json() : null));
    const place = geo && geo.results && geo.results[0];
    if (!place) return { error: `Couldn't find "${city}" for the weather. Try a city name like "Dallas".` };
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      "&current=temperature_2m&daily=precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto&forecast_days=1";
    const data = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(4000) }).then((r) => (r.ok ? r.json() : null));
    if (!data || !data.current) return { error: "Weather isn't available right now. Check back later." };
    return {
      place: [place.name, place.admin1].filter(Boolean).join(", "),
      tempF: Math.round(data.current.temperature_2m),
      rainChance: data.daily?.precipitation_probability_max?.[0] ?? null
    };
  } catch {
    return { error: "Weather isn't available right now. Check back later." };
  }
}
