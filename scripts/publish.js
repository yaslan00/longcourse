// Scheduled publisher. Runs in GitHub Actions every Tuesday (see .github/workflows/publish.yml).
// Picks at most ONE article that is due and allowed through its gate, flips it to published,
// commits, and (after the deploy is live) sends the newsletter issue via Buttondown.
// State lives in ops/state.json so nothing publishes or sends twice.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const STATE = path.join(ROOT, "ops/state.json");
const state = JSON.parse(fs.readFileSync(STATE, "utf8"));
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "src/_data/site.json"), "utf8"));
const today = new Date().toISOString().slice(0, 10);
const DRY = process.argv.includes("--dry");

function log(msg) { const line = `${new Date().toISOString()} ${msg}`; console.log(line); state.log.unshift(line); state.log = state.log.slice(0, 200); }
function save() { if (!DRY) fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n"); }
function fm(text) { const m = text.match(/^---\n([\s\S]*?)\n---/); const o = {}; if (!m) return o; for (const l of m[1].split("\n")) { const i = l.indexOf(":"); if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, ""); } return o; }

if (state.paused.publishing) { log("publishing paused, nothing done"); save(); process.exit(0); }

const dir = path.join(ROOT, "src/articles");
const candidates = [];
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
  const text = fs.readFileSync(path.join(dir, f), "utf8");
  const d = fm(text);
  const slug = f.replace(/\.md$/, "");
  if (state.published.includes(slug)) continue;
  if (!["review", "scheduled"].includes(d.status)) continue;
  if (d.date > today) continue;
  if (/[—–]/.test(text)) { log(`skip ${slug}: contains a dash`); continue; }
  if (d.reviewGate === "human" && !d.reviewer) { log(`hold ${slug}: human gate, no named reviewer`); continue; }
  if (d.reviewGate === "human" && state.paused.humanGate) { log(`hold ${slug}: human gate paused`); continue; }
  candidates.push({ slug, f, d, text });
}
candidates.sort((a, b) => (a.d.date < b.d.date ? -1 : 1));
const pick = candidates[0];
if (!pick) { log("nothing due"); save(); process.exit(0); }

// One per run, one per week. Never two on the same day.
if (state.lastPublishedOn === today) { log("already published today"); save(); process.exit(0); }

let text = pick.text.replace(/^status: .*$/m, "status: published");
if (!/^authorReviewed:/m.test(text)) text = text.replace(/^status: published$/m, "status: published\nauthorReviewed: false");
if (DRY) { console.log(`DRY: would publish ${pick.slug}`); process.exit(0); }
fs.writeFileSync(path.join(dir, pick.f), text);
state.published.push(pick.slug);
state.lastPublishedOn = today;
state.pendingNewsletter = { slug: pick.slug, title: pick.d.title, dek: pick.d.dek, url: `${site.url}/articles/${pick.slug}/`, lane: pick.d.lane };
log(`published ${pick.slug}`);
save();

execSync(`git config user.name "Long Course bot" && git config user.email "bot@longcourse.local"`);
execSync(`git add -A && git commit -m "Publish: ${pick.d.title}" && git push`, { stdio: "inherit" });
console.log("pushed; newsletter is sent by scripts/newsletter.js once the deploy is verified");
