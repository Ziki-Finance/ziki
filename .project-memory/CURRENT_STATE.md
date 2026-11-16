# Current State

_Last updated: 2026-11-16_

## Summary
The Ziki issue tracker (Next.js 16, Prisma 6, PostgreSQL) is being set up on a new **Supabase** database and deployed to **Cloudflare Workers (Free plan)**. The feature that must work is **Ziki Finance** (`docs/plans/finance-prd.md`, draft v0.2, not yet built). Other features may stay broken on Cloudflare (D-015).

## Database (Supabase)
- Project ref `nsdgkigavaqbxlasfans`, AWS eu-west-1. Direct host is IPv6-only; `.env` uses the session pooler `aws-1-eu-west-1.pooler.supabase.com:5432` (D-012).
- All 235 migrations applied 2026-11-16 (CR-000, verified). Not seeded.

## Cloudflare
- Decided: Workers via OpenNext, Free plan only (D-013, I-004). Implementation (CR-002) not started.
- Done toward it: lighter password hash (CR-003): PBKDF2 via Web Crypto replaces bcrypt for new hashes.

## Finance feature
- PRD exists; no code yet. Workers-Free risks listed in ISSUES_AND_BLOCKERS.md I-005.
