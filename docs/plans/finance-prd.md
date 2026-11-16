# Ziki Finance — Product Requirements (PRD)

| | |
| --- | --- |
| Status | **Draft v0.2 — awaiting review** (FIN-CR-001) |
| Date | 2026-11-16 (v0.2: hidden /finance route, FIN-D-011) |
| Owner | Product (to be confirmed) |
| Related | `docs/security-checks.md` (the pattern this follows), `.project-memory/DECISIONS.md` (FIN-D-001 to FIN-D-011), `docs/plans/finance-wireframes.html` |

> This is a product draft, not legal advice. **Section 10 (Compliance) is a launch blocker.** Personal buy and sell recommendations may be regulated investment advice.

---

## 1. Summary

Ziki Finance lets someone who knows little about the stock market tell Ziki what they own, or what they want to watch. Agents then do the research. Each morning the person gets one short **daily briefing**: what to keep, what to consider selling, and a few new ideas that match how much risk they are comfortable with. When something really needs their attention, they get an **urgent alert**. Ziki never trades for them. They act on their own broker.

It works the way Ziki already does: **agents do the work, several agents must agree before anything reaches the person, and agents are paid for work that is used.**

## 2. Problem

- Most people don't have the time or knowledge to follow companies, read earnings reports or tell normal market noise from real news.
- The tools that exist are either dashboards full of charts (too much) or tips with no reasoning behind them (too little, and not trustworthy).
- Ziki already has a network of agents that can research, judge each other's work and be paid for it. That is exactly what stock research needs.

## 3. Goals and non-goals

**Goals**
1. A new user can add their holdings and see their first briefing **in under 3 minutes**.
2. Every recommendation has a **plain-English reason**, a risk level, and the share of agents that agree.
3. The briefing is the main channel. It is read in **under 2 minutes**.
4. Urgent alerts are rare enough to trust: **at most 3 per person per day**, and usually none.
5. Results are honest. The person can see how past recommendations actually did, the bad calls included.

**Non-goals (v1)**
- Placing, routing or automating trades.
- Linking to a broker. Holdings are entered by hand.
- Options, crypto, forex, bonds, mutual funds. **US-listed stocks and ETFs only.**
- Real-time trading tools, charts beyond a simple sparkline, technical-analysis screens.
- Promising profit. Ziki never says or implies that returns are guaranteed.

## 4. Who it's for

| Persona | Needs |
| --- | --- |
| **Beginner investor** (primary) | Owns a few stocks or an ETF and isn't sure whether to keep them. Wants to be told what matters, in plain words. |
| **Curious saver** | Owns nothing yet. Wants to watch a few ideas before putting money in. Uses "Just watch". |
| **Agent owner** (supply side) | Has a cleared agent that can research companies. Wants paid work. |

## 5. Product principles

1. **One page, one box.** Just like Security: an empty page with one box, results on the same page, history below. No wizard and no dashboard.
2. **Explain everything in plain words.** No jargon without a one-line explanation. A ticker always appears with the company name.
3. **Agreement before advice.** A single agent's opinion is never shown to a person.
4. **Quiet by default.** One briefing a day. Alerts only for the defined triggers.
5. **Honest track record.** Past calls stay visible with their real outcomes.
6. **Never touch money.** Ziki shows; the person decides and acts elsewhere.

## 6. User experience

### 6.1 Where it lives (hidden in v1, FIN-D-011)
- Route: **`/finance`**. **v1 adds no link to it anywhere.** There is no top-bar tab, menu item, footer link, Discover card or sitemap entry. The top bar (`components/app-header.tsx`) is unchanged.
- **The only way in is the URL.** Anyone who knows it can open it. There's no invite list, feature flag or allow-list.
- Signed out, `/finance` shows one box ("What do you own? Type a ticker") and an example briefing. Typing a ticker asks the person to sign in, using Ziki's usual sign-in, and then the flow continues. Holdings, briefings and alerts need an account, because they belong to a person.
- The page is marked `noindex` and kept out of `sitemap.xml` and `robots`, so search engines don't list it. It stays unlisted but not secret: anyone with the link can use it.
- Briefing and alert emails link straight to `/finance`, so returning users never need the URL again.
- Inbox items of kind `finance_briefing` and `finance_alert` link to `/finance`. That only reaches people who have already signed up.
- Adding a visible top-bar tab is a later decision (see the idea backlog).

> The Settings → Finance (wallet) rename from draft v0.1 is dropped for v1. With no Finance tab, there's nothing for it to be confused with. It moves to the backlog.

### 6.2 First visit (onboarding)
1. **Agree to the notice** (once): "Ziki Finance shares research from AI agents. It is not personal financial advice. You make your own decisions, and investing can lose money." Tick box + Continue. Stored with a timestamp.
2. **Two questions**, one screen:
   - *How do you feel about risk?* Careful · Balanced · Adventurous
   - *When might you need this money?* Within 1 year · 1–5 years · 5+ years
3. **Add what you own**: one box that autocompletes by ticker or company name, then the number of shares (the average price paid is optional). Or **Just watch**: pick tickers with no quantity.
4. Done. The page shows "Your first briefing is being prepared" with live progress. If agreed views already exist for the tickers (section 7.1), the first briefing is ready within minutes. Otherwise it arrives by the next morning at the latest.

### 6.3 The Finance page (top to bottom)
1. **Today's briefing**: the latest briefing, inline (see 6.4).
2. **Your holdings**: one row each: company · shares · today's change · the agents' view chip (**Keep**, **Consider selling** or **Sell**) · one-line reason. Click a row to open the holding (6.6).
3. **Ideas for you**: up to 3 new stocks matching the person's risk profile, each with a short reason, a risk level (Low / Medium / High) and the agreement level ("4 of 5 agents agree"). "Watch" adds it to the watch list. "I bought this" turns it into a holding.
4. **Past briefings**: a dated list. Past recommendations show how they did since they were made.

The page has no charts other than a 30-day sparkline per holding. Filters, sorting and settings go in a single "⋯" menu.

### 6.4 The daily briefing
Sent **about 7:00 in the person's local time, Monday to Friday**, to Inbox (new kind `finance_briefing`) and email (on by default, off in Settings → Preferences). Same content in both. Structure:

```
Good morning. Here's your portfolio for Tue 17 Nov.

Overall: Your holdings rose 1.2% yesterday (S&P 500: +0.8%).

Needs a look (1)
  • Consider selling ACME Corp (ACME): sales fell for the second quarter
    and two big customers left. 4 of 5 agents agree. Risk: High.

All good (3)
  • Keep Contoso (CTSO), Fabrikam (FBK), Vanguard S&P 500 ETF (VOO)

New idea (1)
  • Northwind (NWND): growing steadily, low debt. Fits a Balanced profile.

What changed in the market: one or two plain sentences.

This is research from AI agents, not financial advice.
```

Rules:
- **Lead with what needs action.** If nothing does, say so: "Nothing needs your attention today."
- At most **1 new idea per day** in the briefing. More stay on the page.
- No briefing is sent on US market holidays. The page says why.

### 6.5 Urgent alerts
Inbox (kind `finance_alert`, shown as urgent) plus email, plus push where enabled. Sent only for these **triggers**:

| Trigger | Source |
| --- | --- |
| A holding moves **8% or more** within the trading day | Code (price feed) |
| A holding's trading is **halted** | Code (exchange status) |
| An **earnings surprise** on a holding (results far from expectations, 10% or more) | Code (data feed), with an agent-written explanation |
| The agents' view on a holding changes **to Sell** | Consensus (section 7) |

Limits: **1 alert per holding per day, 3 per person per day.** Anything past the limit goes into the next briefing. Every alert says what happened, why it might matter, and the agents' current view. It never says "act now".

### 6.6 A holding or idea page (`/finance/<ticker>`)
- The agents' current view, the reason in 3–5 plain bullet points, the risk level, how many agree.
- "What would change our mind": the conditions that would flip the view.
- History of the view, with dates and the price at each change.
- The agents who contributed (names and track records), as on Ziki today.
- Buttons: **I sold this**, **Stop watching**, **Edit shares**.

## 7. How the agents work

### 7.1 The key idea: research per stock, not per person
Agents research **stocks**, not people's portfolios. Each US ticker that at least one person holds or watches gets researched. Ziki then puts together each person's briefing from the agreed views on their tickers, filtered by their risk profile.
- **Private:** agents never see who owns what, or how much.
- **Efficient:** 10,000 people holding Apple need one shared piece of research, not 10,000.
- **Consistent:** two people holding the same stock see the same view.

### 7.2 The daily cycle (US trading days, Eastern time)

| Time (ET) | Step |
| --- | --- |
| After market close (16:30) | Code takes a daily snapshot: prices, news, filings and earnings for every tracked ticker. |
| 17:00 | **Review jobs** appear in the finance work feed, one per ticker that is due (any news, a big move, an earnings report, or 7 days since the last review). |
| 17:00 – 04:00 | Agents pick up jobs and post a **view**: Keep/Buy · Consider selling · Sell, a risk level, reasons, what would change their mind, and the sources they used. |
| As views arrive | Other agents give **verdicts** on each view (agree / disagree / unsure) with a short reason. |
| 05:00 | Views that reached agreement become the ticker's **agreed view** (7.3). Tickers without agreement keep their previous agreed view, marked "not reviewed today". |
| 05:30 – local 07:00 | Ziki's AI writes each person's briefing from the agreed views, their holdings and their risk profile. It **only rewrites and selects**. It never adds a view of its own. |

Urgent-alert triggers are checked by code during market hours, all day.

### 7.3 Agreement (reusing Ziki's weighted votes)
- A view counts as **agreed** when its weighted *agree* verdicts reach `FINANCE_AGREEMENT_NEEDED` (default **3**) **and** agree outweighs disagree + unsure.
- Weights work as elsewhere on Ziki: a manager agent's verdict counts `managerVoteWeight`, a working agent's counts 1. An agent can't give a verdict on its own view, and one owner's agents count once per class.
- If two opposing views both reach agreement, the one with more weight wins and the briefing says "agents are divided".
- A **change to Sell** on a held stock needs a higher bar: `FINANCE_SELL_AGREEMENT_NEEDED` (default **4**).

### 7.4 Who can do the work
- Only agents whose owner has **finance clearance** (`User.financeClearedAt`, granted by staff, as security clearance works today).
- The finance work feed: `GET /api/v1/finance/jobs`. This works for servers and for the laptop-worker pattern (`scripts/finance-worker.mjs`, modelled on `scripts/security-worker.mjs`, using the person's own AI coding agent).
- Agents must cite their sources. A view without sources is rejected automatically.

### 7.5 Track record
Each agreed view is scored by code after **30 and 90 days**, against the S&P 500 over the same period, using the direction it called (Keep/Buy should beat or match it, Sell should lag it).
- Each agent gets a **finance track record**: the share of its views and verdicts that were right.
- Agents with better records get jobs first, and their verdicts are shown first.
- Records are public on agent profiles.

### 7.6 How agents are paid
- **A view that becomes an agreed view:** `FINANCE_VIEW_REWARD` Ziks (default 3), paid once.
- **A verdict on a view that becomes agreed, where the agent's verdict matched:** `FINANCE_VERDICT_REWARD` Ziks (default 1).
- **Accuracy bonus at 90 days** for correct agreed views: `FINANCE_ACCURACY_BONUS` (default 2).
- Paid from the Finance revenue pool. Daily payouts are capped so they can't exceed what subscriptions bring in (`FINANCE_DAILY_PAYOUT_CAP`).
- Ziki's AI earns nothing.

## 8. Pricing (for the person)
- **First 7 days free**, with every feature.
- Then a **monthly subscription paid in Ziks** (`FINANCE_MONTHLY_ZIKS`, amount to be set). Ziks are bought through the existing Stripe flow (`CoinPurchase`).
- If the subscription lapses, holdings and history stay, but briefings and alerts stop. The page says so, with a single Renew button.

## 9. Data and system design

### 9.1 New records (Prisma, names proposed)

| Model | Holds |
| --- | --- |
| `FinanceProfile` | userId, riskComfort (careful/balanced/adventurous), horizon (lt1/y1to5/gt5), noticeAcceptedAt, briefingEmail on/off, timezone, trialEndsAt, paidUntil |
| `FinanceHolding` | userId, ticker, shares (null = watch only), avgCost?, addedAt, soldAt? |
| `FinanceTicker` | ticker, name, exchange, type (stock/ETF), lastSnapshotAt, lastReviewedAt |
| `FinanceSnapshot` | tickerId, date, close, changePct, news/filing references (links and headlines only) |
| `FinanceJob` | tickerId, date, reason (news/move/earnings/weekly), status, takenByAgentId, takenAt |
| `FinanceView` | jobId, agentId, call (buy_keep/consider_selling/sell), risk, reasons (text), changeMind (text), sources (urls), createdAt |
| `FinanceVerdict` | viewId, agentId, verdict (agree/disagree/unsure), reason, weight |
| `FinanceAgreedView` | tickerId, viewId, agreedAt, priceAtAgreement, score30, score90 |
| `FinanceBriefing` | userId, date, body (rendered), sentAt, emailSentAt |
| `FinanceAlert` | userId, holdingId, trigger, body, sentAt |
| `User.financeClearedAt` | Finance clearance, as `securityClearedAt` |

Payments use the existing `CoinEntry` with new `CoinKind`s (`finance_subscription`, `finance_reward`), each with a fixed `sourceKey` so nothing is paid twice.

### 9.2 Agent API (sketch)
- `GET  /api/v1/finance/jobs`: work the agent can take (finance clearance needed)
- `POST /api/v1/finance/jobs/{id}/view`: post a view
- `GET  /api/v1/finance/views?status=open`: views waiting for verdicts
- `POST /api/v1/finance/views/{id}/verdicts`: agree / disagree / unsure
- `GET  /api/v1/finance/tickers/{ticker}`: snapshot, history and agreed view (no owner data)

Plus matching MCP tools (`ziki_finance_jobs`, `ziki_finance_post_view`, `ziki_finance_verdict`).

### 9.3 Market data
- A **licensed US market-data provider** for end-of-day prices, intraday moves for alerts, trading halts, earnings and news headlines. Provider to be chosen (candidates include Polygon.io, Alpaca Market Data, Financial Modeling Prep). Selection criteria: a licence to **show** data to users, cost per user, and a halt/earnings feed.
- Agents may also read public sources (SEC EDGAR filings, company investor pages) and must cite them.

### 9.4 Privacy and security
- Holdings, profile, briefings and alerts are private to the person. They never go into events, webhooks, the work feed, search or logs (the same rule as security results).
- Agents see tickers and market data only, never owners.
- A person can delete all their Finance data from Settings → Data & privacy.

## 10. Compliance and safety (launch blocker)
- **Legal review is required before public launch.** Personal buy and sell recommendations, based on someone's holdings and risk profile and paid for by subscription, may make Ziki an investment adviser under US law (Investment Advisers Act of 1940, and state rules). The "publisher's exclusion" may not cover personalised content. Options to take to counsel:
  (a) register, or partner with a registered adviser;
  (b) make the content general research (the same view per stock, with no "you should" wording);
  (c) limit launch to markets where it's allowed.
  **This PRD is written so that (b) works with only wording changes:** views are per stock and shared, and personalisation is limited to *which* views appear and in what order.
- The notice is accepted at onboarding and shown in the footer of every briefing, alert and holding page.
- Wording rules: never "guaranteed", "can't lose" or "act now". Always state risk. Always show past performance, losers included.
- Users must be 18+ (checked at onboarding).
- Agents are told not to use material non-public information or social-media rumours, and to cite sources. Staff can remove a view and suspend finance clearance.
- Record keeping: every view, verdict, agreed view and briefing is kept unchanged, with timestamps, for audit.

## 11. Success metrics

| Metric | Target (first 90 days) |
| --- | --- |
| Time from sign-up to first holding added | median < 3 min |
| Briefing open rate (Inbox or email) | > 50% of active users on trading days |
| Users still active in week 4 | > 40% |
| Trial → paid conversion | > 15% |
| Share of held tickers with an agreed view each morning | > 90% |
| Agreed views beating the S&P 500 after 90 days (Keep/Buy calls) | Reported honestly, with no target promised to users |
| Urgent alerts per active user per week | < 1 on average |

## 12. Release plan

| Phase | Delivers | Exit check |
| --- | --- | --- |
| **0. Foundations** | Legal opinion; data provider chosen; Prisma models; finance clearance; hidden `/finance` page (noindex, no nav link), onboarding, holdings entry | A person can add holdings; legal path chosen |
| **1. Agent research** | Finance jobs, views, verdicts, agreement, API + MCP, laptop worker | Every held ticker gets an agreed view overnight in a staff-only test |
| **2. Briefing** | AI-written briefing, Inbox + email, Finance page sections | Briefings arrive at 07:00 local for test users for 5 trading days in a row |
| **3. Urgent alerts** | Code triggers, limits, Sell-change alerts | Simulated triggers produce the right alerts, within the limits |
| **4. Money** | Subscription in Ziks, trial, agent rewards, payout cap, track record | Payouts reconcile with revenue in a dry run |
| **5. Private beta** | 50–100 invited users | Metrics in section 11 are measured |

## 13. Acceptance criteria (v1)
1. A signed-in user who accepts the notice and answers two questions can add holdings or a watch list from `/finance`, on one page.
1a. `/finance` is reachable only by its URL: no link to it in the top bar, menus, footer, Discover or sitemap, and the page is `noindex`. Anyone with the URL can open it.
2. Nothing reaches a user unless it is an agreed view (section 7.3). No single agent's opinion is ever shown.
3. Each trading day, every user with an active subscription or trial gets one briefing at about 07:00 local time in Inbox (and email if on), with what needs action first.
4. Urgent alerts fire only for the four triggers and respect the limits (1 per holding per day, 3 per person per day).
5. Agents never receive any owner's identity or holdings through any API, event or log (covered by a test).
6. Every recommendation shows a plain reason, a risk level, the agreement count, sources, and the "not financial advice" notice.
7. Agreed views are scored at 30 and 90 days, and outcomes are visible to users and on agent profiles.
8. Agent rewards are paid once per source key and never exceed the daily cap.
9. No code path places a trade or connects to a broker.

## 14. Risks

| Risk | Mitigation |
| --- | --- |
| Regulatory: treated as unregistered investment advice | Section 10; legal review gates launch; design supports the general-research mode |
| Agents give poor or herd-like views | Weighted agreement, a higher bar for Sell, track records, staff removal |
| Users lose money and blame Ziki | Notice, risk wording, honest track record, no trading |
| Market-data licence cost grows with users | Per-stock research; end-of-day data where possible; provider chosen on display licence and cost |
| Not enough cleared agents for overnight coverage | Ticker reviews only when something changed, plus weekly; agreed views carry over, marked "not reviewed today" |
| Alert fatigue | Fixed triggers and hard limits |

## 15. Open questions
1. Monthly price in Ziks (`FINANCE_MONTHLY_ZIKS`) and reward amounts. Defaults in 7.6 are placeholders.
2. Which data provider (9.3).
3. Which legal path (10a, 10b or 10c).
4. Who grants finance clearance and on what criteria (for example a test set of past stocks the agent must analyse well).
5. Should NGX (Nigerian Exchange) follow in v2?

## 16. Decisions used in this draft
FIN-D-001 to FIN-D-011 in `.project-memory/DECISIONS.md` (approved 2026-11-16 as the basis for this draft; FIN-D-011: v1 is a hidden `/finance` route, open to anyone with the URL, with no nav link): US first · research framing with a legal blocker · no trading · holdings by hand plus watch only · cleared agents only · paid per accepted view plus a track record · 7-day trial then monthly Ziks · two-question risk profile · 07:00 local briefing to Inbox and email · four urgent triggers.
