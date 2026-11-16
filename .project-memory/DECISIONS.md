# Decision register

> **Read `.project-memory/README.md` first.** IDs carry a workstream prefix: `FIN-` for the Ziki Finance product, `INF-` for infrastructure and deployment. Add new entries at the end of their section. Never rewrite or renumber another workstream's entries.
>
> **Repair note (2026-11-16, INF-CR-004):** Two sessions wrote to this file at the same time with the same unprefixed IDs (D-001…, CR-001…). One session's records were overwritten, and a renumbering script altered the other's. This version restores both under the prefixes. The old-to-new ID map is in `README.md`.

# FIN: Ziki Finance product

## Confirmed decisions (2026-11-16): approved by the user as the basis for the PRD draft (not yet approval to implement)
Context: The Finance PRD needed answers to 10 open questions. The agent proposed defaults, and the user replied "Yes, you can draft the PRD using all of this." Approver: user (project owner). Related: FIN-CR-001, `docs/plans/finance-prd.md`.

| ID | Decision | Alternatives considered | Reason / trade-off |
| --- | --- | --- | --- |
| FIN-D-001 | US-listed stocks and ETFs first | NGX, both | Best data availability; NGX deferred to v2 |
| FIN-D-002 | Research framing + "not financial advice" notice; legal review is a launch blocker | Register / licensed partner | Fastest path; regulatory risk remains (FIN-RISK-001) |
| FIN-D-003 | v1 never places trades | Broker execution | Avoids custody and broker-dealer exposure |
| FIN-D-004 | Holdings entered by hand, plus watch-only | Read-only broker link | Simplest; broker link kept in the backlog |
| FIN-D-005 | Only finance-cleared agents (`User.financeClearedAt`) | Any agent | Quality; mirrors security clearance |
| FIN-D-006 | Agents paid per agreed view/verdict, plus an accuracy bonus and a track record | Per briefing; pure performance | Pays for work that is used; the track record rewards accuracy |
| FIN-D-007 | 7-day free trial, then a monthly subscription in Ziks | Free; free first briefing | Uses the existing coins flow |
| FIN-D-008 | Two-question risk profile (risk comfort, horizon) | None; long questionnaire | Minimal friction |
| FIN-D-009 | Daily briefing at about 07:00 local, Mon–Fri, to Inbox + email | Other times/channels | Before US market open |
| FIN-D-010 | Urgent triggers: ±8% day move, trading halt, earnings surprise ≥10%, agreed change to Sell; limit 1/holding/day, 3/person/day | More or fewer triggers | Keeps alerts rare and trusted |
| FIN-D-011 | v1 Finance is a **hidden route**: `/finance` only, with no top-bar tab or any other link, noindex, open to anyone who knows the URL (sign-in still needed to save holdings) | Visible Finance tab next to Security | User decision 2026-11-16: keep v1 out of the main nav for now |

## Design choices made in the PRD draft (recommendations awaiting PRD review)
- FIN-R-006: Agents research per stock, not per person. Personal briefings are put together afterwards (privacy, cost, consistency).
- FIN-R-007: Agreement threshold 3 weighted agrees (Sell change: 4), reusing `managerVoteWeight`.
- FIN-R-008: Rename Settings → Finance (wallet) to Settings → Wallet. SUPERSEDED by FIN-D-011 (2026-11-16): dropped for v1 and moved to the backlog.
- FIN-R-009: Ziki AI only writes up and selects agreed views. It never adds a view of its own.

## Superseded
- FIN-R-008 → dropped for v1 by FIN-D-011.
- FIN-R-001..FIN-R-005 (2026-11-16 recommendations) → became FIN-D-003, FIN-D-002/FIN-R-002 (UX pattern adopted in PRD §5), FIN-D-004, FIN-R-007, FIN-D-009. (The text of FIN-R-001 to FIN-R-005 was not kept; unknown.)

## Implementation decisions (2026-11-16, release steps 0–2)
- FIN-D-012 (confirmed by the user, 2026-11-16): build release steps 0, 1 and 2 in that order, each on its own branch (`feat/finance-step0-foundations`, `feat/finance-step1-agent-research`, `feat/finance-step2-briefing`). Each branch starts from the one before it, so step 1's PR includes step 0 until step 0 is merged.
- FIN-D-013 (assumption awaiting validation): no market-data provider has been chosen yet (PRD §9.3), so the code talks to the provider through one interface (`lib/finance/market-data.ts`). Until a provider is wired in, ticker search uses a built-in list of well-known US stocks and ETFs, and prices show "—". Swapping in Polygon, Alpaca or FMP later should change that one file. Options considered: block steps 0–2 on the provider choice (rejected, because the user asked to build now); hard-code one provider (rejected, because the provider isn't chosen yet).
- FIN-D-014 (assumption awaiting validation): the legal opinion (PRD §10) blocks the public launch, not building. This follows `docs/plans/finance-ideas.md`.
- FIN-D-015 (implementation choice within FIN-CR-004): a review job is an open pool, not held by one agent. Any cleared agent may post one view per job, up to 3 views per job, until the job settles at 05:00 ET. This is how two opposing views can both reach agreement (PRD §7.3). Rejected: one agent takes a job (as Security does), because then there would only ever be one view to judge.
- FIN-D-016 (implementation choice within FIN-CR-004): an agent may not give a verdict on a view written by any agent of the same owner, which is stricter than "not its own view". Verdicts are tallied once per owner at the highest weight (`weightedTally`). A manager agent's verdict counts 3, the platform's default `managerVoteWeight`. The 4-verdict bar applies to any change to Sell, not only on held stocks, because every tracked ticker is held or watched by someone.
- FIN-D-017 (implementation choice within FIN-CR-004): "4 of 5 agents agree" counts the view's author as agreeing: (agree verdicts + 1) of (all verdicts + 1), counted per owner.
- FIN-D-018 (implementation choice within FIN-CR-005, open to review): v1's briefing is put together by code from agreed views. It has fixed sentences and no AI call. That guarantees it "only rewrites and selects" (FIN-R-009) and never adds an opinion, costs nothing, and fits the Workers Free CPU limit. An AI rewrite of the wording can be added later behind the same `BriefingContent`. Rejected for now: calling Ziki's AI per person per day.
- FIN-D-019 (implementation choice within FIN-CR-005): "fits the person" for ideas means the risk level is allowed by **both** answers. Careful allows low; Balanced allows low and medium; Adventurous allows all. Within 1 year allows low; 1–5 years allows low and medium; 5+ years allows all. Only agreed Keep/Buy views of stocks the person doesn't already have appear, most agreement first.
- FIN-D-020 (implementation choice within FIN-CR-005): until release step 4 (money), every person with a profile gets briefings, trial or not. Step 4 adds the subscription check. A briefing with no agreed views is stored, so the day isn't retried, but it isn't sent.

# INF: Infrastructure and deployment

## INF-D-001 — Connect to Supabase through the session pooler
- **Date:** 2026-11-16 · **Status:** Confirmed (implemented to unblock the user's migration request)
- **Context:** The direct connection host `db.<ref>.supabase.co` is IPv6-only; migrations failed with P1001 from this machine.
- **Options:** (a) session pooler, port 5432 (IPv4); (b) buy the Supabase IPv4 add-on; (c) transaction pooler, port 6543 (not suitable for migrations).
- **Decision:** (a). **Consequences:** fine for migrations and as Hyperdrive's origin.
- **Related:** INF-CR-001.

## INF-D-002 — Run on Cloudflare Workers through OpenNext
- **Date:** 2026-11-16 · **Status:** Confirmed (user: "the plan was always Cloudflare Workers + Supabase")
- **Context:** The app assumed a long-running Node process: in-process cron, a start-up backfill, Prisma's native engine, files read from disk.
- **Options:** (1) Cloudflare Containers running the existing Dockerfile (needs Workers Paid); (2) Workers via OpenNext (`@opennextjs/cloudflare`).
- **Decision:** (2). (1) was recommended first and rejected by the user.
- **Related:** INF-CR-002, INF-I-004.

## INF-D-003 — Lighter password hash for the Workers Free plan
- **Date:** 2026-11-16 · **Status:** Confirmed (user asked for it)
- **Context:** bcryptjs cost 10 took about 240 ms of CPU on the dev laptop; the Workers Free limit is 10 ms per request. The user will not buy Workers Paid (INF-I-004).
- **Options:** (a) PBKDF2-SHA256 through Web Crypto, with a configurable iteration count and an optional server-side pepper; (b) Google sign-in only; (c) stay on bcrypt (fails on Free).
- **Decision:** (a). New hashes use PBKDF2; old bcrypt hashes still verify and are upgraded on the next successful sign-in.
- **Trade-off:** Fewer iterations than OWASP's guidance (600,000). If the database leaks, passwords are easier to crack offline. The pepper (`PASSWORD_PEPPER`, a Worker secret that is not stored in the database) offsets this when only the database leaks.
- **Related:** INF-CR-003.

## INF-D-004 — Non-Finance features may stay broken on Cloudflare
- **Date:** 2026-11-16 · **Status:** Confirmed (user)
- **Decision:** Only the Finance feature (docs/plans/finance-prd.md) must work on Cloudflare. Features that exceed the Free limits (for example the security report PDF) may be disabled rather than reworked.

## INF-D-005 — Deploy automatically from main through GitHub Actions
- **Date:** 2026-11-16 · **Status:** Confirmed (user: "We cannot do manual deploy … it's going to be a collaboration")
- **Context:** Several people will push code; deploys must not depend on one person's machine. The repo's `deploy.yml` called a Coolify webhook, but the repo `Ziki-Finance/ziki` has no Actions secrets, so that step could not deploy.
- **Options:** (a) GitHub Actions running `wrangler deploy` after CI passes on main; (b) Cloudflare Workers Builds (connect the repo in the dashboard).
- **Decision:** (a). It keeps the existing gates (CI green + Malware Scan) and runs `prisma migrate deploy` before the new code goes live.
- **Consequences:** The Coolify deploy is removed, and so are staging deploys (no staging Worker exists). The repo needs secrets CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and DATABASE_URL, plus variable APP_URL. Runtime secrets stay in Cloudflare (`scripts/cloudflare/upload-secrets.mjs`, once). One manual bootstrap deploy creates the Worker and its URL.
- **Related:** INF-CR-002.

## INF-D-006 — Run the platform sweeps on GitHub Actions, not on the Worker
- **Date:** 2026-11-16 · **Approved by:** the user ("Yes, move them")
- **Context:** The Worker's Cron Trigger (`* * * * *`, INF-CR-002) ran `lib/cron/runner.ts` every minute. Cloudflare reported each run using 600 ms – 1.66 s of CPU and ~35 subrequests, against Workers Free's 10 ms per invocation (INF-I-004), so most runs failed (`exceededResources`) and the account hit its CPU limit warning. The sweeps (claim release, offer/plan expiry, stakes, withdrawals, webhook delivery, retention, search index, and now Finance's research cycle and briefings) are still needed by agents and by Finance.
- **Options:** (a) Keep the trigger, every 5–15 minutes: fewer failures, but runs still exceed 10 ms. (b) Turn the sweeps off: no CPU use, but claims and offers never time out and Finance's daily cycle never runs. (c) Run the same sweeps on Node in a scheduled GitHub Actions workflow. (d) Workers Paid: rejected (INF-I-004).
- **Decision:** (c), every 5 minutes (GitHub's shortest schedule). The repo is public, so Actions minutes are free.
- **Consequences:** Sweeps can run a few minutes late (GitHub delays scheduled runs). Every sweep is idempotent and lease-guarded, and the Finance steps use time windows, so late or skipped runs are safe. Webhook delivery can work again (it needs Node's `https`). The sweeps' secrets must also exist as GitHub secrets (`scripts/cron/sweep-secrets.json`). Supersedes the Cron Trigger part of INF-CR-002.
- **Related:** INF-CR-006, INF-I-008.
