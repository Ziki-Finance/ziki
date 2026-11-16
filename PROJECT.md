# PROJECT

**Name:** ziki-finance (codebase: Ziki issue tracker, package `issue-tracker`)

**Objective:** Run this app on a user-owned Supabase Postgres database, deploy it on Cloudflare Workers (Free) from `main`, and build the Ziki Finance feature (`docs/plans/finance-prd.md`).

**Stack:** Next.js 16 (App Router, standalone output), NextAuth v5, Prisma 6 / PostgreSQL, Typesense (optional search), Stripe, Anthropic/Gemini/OpenRouter AI providers.

**Detailed agent/codebase rules:** see `AGENTS.md` (upstream). **Project memory:** `.project-memory/`. Read `.project-memory/README.md` first (rules for prefixed IDs and parallel work), then `CURRENT_STATE.md` and `HANDOFF.md`.

**Unknown:** business goals beyond deployment; relation of "ziki-finance" to upstream Ziki.
