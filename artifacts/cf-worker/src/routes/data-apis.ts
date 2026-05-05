import { Hono } from "hono";
import type { Env } from "../index";

const data = new Hono<{ Bindings: Env }>();

// ── CourtListener — legal case search ────────────────────────────────────────

data.get("/legal/cases", async (c) => {
  const q = c.req.query("q") ?? "";
  const court = c.req.query("court") ?? "";
  const page = c.req.query("page") ?? "1";

  if (!c.env.COURT_LISTENER_API_KEY) return c.json({ error: "CourtListener API key not configured" }, 503);

  const url = new URL("https://www.courtlistener.com/api/rest/v4/search/");
  url.searchParams.set("q", q);
  url.searchParams.set("type", "o");
  if (court) url.searchParams.set("court", court);
  url.searchParams.set("page", page);

  const resp = await fetch(url.toString(), {
    headers: {
      "Authorization": `Token ${c.env.COURT_LISTENER_API_KEY}`,
    },
  });

  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json());
});

data.get("/legal/courts", async (c) => {
  if (!c.env.COURT_LISTENER_API_KEY) return c.json({ error: "CourtListener API key not configured" }, 503);

  const resp = await fetch("https://www.courtlistener.com/api/rest/v4/courts/?limit=50", {
    headers: { "Authorization": `Token ${c.env.COURT_LISTENER_API_KEY}` },
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json());
});

// ── Data.gov — government datasets ───────────────────────────────────────────

data.get("/gov/datasets", async (c) => {
  const q = c.req.query("q") ?? "small business";
  const limit = c.req.query("limit") ?? "10";

  if (!c.env.DATA_GOV_API_KEY) return c.json({ error: "Data.gov API key not configured" }, 503);

  const url = new URL("https://catalog.data.gov/api/3/action/package_search");
  url.searchParams.set("q", q);
  url.searchParams.set("rows", limit);
  url.searchParams.set("api_key", c.env.DATA_GOV_API_KEY);

  const resp = await fetch(url.toString());
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  const json = await resp.json() as Record<string, unknown>;

  const results = ((json as any).result?.results ?? []).map((d: any) => ({
    id: d.id,
    title: d.title,
    notes: d.notes?.slice(0, 200),
    organization: d.organization?.title,
    resources: d.resources?.length ?? 0,
    modified: d.metadata_modified,
  }));
  return c.json({ results, total: (json as any).result?.count });
});

// ── GitHub — repo and user info ───────────────────────────────────────────────

data.get("/github/user", async (c) => {
  if (!c.env.GITHUB_TOKEN) return c.json({ error: "GitHub token not configured" }, 503);
  const resp = await fetch("https://api.github.com/user", {
    headers: {
      "Authorization": `Bearer ${c.env.GITHUB_TOKEN}`,
      "User-Agent": "RJ-Business-Solutions",
    },
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  return c.json(await resp.json());
});

data.get("/github/repos", async (c) => {
  if (!c.env.GITHUB_TOKEN) return c.json({ error: "GitHub token not configured" }, 503);
  const page = c.req.query("page") ?? "1";
  const resp = await fetch(`https://api.github.com/user/repos?sort=updated&per_page=30&page=${page}`, {
    headers: {
      "Authorization": `Bearer ${c.env.GITHUB_TOKEN}`,
      "User-Agent": "RJ-Business-Solutions",
    },
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  const repos = await resp.json() as any[];
  return c.json(repos.map((r) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    url: r.html_url,
    language: r.language,
    stars: r.stargazers_count,
    updated: r.updated_at,
    private: r.private,
  })));
});

data.get("/github/search", async (c) => {
  const q = c.req.query("q");
  if (!q) return c.json({ error: "q is required" }, 400);
  if (!c.env.GITHUB_TOKEN) return c.json({ error: "GitHub token not configured" }, 503);

  const resp = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=10`, {
    headers: {
      "Authorization": `Bearer ${c.env.GITHUB_TOKEN}`,
      "User-Agent": "RJ-Business-Solutions",
    },
  });
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  const json = await resp.json() as Record<string, unknown>;
  return c.json({
    total: (json as any).total_count,
    items: ((json as any).items ?? []).map((r: any) => ({
      name: r.full_name,
      description: r.description,
      url: r.html_url,
      stars: r.stargazers_count,
      language: r.language,
    })),
  });
});

// ── Google Maps — geocoding + places ─────────────────────────────────────────

data.get("/maps/geocode", async (c) => {
  const address = c.req.query("address");
  if (!address) return c.json({ error: "address is required" }, 400);
  if (!c.env.GOOGLE_MAPS_API_KEY) return c.json({ error: "Google Maps API key not configured" }, 503);

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${c.env.GOOGLE_MAPS_API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  const json = await resp.json() as Record<string, unknown>;
  const result = (json as any).results?.[0];
  if (!result) return c.json({ error: "No results found" }, 404);

  return c.json({
    formatted: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    place_id: result.place_id,
    components: result.address_components,
  });
});

data.get("/maps/places", async (c) => {
  const query = c.req.query("query");
  const location = c.req.query("location"); // "lat,lng"
  const radius = c.req.query("radius") ?? "5000";
  if (!query) return c.json({ error: "query is required" }, 400);
  if (!c.env.GOOGLE_MAPS_API_KEY) return c.json({ error: "Google Maps API key not configured" }, 503);

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", c.env.GOOGLE_MAPS_API_KEY);
  if (location) url.searchParams.set("location", location);
  if (location) url.searchParams.set("radius", radius);

  const resp = await fetch(url.toString());
  if (!resp.ok) return c.json({ error: await resp.text() }, resp.status as 400 | 500);
  const json = await resp.json() as Record<string, unknown>;

  return c.json({
    results: ((json as any).results ?? []).slice(0, 10).map((p: any) => ({
      name: p.name,
      address: p.formatted_address,
      rating: p.rating,
      user_ratings_total: p.user_ratings_total,
      place_id: p.place_id,
      types: p.types,
    })),
  });
});

export default data;
