# Automation and permissions register

Last updated 15 September 2026. Everything here runs without Yigit unless a row says otherwise. Pause any of it by editing `ops/state.json` (flags under `paused`) or by emailing the command to the publication inbox from maslanay68@gmail.com.

## 1. Scheduled publish and newsletter

| | |
| --- | --- |
| Trigger | GitHub Actions cron, Tuesdays 12:00 UTC (7:00 AM Central in summer, 6:00 AM in winter). Manual run from the Actions tab. |
| Execution | GitHub Actions runner, `scripts/publish.js` (the newsletter send is workflow 1b) |
| Permissions | Repo contents write (built in GITHUB_TOKEN) |
| Inputs | Article files with `status: review` or `scheduled`, `date` on or before today, gate rules; `ops/state.json` |
| Outputs | One article flipped to `published`, commit, Netlify deploy, `pendingNewsletter` set in state for workflow 1b |
| Approval conditions | Standard gate: none needed (publishes as "Long Course desk" until Yigit marks `authorReviewed: true`). Human gate: requires `reviewer:` set in frontmatter. `paused.publishing` or `paused.newsletter` halts the respective step. |
| Logs | Actions run logs; `ops/state.json` log array; owner view |
| Retry and dedupe | Concurrency group prevents parallel runs. `state.published` and `state.newsletterSent` prevent repeats. If the deploy is not live in 8 minutes the newsletter is not sent and the run fails; the next run sends it once the URL is live. One article per day, hard limit. |
| Failure alerts | GitHub emails the repo owner on any failed run. The inbox job labels it /Systems and includes it in the digest. |
| Pause and rollback | Set `paused.publishing: true`. To unpublish, set the article to `status: review` and remove it from `state.published`; Netlify redeploys on push. |
| Cost | $0 (public repo Actions minutes) |

## 1b. Newsletter send (Claude scheduled task)

| | |
| --- | --- |
| Trigger | Claude scheduled task, Tuesdays 12:30 UTC (30 minutes after the publish job) |
| Execution | Cloud session with the Gmail and Drive connectors; no computer needed |
| Inputs | `ops/state.json` `pendingNewsletter` (public raw file), the Drive folder "Long Course subscribers" |
| Outputs | One email per batch of up to 50 BCC recipients from Yigit's Gmail, subject = article title, body = dek, link, unsubscribe link; a Drive marker file `sent-<slug>` |
| Dedupe | Skips if `sent-<slug>` exists; skips if the article URL is not live |
| Pause | `paused.newsletter` in state.json |
| Failure | Emails Yigit "Long Course: job failed (newsletter)" |
| Cost | Claude usage only; Gmail free |

## 2. Weekly stats snapshot

| | |
| --- | --- |
| Trigger | GitHub Actions cron, Sundays 22:00 UTC |
| Execution | `scripts/stats.js` |
| Permissions | Optional secret `GOATCOUNTER_API_TOKEN`; without it the public counter endpoint is used; repo write for the snapshot commit |
| Outputs | `ops/stats.json` (pageviews, top pages, subscribers, uptime codes), which the owner view renders on the next deploy |
| Failure | Run fails and emails; the snapshot notes which source failed |
| Cost | $0 |

## 3. Daily health check

| | |
| --- | --- |
| Trigger | GitHub Actions cron, 11:30 UTC daily |
| Checks | Home, archive, contact, sitemap, feed return 200; pre-publish checks pass; site builds |
| Failure | GitHub failure email to Yigit |
| Cost | $0 |

## 4. Inbox triage and auto replies (Claude scheduled task)

| | |
| --- | --- |
| Trigger | Claude scheduled task, 12:30 and 22:30 UTC daily |
| Execution | Fresh Claude session with the Gmail connector (Yigit's account) and, for owner commands, the GitHub token stored in Drive |
| Scope | Only messages to the +longcourse alias, Netlify form notifications, Buttondown and GitHub notifications, and threads already labelled Long Course |
| Policy | `docs/inbox-policy.md` |
| Dedupe | The /Auto-replied label on the thread; never replies twice |
| Approval | `paused.autoreply` stops all outbound replies; routing and labelling continue |
| Logs | Gmail labels; a one line summary appended to `ops/state.json` log via commit when there is something to report |
| Failure | If the task cannot run it is listed in the scheduled task history; the weekly digest reports the last successful run time |
| Cost | Claude usage only |

## 5. Weekly owner digest (Claude scheduled task)

| | |
| --- | --- |
| Trigger | Claude scheduled task, Sundays 23:30 UTC (after the stats snapshot) |
| Inputs | `ops/stats.json`, `ops/state.json`, article files, Gmail labels |
| Output | One email to maslanay68@gmail.com: what published, what readers responded to, what needs Yigit (reviews due, flagged messages), failures, plan for the week |
| Cost | Claude usage only |

## 6. Weekly draft (Claude scheduled task)

| | |
| --- | --- |
| Trigger | Claude scheduled task, Wednesdays 13:00 UTC |
| Execution | Takes the next backlog item from `docs/editorial-plan.md`, researches with verified sources under `docs/voice-guide.md`, writes the draft, runs checks, commits with the Drive-stored GitHub token as `status: review` with the next open Tuesday date |
| Approval | Standard gate drafts publish automatically two Tuesdays later unless Yigit edits or holds them. Human gate drafts wait for a named reviewer. `paused.publishing` also stops drafting from scheduling dates. |
| Dedupe | One draft per week; skips if a draft already exists for the next open slot |
| Cost | Claude usage only |

## 7. Netlify deploy

Triggered by every push to `main`. Branch `preview` renders drafts (noindex). Form submissions email the publication alias. Cost $0 on the free plan.

## Secrets and where they live

| Secret | Where | Who can read |
| --- | --- | --- |
| GitHub fine-grained token (longcourse repo, contents + workflows) | Google Drive doc `longcourse-github-token` in Yigit's Drive | Yigit and Claude sessions on his account |
| GoatCounter API token (optional) | GitHub Actions secret | Actions runner only |
| Gmail, Drive, Calendar | OAuth connectors on Yigit's Claude account | Claude sessions on his account |

Rotate the GitHub token yearly (it expires). Revoking it disables the Claude write jobs and nothing else.

## What still needs Yigit

- Reading and approving articles if he wants his byline on them (otherwise they publish as "Long Course desk").
- Naming a reviewer for human gate pieces.
- Replies to messages labelled /Needs Yigit.
- Buying a domain, if wanted.
- Any outreach: drafts are prepared, nothing is sent.
