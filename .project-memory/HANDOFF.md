# Handoff

_Updated 2026-11-16_

**PROJECT:** ziki-finance. The Ziki issue tracker (Next.js 16 + Prisma + Postgres) on Supabase, deployed to Cloudflare Workers Free. The feature that must work is Ziki Finance (`docs/plans/finance-prd.md`, not built yet).

**CURRENT POSITION**
- Done: Supabase migrations (INF-CR-001). PBKDF2 password hashing (INF-CR-003). Workers code changes (INF-CR-002). Hyperdrive created. Auto-deploy workflow (INF-D-005). All GitHub secrets and APP_URL set. Memory repaired (INF-CR-004). Finance PRD v0.2 approved as a document (FIN-CR-001).
- In progress: PR #1 (`feat/cloudflare-workers`) is green and waiting for the user to merge. Merging deploys.
- Not started: runtime secrets upload (INF-T-006), Finance feature (FIN-CR-002 awaiting approval), RLS review (INF-T-005), email (INF-I-007).

**LATEST DECISIONS:** INF-D-001 session pooler; INF-D-002 Workers via OpenNext; INF-D-003 PBKDF2; INF-D-004 only Finance must work on Cloudflare; INF-D-005 GitHub Actions deploys main. Finance: FIN-D-001..FIN-D-011 (product defaults; FIN-D-011 = hidden /finance route).

**WORK PERFORMED:** see CHANGELOG.md INF-CR-002 to INF-CR-004. Tests: 6 new hashing tests plus 432 security/auth tests passed locally. On PR #1 all 5 CI checks pass (lint/typecheck/test/build, CLI scenarios, end-to-end, malware scan, Cloudflare Workers build).

**OUTSTANDING ITEMS (priority order)**
1. The user merges PR #1. The deploy job runs migrations, deploys and checks `/api/health`; the check is expected to fail until secrets exist.
2. The user runs `node scripts/cloudflare/upload-secrets.mjs`, then re-runs the deploy, and adds `https://ziki-finance.ibuild-ai.workers.dev/api/auth/callback/google` to the Google OAuth client (INF-T-006).
3. Measure which routes exceed the 10 ms CPU limit (INF-T-007, INF-I-004).
4. Finance: get approval for FIN-CR-002, then start release step 0.
5. Commit `docs/plans/*` (Finance docs, currently untracked) once the user agrees.

**IMPORTANT CONSTRAINTS:** Follow `.project-memory/README.md` (prefixed IDs, add-only edits, one session per folder or worktree). Workers Free only (no paid plan). No AI-assistant attribution in commits, PRs or code. Never reseed or reset a database with real accounts. Never print or commit secrets. Don't change `PASSWORD_PEPPER` once users exist.

**NEXT ACTION:** Merge PR #1, upload secrets, re-run the deploy. Expected: `https://ziki-finance.ibuild-ai.workers.dev/api/health` returns 200.

**Git:** branch `feat/cloudflare-workers` (see `git log`); base `main` at `c9726d1a`.
