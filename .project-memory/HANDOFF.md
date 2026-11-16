# Handoff

_Updated 2026-11-16_

**PROJECT:** ziki-finance. The Ziki issue tracker (Next.js 16 + Prisma + Postgres) on Supabase, deployed to Cloudflare Workers Free. The feature that must work is Ziki Finance (`docs/plans/finance-prd.md`, not built yet).

**CURRENT POSITION**
- Done: Supabase migrations (CR-000). PBKDF2 password hashing (CR-003, verified locally). Workers code changes (CR-002). Hyperdrive created. Auto-deploy workflow written (D-016).
- In progress: first CI build and deploy of branch `feat/cloudflare-workers`.
- Not started: repo secrets and variables for deploy, runtime secrets upload, Finance feature, RLS review (T-005), email (I-007).

**LATEST DECISIONS:** D-012 session pooler; D-013 Workers via OpenNext; D-014 PBKDF2; D-015 only Finance must work on Cloudflare; D-016 GitHub Actions deploys main. The PRD's D-001 to D-011 and CR-001 are missing (see DECISIONS.md).

**WORK PERFORMED:** see CHANGELOG.md CR-002 and CR-003. Tests: 6 new hashing tests plus 432 security/auth tests passed; `tsc` passed after CR-003. The Cloudflare changes have not been typechecked or tested locally; CI will run lint, tsc, tests and build.

**OUTSTANDING ITEMS (priority order)**
1. The user sets repo secrets CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and DATABASE_URL, and repo variable APP_URL (`https://ziki-finance.<workers.dev subdomain>`).
2. CI green on the PR, then merge to main, which deploys.
3. The user runs `node scripts/cloudflare/upload-secrets.mjs` once the Worker exists; then re-run the deploy and check `/api/health`.
4. Set `AUTH_URL` in `wrangler.jsonc` vars to APP_URL, and add APP_URL + `/api/auth/callback/google` to the Google OAuth client.
5. Measure which routes exceed the 10 ms CPU limit (I-004).

**IMPORTANT CONSTRAINTS:** Workers Free only (no paid plan). Never reseed or reset a database with real accounts. Never print or commit secrets. Don't change `PASSWORD_PEPPER` once users exist.

**NEXT ACTION:** Watch the PR's CI. If the OpenNext build fails, fix it on the branch. Expected outcome: deploy job green and `/api/health` returning 200 on APP_URL.

**Git:** branch `feat/cloudflare-workers` (see `git log`); base `main` at `c9726d1a`.
