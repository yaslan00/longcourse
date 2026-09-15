// Weekly stats snapshot written to ops/stats.json so the owner dashboard and the digest can read it
// without holding any API keys. Runs in GitHub Actions (see .github/workflows/stats.yml).
import fs from "node:fs";
import { execSync } from "node:child_process";

const site = JSON.parse(fs.readFileSync("src/_data/site.json", "utf8"));
const out = { generatedAt: new Date().toISOString(), site: {}, newsletter: {}, uptime: {}, errors: [] };

// Uptime check
for (const u of ["/", "/archive/", "/contact/", "/feed.xml", "/sitemap.xml"]) {
  const r = await fetch(site.url + u).catch(() => null);
  out.uptime[u] = r ? r.status : "unreachable";
}

// GoatCounter (optional token)
const gc = process.env.GOATCOUNTER_API_TOKEN;
if (gc) {
  try {
    const end = new Date(); const start = new Date(end.getTime() - 7 * 864e5);
    const q = `start=${start.toISOString()}&end=${end.toISOString()}`;
    const t = await (await fetch(`https://${site.analytics.goatcounter}.goatcounter.com/api/v0/stats/total?${q}`, { headers: { Authorization: `Bearer ${gc}` } })).json();
    out.site.pageviews7d = t.total; out.site.visits7d = t.total_utc ?? null;
    const h = await (await fetch(`https://${site.analytics.goatcounter}.goatcounter.com/api/v0/stats/hits?${q}&limit=10`, { headers: { Authorization: `Bearer ${gc}` } })).json();
    out.site.topPages = (h.hits || []).map((x) => ({ path: x.path, count: x.count }));
  } catch (e) { out.errors.push("goatcounter: " + e.message); }
} else out.errors.push("goatcounter token not set");

// Buttondown (optional key)
const bd = process.env.BUTTONDOWN_API_KEY;
if (bd) {
  try {
    const r = await (await fetch("https://api.buttondown.com/v1/subscribers?type=regular&page_size=1", { headers: { Authorization: `Token ${bd}` } })).json();
    out.newsletter.subscribers = r.count ?? null;
    const u = await (await fetch("https://api.buttondown.com/v1/subscribers?type=unactivated&page_size=1", { headers: { Authorization: `Token ${bd}` } })).json();
    out.newsletter.unconfirmed = u.count ?? null;
  } catch (e) { out.errors.push("buttondown: " + e.message); }
} else out.errors.push("buttondown key not set");

fs.writeFileSync("ops/stats.json", JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out, null, 2));
execSync(`git config user.name "Long Course bot" && git config user.email "bot@longcourse.local" && git add ops/stats.json && (git diff --cached --quiet || git commit -m "Weekly stats snapshot") && git push`, { stdio: "inherit" });
