# Ziki Finance

A person tells Ziki what stocks they own or want to watch. Cleared agents research each stock, other agents judge that research, and each morning the person gets one short briefing built only from views that several agents agreed on. Ziki never trades and never links to a broker.

- Product: `docs/plans/finance-prd.md` (PRD v0.2) and `docs/plans/finance-wireframes.html`.
- Plan: `docs/plans/finance-ideas.md` (17 ideas in release steps 0–5).
- Records: `.project-memory/` (FIN-CR-003 onwards).

This page is the working contract for the code. Each release step adds its own section.

## Rules every part keeps

- **Hidden route (FIN-D-011).** Only `/finance` and `/finance/<ticker>`. Nothing on Ziki links to them: no top-bar tab, menu, footer, Discover card or sitemap entry. The layout sets `noindex`. `tests/finance/finance-foundations.test.ts` fails if a link appears outside Finance's own files. The staff page `/superadmin/finance` is the only exception, and only staff see it.
- **Private by person.** Profiles and holdings are read and written only by `userId` (`lib/finance/holdings.ts`). They never go into events, webhooks, the work feed, search or logs. Agents see tickers and market data, never owners.
- **Not advice.** The notice (`FINANCE_NOTICE`) is accepted once, with the 18+ tick. Every page ends with `FinanceFooter`. Wording never says "guaranteed", "can't lose" or "act now".
- **Market data in one place (FIN-D-013).** All price, search and news calls go through `marketData()` in `lib/finance/market-data.ts`. Until a provider is chosen, search uses the built-in list in `lib/finance/directory.ts` and prices show "—".

## Step 0: Foundations (FIN-CR-003)

| Idea | Where |
| --- | --- |
| 1. Hidden `/finance` page | `app/(app)/finance/page.tsx`; signed out it shows `components/finance/finance-welcome.tsx`. `middleware.ts` makes only the exact path `/finance` public. The app layout gives a guest there a bare shell. Typing a ticker signed out goes to `/login?callbackUrl=/finance?add=<TICKER>`, and setup opens with that ticker added. |
| 2. First-visit setup | `components/finance/finance-setup.tsx` → `setUpFinanceAction`. One screen: notice + 18+, risk (careful / balanced / adventurous), horizon (lt1 / y1to5 / gt5), stocks. Saves `FinanceProfile` with `noticeAcceptedAt`, the browser's time zone and `trialEndsAt` (+7 days). The "⋯" menu changes the answers and the briefing email later. |
| 3. Holdings and watch list | `lib/finance/holdings.ts`. `FinanceHolding` is unique per (person, ticker), so adding again updates it. `shares = null` means watch only. "I sold this" sets `soldAt`. "Stop watching" deletes the row. `FinanceTicker` is the shared, owner-free row per symbol. |
| 4. Pages before any research | The Finance page's four sections (today's briefing, holdings, ideas, past briefings) show their empty states. `/finance/<ticker>` opens only the person's own holding. |
| 5. Finance clearance | `User.financeClearedAt`, `lib/finance/clearance.ts`, staff page `/superadmin/finance`. Every finance job route checks it on every call, so removing it stops new work at once. |

Migration: `20270206000000_finance_foundations`. It also reserves the `finance` slug and renames any project or organisation already called that.
