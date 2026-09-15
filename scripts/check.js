// Pre-publish checks: no em or en dashes, required frontmatter, sources present, no dup slugs.
import fs from "node:fs";
import path from "node:path";
const dir = "src/articles";
let bad = 0;
const req = ["title", "dek", "lane", "date", "status", "reviewGate", "author", "nextReview"];
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
  const s = fs.readFileSync(path.join(dir, f), "utf8");
  if (/[—–]/.test(s)) { console.error(`${f}: contains an em or en dash`); bad++; }
  const fm = (s.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
  for (const k of req) if (!new RegExp(`^${k}:`, "m").test(fm)) { console.error(`${f}: missing ${k}`); bad++; }
  if (!/## Sources and notes/.test(s)) { console.error(`${f}: missing sources section`); bad++; }
  if (/reviewGate: human/.test(fm) && /status: (published|scheduled)/.test(fm) && !/reviewer: .+/.test(fm)) { console.error(`${f}: human-gated article scheduled without a named reviewer`); bad++; }
}
for (const f of ["src", "docs", "ops"]) {
  for (const file of walk(f)) {
    const s = fs.readFileSync(file, "utf8");
    if (/[—–]/.test(s)) { console.error(`${file}: contains an em or en dash`); bad++; }
  }
}
function* walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) yield* walk(p); else if (/\.(md|njk|json|js|css|html|txt)$/.test(e.name)) yield p; } }
if (bad) { console.error(`${bad} problem(s)`); process.exit(1); } else console.log("checks passed");
