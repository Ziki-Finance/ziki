# Current State

_Last updated: 2026-11-16_

> IDs carry a workstream prefix (`FIN-`, `INF-`); see `README.md`.

## Summary
The Ziki issue tracker (Next.js 16, Prisma 6, PostgreSQL) runs on a **Supabase** database and is set up to deploy to **Cloudflare Workers (Free plan)** from `main`. The feature that must work is **Ziki Finance** (`docs/plans/finance-prd.md` v0.2, approved as a document; no code yet). Other features may stay broken on Cloudflare (INF-D-004).

## Database (Supabase)
- Project ref `nsdgkigavaqbxlasfans`, AWS eu-west-1. The direct host is IPv6-only, so `.env` uses the session pooler `aws-1-eu-west-1.pooler.supabase.com:5432` (INF-D-001).
- All 235 migrations applied 2026-11-16 (INF-CR-001, verified). Not seeded.

## Cloudflare (INF)
- Workers via OpenNext, Free plan only (INF-D-002, INF-I-004). Code done (INF-CR-002) on branch `feat/cloudflare-workers`, PR #1 (Ziki-Finance/ziki), all checks green.
- Deploys from `main` through GitHub Actions after CI and the malware scan (INF-D-005). App URL: `https://ziki-finance.ibuild-ai.workers.dev`. Hyperdrive `ziki-supabase` exists.
- Not yet deployed. Runtime secrets are uploaded after the first deploy (INF-T-006).

## Finance feature (FIN)
- PRD v0.2 and wireframes approved as documents (FIN-CR-001). The v1 plan as 17 ideas is PROPOSED (FIN-CR-002). Workers-Free risks for it: INF-I-005.
