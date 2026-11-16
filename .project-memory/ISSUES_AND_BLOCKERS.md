# Issues and blockers

> IDs carry a workstream prefix (`FIN-`, `INF-`); see `README.md`.

# FIN: Ziki Finance product
- FIN-B-001 (2026-11-16): Open product questions. RESOLVED 2026-11-16 (defaults accepted, FIN-D-001..FIN-D-010).
- FIN-RISK-001: Personalised buy/sell advice may be regulated (US Investment Advisers Act; the publisher's exclusion may not apply). Legal review blocks public launch (PRD §10, FIN-T-004).
- Open: price in Ziks, reward amounts, data provider, clearance criteria, NGX in v2 (PRD §15).

# INF: Infrastructure and deployment
- **INF-I-001** (2026-11-16): The Supabase direct host is IPv6-only. Resolved by using the session pooler (INF-D-001).
- **INF-I-002** (2026-11-16): Docker is not installed on this machine. It only mattered for Cloudflare Containers, which was rejected (INF-D-002). Not a blocker.
- **INF-I-003** (2026-11-16): Supabase exposes `public` schema tables through its Data API. With RLS disabled, the anon key may read them. Needs review (INF-T-005).
- **INF-I-004** (2026-11-16): The user will **not** use the Workers Paid plan. Workers Free limits (developers.cloudflare.com/workers/platform/limits, read 2026-11-16): **10 ms CPU per request**, 100,000 requests/day, 50 subrequests/request, 5 cron triggers/account, 64 MiB uncompressed Worker size (same on both plans), 1 s startup. Hyperdrive has a free tier (10 configs, ~20 origin connections).
  - Main risk: the 10 ms CPU limit. Known to exceed it: bcryptjs cost 10 (`auth.ts:100` compare; `app/actions/auth.ts:149,386` and `app/actions/settings.ts:73` hash), likely tens of ms of CPU per call. Also at risk: server-rendering heavy pages, the security report PDF (@react-pdf), and the minute cron sweeps. Waiting on the database or the network does not count as CPU time.
  - Not yet measured. The next step is a test build and deploy on the free plan to see which routes go over.
- **INF-I-005** (2026-11-16): Finance PRD vs Workers Free (review of docs/plans/finance-prd.md):
  - **Email (high):** `lib/mail.ts` sends over raw SMTP using `net`/`tls` sockets. Untested on Workers; daily briefings and alerts depend on email. Fallback: an HTTP email API with a free tier.
  - **Subrequests (high):** 50 per request/cron run. Snapshotting every tracked ticker (PRD 7.2) and checking intraday alerts (6.5) need a market-data provider with bulk endpoints, and briefings (one AI call + one email each) must be processed in small batches per cron run.
  - **Requests/day (medium):** 100,000/day. Two every-minute crons use about 2,880. Agent workers polling `GET /api/v1/finance/jobs` (7.4) must poll slowly or the quota runs out.
  - **Cron triggers (low):** 5 per account. Use one every-minute trigger that dispatches all timed steps (16:30 ET snapshot, 17:00 jobs, 05:00 agreement, 07:00 local briefings, 30/90-day scoring).
  - **Stripe (phase 4):** `app/api/stripe/webhook/route.ts` uses sync `constructEvent`; Workers need `constructEventAsync`.
  - **Push alerts (6.5):** not implemented anywhere yet; new work.
  - **Records:** the PRD's decisions and change are FIN-D-001..FIN-D-011 and FIN-CR-001 (renamed by INF-CR-004).
  - Not Cloudflare-related but still a launch blocker: PRD section 10 legal review.
- **INF-I-006** (2026-11-16): The dev machine has little disk (about 1.9 GB free after deleting `.next`) and 12 GB RAM (`tsc` needs `--max-old-space-size`). OpenNext warns that Windows is not fully supported. Builds for Cloudflare run on GitHub Actions (Linux).
- **INF-I-007** (2026-11-16): No `SMTP_*` settings in `.env`; email (and so Finance briefings and alerts) is not configured.
