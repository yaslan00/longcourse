// Sends the newsletter for state.pendingNewsletter via Buttondown, after verifying the article is live.
// Idempotent: records the slug in state.newsletterSent and clears pendingNewsletter.
import fs from "node:fs";
import { execSync } from "node:child_process";

const STATE = "ops/state.json";
const state = JSON.parse(fs.readFileSync(STATE, "utf8"));
const p = state.pendingNewsletter;
const key = process.env.BUTTONDOWN_API_KEY;
function log(msg) { const line = `${new Date().toISOString()} ${msg}`; console.log(line); state.log.unshift(line); }
function save() { fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n"); }

if (!p) { console.log("no pending newsletter"); process.exit(0); }
if (state.paused.newsletter) { log("newsletter paused; leaving pending"); save(); process.exit(0); }
if (state.newsletterSent.includes(p.slug)) { log(`newsletter for ${p.slug} already sent`); state.pendingNewsletter = null; save(); process.exit(0); }
if (!key) { log("BUTTONDOWN_API_KEY missing; cannot send"); save(); process.exit(1); }

// Wait for the deploy: poll the article URL for up to 8 minutes.
let live = false;
for (let i = 0; i < 16; i++) {
  const r = await fetch(p.url, { method: "GET" }).catch(() => null);
  if (r && r.ok) { live = true; break; }
  await new Promise((res) => setTimeout(res, 30000));
}
if (!live) { log(`article not live at ${p.url}; newsletter NOT sent, will retry next run`); save(); process.exit(1); }

const body = `${p.dek}\n\nRead it: ${p.url}\n\nEvery Long Course article lists its sources and separates evidence from interpretation. If something looks wrong, reply to this email.\n\nYigit\nLong Course, nutrition for the long haul, explained clearly.`;
const r = await fetch("https://api.buttondown.com/v1/emails", {
  method: "POST",
  headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({ subject: p.title, body, status: "about_to_send" })
});
if (!r.ok) { log(`buttondown error ${r.status}: ${await r.text()}`); save(); process.exit(1); }
state.newsletterSent.push(p.slug);
state.pendingNewsletter = null;
log(`newsletter sent for ${p.slug}`);
save();
execSync(`git config user.name "Long Course bot" && git config user.email "bot@longcourse.local" && git add ops/state.json && git commit -m "Newsletter sent: ${p.slug}" && git push`, { stdio: "inherit" });
