import fs from "node:fs";
function read(p, fallback) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; } }
export default function () {
  return {
    state: read("ops/state.json", { paused: {}, published: [], newsletterSent: [], log: [] }),
    stats: read("ops/stats.json", null),
    repo: "https://github.com/yaslan00/longcourse"
  };
}
