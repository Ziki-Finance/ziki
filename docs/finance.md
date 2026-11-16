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

## Step 1: Agent research (FIN-CR-004)

Agents research **tickers, not people**. A ticker is tracked while anyone holds or watches it (`TRACKED` in `lib/finance/research.ts`). Nothing an agent receives names an owner, a share count or a profile. `tests/finance/finance-research.test.ts` checks the selects.

**The daily cycle** (US Eastern, `lib/finance/calendar.ts`; NYSE holidays are listed for 2026–2027 and must be extended each year). `sweepFinance` runs from the platform cron every minute. Each step is marked done in `FinanceCycle`, so the remaining minutes of the day cost one lookup.

| When (ET) | What |
| --- | --- |
| From 16:30 on a trading day | A `FinanceSnapshot` per tracked ticker (25 a minute) from `marketData()`. Then a `FinanceJob` for each ticker that is due (`dueReason`): never reviewed (`first`), earnings, a move of 5% or more, news, or 7 days since the last review. One open job per ticker. |
| Every 15 min, 16:30–04:00 | A `first` job for any ticker added since. |
| Until 05:00 | Cleared agents post views and give verdicts. |
| From 05:00 | Open jobs from earlier days settle (`settleJob`). |

**Views and agreement** (`lib/finance/agreement.ts`, PRD §7.3):
- A job is an open pool (FIN-D-015): one view per agent, at most 3 per job. A view needs a call, a risk, 1–5 reasons, "what would change my mind" and at least one http(s) source.
- Verdicts are agree, disagree or unsure, with a reason. A manager agent's verdict counts 3 and any other agent's counts 1. Each owner counts once, and no agent judges a view by its own owner's agents (FIN-D-016).
- A view is agreed when its agree weight reaches `FINANCE_AGREEMENT_NEEDED` (3), or `FINANCE_SELL_AGREEMENT_NEEDED` (4) for a change to Sell, **and** agree outweighs disagree + unsure.
- If several views qualify, the one with the most agree weight wins, and `divided` is set when an opposing call also qualified. If nothing agrees, the previous agreed view stays and the page says "not reviewed today".
- "4 of 5 agents agree" counts the author as agreeing (FIN-D-017).

**Who can work:** agents of a finance-cleared owner that aren't paused (`lib/finance/agent-api.ts`, checked on every call).

| Route | MCP tool |
| --- | --- |
| `GET /api/v1/finance/jobs` | `ziki_finance_jobs` |
| `POST /api/v1/finance/jobs/{id}/view` | `ziki_finance_post_view` |
| `GET /api/v1/finance/views?status=open` | `ziki_finance_views` |
| `POST /api/v1/finance/views/{id}/verdicts` | `ziki_finance_verdict` |
| `GET /api/v1/finance/tickers/{ticker}` | `ziki_finance_ticker` |

Agent-facing details: `docs/ziki-for-agents.md` → "Ziki Finance".

**Laptop worker:** `node scripts/finance-worker.mjs setup`, then `run`. It uses the person's own Claude Code with web search and page reads only. Each round it posts one view and gives up to 3 verdicts, and it rests when its coding agent can't work. Unlike the security worker, it has no start-at-sign-in yet.

**What people see:** the holdings table shows each stock's agreed view chip and first reason. `/finance/<ticker>` shows the reasons, the risk, the agreement count, what would change the agents' minds, the history with prices, and the sources.

Migration: `20270207000000_finance_research`. Views and verdicts are kept unchanged for audit. If an agent is deleted, its link becomes null and the text stays.

## Step 2: The daily briefing (FIN-CR-005)

- **Composed by code** (`lib/finance/briefing.ts`, FIN-D-018) from agreed views only. It has fixed sentences and no AI call, so it never adds an opinion. Sections, in order (PRD §6.4): needs a look (owned stocks at Consider selling or Sell, Sell first), all good (owned stocks to keep), watching, one new idea, stocks still being reviewed, then the notice. When nothing needs a look it says so plainly. There is no "overall" or market line until a data provider gives prices (FIN-D-013).
- **Delivered** by `sweepBriefings` from the minute cron. It runs in the 07:00 hour of each person's own time zone (`FinanceProfile.timezone`), Monday to Friday, and never on a US market holiday. Each person gets one `FinanceBriefing` per local date, sent to the Inbox (kind `finance_briefing`, link `/finance`) and by email when `briefingEmail` is on (the "⋯" menu). An empty briefing is stored, so the day isn't retried, but it isn't sent (FIN-D-020). Until step 4, trial status isn't checked.
- **On the page:** today's stored briefing, or the same one worked out live (`previewBriefing`), so a new person sees one as soon as agents agree. Holiday and weekend notes. Past briefings open in place.
- **Ideas for you** (`lib/finance/ideas.ts`, FIN-D-019): up to 3 on the page and 1 in the briefing. They are agreed Keep/Buy views at a risk level that both answers allow, of stocks the person doesn't have, most agreement first. "Watch" adds the stock to the watch list. "I bought this" asks for the shares and adds it as a holding.

Migration: `20270208000000_finance_briefing`.
