# Long Course: owner guide

Aim: about 15 minutes a week. Everything below is optional except the weekly digest read.

## Where things are

| Thing | Where | Login |
| --- | --- | --- |
| Live site | https://longcourse.netlify.app | none |
| Owner view (private, unindexed) | https://longcourse.netlify.app/owner/ | none (obscure URL; contains nothing secret) |
| Content and code | https://github.com/yaslan00/longcourse | GitHub (Google sign-in) |
| Job logs and manual runs | https://github.com/yaslan00/longcourse/actions | GitHub |
| Hosting, forms, deploys | https://app.netlify.com/projects/longcourse | Netlify (Google sign-in) |
| Analytics | https://longcourse.goatcounter.com | GoatCounter |
| Newsletter list | Google Drive folder "Long Course subscribers" | Google |
| Publication inbox | Gmail label "📰 Long Course" (alias maslanay68+longcourse@gmail.com) | Gmail |

## The weekly loop (15 minutes, Monday 5:00 PM, on your calendar)

1. Read the Sunday digest email "Long Course weekly".
2. Answer anything under "needs Yigit" in Gmail label "📰 Long Course/Needs Yigit".
3. If you want your byline on a draft, read it on GitHub and reply to the digest (or email the alias from your own address) with `approve <slug>`. Otherwise it publishes on schedule under "Long Course desk".
4. Human gate pieces (eating disorder adjacent, supplements, clinical topics) only publish after `reviewed <slug> by <Name, credentials>`. You can name yourself; an RD reviewer is better and the byline will say who reviewed.

## Commands you can email to the inbox (from maslanay68@gmail.com only)

`pause publishing` / `resume publishing`, `pause newsletter` / `resume newsletter`, `pause autoreply` / `resume autoreply`, `approve <slug>`, `reviewed <slug> by <name>`. The inbox job applies them at 7:30 AM and 5:30 PM Central and replies "Done".

Same switches by hand: edit https://github.com/yaslan00/longcourse/edit/main/ops/state.json and flip a flag to true or false.

## How publishing works

Every Tuesday 7:00 AM Central (6:00 AM after the clocks change), a GitHub job picks the one article whose date has arrived and whose gate is satisfied, marks it published, and Netlify rebuilds the site within a minute. Once the page is live, a Claude scheduled task (Tuesday 7:30 AM Central) sends the letter from your Gmail to the confirmed list in Drive, in BCC batches, and leaves a "sent-<slug>" marker file in the Drive folder so it never sends twice. The publish job never publishes two articles in a day.

Every Wednesday a Claude scheduled task drafts the next article from the 90 day plan and emails you the link. Drafts land as `status: review` with a Tuesday date two or more weeks out, so you always have at least one week to read or hold them.

## Editing an article yourself

Open the file under src/articles on GitHub, click the pencil, edit, Commit. Frontmatter fields that matter: `status` (review, scheduled, published), `date` (publish Tuesday), `reviewGate` (standard or human), `reviewer`, `authorReviewed`, `nextReview`. Never type an em dash; the build check refuses it.

## Adding a new article by hand

Copy an existing file, change the slug, write, set `status: review` and a future Tuesday. Or ask Claude in any session; it follows docs/voice-guide.md.

## If something breaks

- Site down or build failing: GitHub emails you a failed "Daily health check" or "Build check". Open the run, read the last red step. Most fixes are a typo in a frontmatter field.
- Newsletter did not go out: the publish job retries the send on its next run once the article URL returns 200. Check the Actions log.
- Auto reply said something wrong: email `pause autoreply` to the inbox, then tell Claude what happened.
- Roll back a published article: set its `status: review` and remove its slug from `published` in ops/state.json; the site rebuilds without it.

## Backups

The GitHub repo is the backup: every article, page, image, and setting, with full history. To take a copy: GitHub, Code, Download ZIP. To restore anywhere: `npm install && npm run build` produces the whole site in `_site`. The subscriber list is the set of files in the Drive folder "Long Course subscribers" (one file per address; an "unsub-" file cancels it).

## Costs

$0 per month today. Gmail sends up to about 500 recipients a day, which covers the first year comfortably; past that, move the list to a newsletter service (the Drive folder exports in minutes). A custom domain runs about $10 to $15 per year if you want one; longcourse.co and similar are worth checking.

## What Claude does and does not do on its own

Does: draft one article a week, run pre-publish checks, triage and answer routine inbox mail, flag the rest, send the Sunday digest. Does not: publish anything with your byline without your approval, send outreach or pitches (drafts only), buy anything, change account settings, or answer medical questions.
