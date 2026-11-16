# Ziki Finance — Step 2b: fixes after the review of steps 0–2 (FIN-CR-006)

| | |
| --- | --- |
| Status | **APPROVED by the user on 2026-11-16**, ready for implementation (ideas 18–22 and 24–28; idea 23 dropped; idea 28 added at the user's request) |
| Date | 2026-11-16 |
| Comes after | Release step 2 (FIN-CR-005). **Do this before step 3 (urgent alerts).** |
| Based on | A read-only review of `feat/finance-step2-briefing` (which contains steps 0–2) against the PRD v0.2, the wireframes, `docs/plans/finance-ideas.md`, and the decisions FIN-D-021 to FIN-D-024. All 68 Finance unit tests pass. |

The ideas continue the numbering in `docs/plans/finance-ideas.md`, and each uses the same parts: what we want to achieve, what is expected, why, and what it depends on.

---

## What is on point (keep as it is)

- **Hidden page (idea 1).** Only `/finance` is public, it is `noindex`, and a test fails if a link to Finance appears elsewhere.
- **Setup (idea 2).** It has the notice with the 18+ tick and the two questions, and saves the time zone safely.
- **Privacy.** Holdings are read only for their owner. Agents never see owners or share counts. Briefing emails never write the content or the address to logs.
- **Clearance and agent work (ideas 5–9).** Clearance is checked on every call. Views need sources and "what would change my mind". There is the agent API, MCP tools and the laptop worker.
- **Agreement rules (idea 8).** The rules match PRD section 7.3: Sell has a higher bar, agree must outweigh disagree plus unsure, and "divided" and "not reviewed today" are handled.
- **The briefing (ideas 10–11):**
  - It leads with what needs a look, or says "Nothing needs your attention today".
  - It goes to Inbox and email at 07:00 local, Monday to Friday, and never on a US market holiday.
  - An empty briefing is kept but not sent.
  - The page, Inbox and email show the same content.
  - Past briefings are listed.
- **Briefing built by code, not AI (FIN-D-018).** It can only select and order agreed views, so it never adds an opinion and costs nothing. This is accepted for v1. An AI rewrite of the wording is a later decision (FIN-T-014).
- **Ideas for you (idea 12).** Only agreed Keep/Buy views at a risk level both answers allow, never a stock the person already has. "Watch" and "I bought this" both work.
- **The extra "Watching" section** in the briefing is a sensible addition the wireframe didn't have.

---

## What needs to change: the step 2b ideas

### Idea 18 · Connect Finnhub for testing
- **Summary:** Replace the built-in list of about 140 stocks with Finnhub's free plan for search, prices, news and earnings (FIN-D-021).
- **What we want to achieve:** Finance works with real market data during testing, for any US stock or ETF.
- **What is expected:**
  - Ticker search finds any US-listed stock or ETF by ticker or name.
  - The holdings table shows **Today's change** and a **30-day sparkline** (wireframe 3).
  - Each evening's snapshot stores the real close, % change and news/earnings headlines. Review jobs now also start for news, big moves and earnings, not only "first" and "weekly".
  - Every agreed view saves the price at agreement, which the track record (idea 16) needs.
  - It stays within Finnhub's free-plan rate limit, by spreading the snapshots across the evening's cron runs.
  - Finnhub is used only through `lib/finance/market-data.ts`, so changing provider before launch touches one place. The API key is kept as a secret and never committed.
  - **The coding agent asks the user for the Finnhub key and stores it as a secret.** The user already has a Finnhub API key. The secret is named `FINNHUB_API_KEY`.
    - **Ask, don't fetch.** At the start of this idea, the agent asks the user to enter the key. The agent never searches for it, guesses it, or uses any other key.
    - **The key never goes in chat.** The agent gives the user the command to run themselves, so the key is typed straight into the secret store.
    - **Where it's stored:**
      - Locally, in `.env`, which is never committed. `.env.example` gets an empty `FINNHUB_API_KEY=` line.
      - On Cloudflare, by adding `FINNHUB_API_KEY` to the list in `scripts/cloudflare/upload-secrets.mjs` and having the user run `node scripts/cloudflare/upload-secrets.mjs`, or `npx wrangler secret put FINNHUB_API_KEY`, which prompts for the value.
    - **No key, no crash.** Without a key, Finance falls back to the built-in list and shows "—" for prices.
    - The key is never printed, logged, committed or put in project memory.
- **Why:** Without data, steps 1–2 can only do part of their job.
- **Depends on:** the user's existing Finnhub API key, entered by the user when the coding agent asks for it (above).

### Idea 19 · Agreement numbers set by staff on the Finance staff page
- **Summary:** Move the agreement numbers out of the code and onto `/superadmin/finance` (FIN-D-022).
- **What we want to achieve:** Staff can tune how much agreement Finance needs without a code change, the way projects already have their thresholds.
- **What is expected:**
  - Three numbers on the staff page:
    - **agreement needed** (default 3)
    - **a manager agent's vote weight** (default 3)
    - **the bar for a change to Sell** (default agreement needed + 1)
  - Each must be a whole number of 1 or more, and the Sell bar can't be lower than agreement needed.
  - A change applies from the next settle, and is recorded with who made it and when.
  - The env vars `FINANCE_AGREEMENT_NEEDED` / `FINANCE_SELL_AGREEMENT_NEEDED` and the fixed weight of 3 are removed.
- **Why:** You decided Finance stays out of projects, but its numbers must still be set in the app.
- **Depends on:** nothing.

### Idea 20 · Code watches every stock, and agents research a rotating shortlist
- **Summary:** Each evening, code checks every US stock and ETF and picks a short list of promising candidates. Agents research that shortlist as well as what users hold, so "Ideas for you" doesn't depend on what other people own. *(Revised 2026-11-16. It replaces the earlier staff-picked ideas list.)*
- **What we want to achieve:** Every user gets good new ideas from the start, every stock is considered, and agent time goes only where an idea is likely.
- **The problem today:**
  - Agents only review stocks someone holds or watches, so ideas can only come from other users' portfolios.
  - Early on there will be almost none, they'll copy whatever the first users bought, and an idea quietly hints that somebody owns it.
  - Researching all ~9,000 US stocks and ETFs with agents isn't possible: about 36,000 agent tasks a week.
- **What is expected:**
  - **Code scans every stock each evening.** It uses market data only, with no agents and no AI. It sets aside stocks that are too small, too cheap (penny stocks), too thinly traded, or too new to suggest to a beginner.
  - **Code picks the week's shortlist** from what's left, using simple signals such as steady growth, fresh earnings or news, and recent momentum. The shortlist rotates, so most large, solid companies get looked at over a few weeks. It is weighted by people's industry interests (idea 26).
  - **Agents research the shortlist like held stocks:** views, verdicts, agreement.
  - **Staff set the shortlist size** on `/superadmin/finance` (default 100 a week), and can pin or exclude a stock.
  - **"Ideas for you" picks from agreed Keep/Buy views** that fit the person's risk answers and, when they've chosen any, their industries.
  - **A new user sees ideas within a day or two**, even if nobody else holds anything.
  - **The scan stays within Finnhub's free-plan limits.** It is spread across evening runs, or uses bulk endpoints, and is checked in idea 18.
- **Why:** Recommending what to buy is half of what you asked Finance to do.
- **Depends on:** idea 18 (data), and idea 26 for the industry weighting.

### Idea 21 · Finish the briefing's top and bottom lines
- **Summary:** Add the "Overall" line and the market line that wireframe 5 shows.
- **What we want to achieve:** The briefing opens with how the person's stocks did, and closes with one plain sentence about the market.
- **What is expected:**
  - "Overall: your holdings rose 1.2% yesterday (S&P 500: +0.8%)", worked out from shares and closing prices. Watch-only stocks are left out.
  - One market sentence, built by code from the S&P 500's move (FIN-D-018 stays: no AI).
  - When prices are missing, both lines are left out and nothing breaks.
- **Why:** It matches the approved wireframe, and the first thing people want to know is "how am I doing?".
- **Depends on:** idea 18.

### Idea 22 · A clear "Just watch" choice in setup
- **Summary:** Add the "Just watch instead" button from wireframe 2.
- **What we want to achieve:** Someone who owns nothing yet can see straight away that they can still use Finance.
- **What is expected:** a button that adds the chosen stock with no shares. The "empty shares = watch" hint stays as a backup.
- **Why:** At the moment the option is hidden in a placeholder, and the curious-saver persona will miss it.
- **Depends on:** nothing.

### Idea 23 · Never rename someone's organisation or project silently — **DROPPED (2026-11-16)**
> The user confirmed that no organisation is called "finance" today, so the migration as written is fine. The migration is left unchanged and FIN-I-001 is resolved. Kept here for the record only; code agents skip it.

- **Summary:** Change the step 0 migration so it no longer renames an organisation or project called "finance" by itself (FIN-I-001).
- **What we want to achieve:** No existing workspace's links break without its owner knowing.
- **What is expected:**
  - The migration changes no existing organisation or project.
  - If one is called "finance", staff see it flagged on `/superadmin/finance` and ask its owner to choose a new name. Until then, `/finance` still opens Ziki Finance.
  - Production is checked for a clash before the migration is applied.
- **Why:** A silent rename breaks bookmarks and agents set up with the old address.
- **Depends on:** nothing. **This must be done before the step 0 migration runs on production.**

### Idea 24 · A briefing that's late is still sent
- **Summary:** If the 07:00–07:59 window is missed (for example the scheduler was down), send that day's briefing later that morning rather than skipping the day.
- **What we want to achieve:** Nobody silently loses a day's briefing.
- **What is expected:** a missed briefing is sent until 10:00 local time on the same day, marked with the time it was sent. After that the day is skipped.
- **Why:** Today a briefing is only made during that one hour.
- **Depends on:** nothing.

### Idea 25 · Try it for real before step 3
- **Summary:** Run steps 0–2b end to end on a test database and in a browser, with test agents (FIN-T-007).
- **What we want to achieve:** Proof that it works, not only unit tests.
- **What is expected:**
  1. Migrations apply on a test database.
  2. A test user sets up, adds stocks, watches one, sells one, and changes their answers.
  3. Staff grant clearance.
  4. Two or three cleared test agents post views and verdicts during one simulated night.
  5. Agreed views appear on the pages.
  6. A briefing is made at 07:00, and appears in Inbox and in the email log (or in a real email once INF-I-007 is done).
  - Screenshots of each screen are recorded in the change log.
- **Why:** None of steps 0–2 has been run against a database or in a browser yet.
- **Depends on:** ideas 18–22, 24, 26, 27 and 28 (23 dropped).

---

### Idea 26 · Pick the industries you're interested in
- **Summary:** An optional "Industries you're interested in" field, in setup and in the ⋯ menu. You can pick as many as you like, each one shows as a tag with an ×, and you can leave it empty.
- **What we want to achieve:** People can steer their ideas towards what they care about without knowing any stock names. Ziki also learns which kinds of stock people want researched.
- **What is expected:**
  - **The field:**
    - **It picks from a fixed list. You never have to think of a name.** Clicking the field opens a dropdown showing every industry, so you can just scroll and pick.
    - Typing filters that same list as you type ("he" shows Healthcare). Free text isn't accepted, so only real industries can be chosen.
    - The list is plain English, for example Technology, Healthcare, Banks & finance, Energy, Consumer goods, Real estate and Industrials. Each stock's industry comes from the data provider.
    - Industries already picked drop out of the dropdown, or show as ticked, so nothing is chosen twice.
    - Each pick stays as a tag with an × to remove it. There's no maximum, and zero is fine.
    - It appears in setup (optional, so it never blocks "Start my briefings") and can be changed later in the ⋯ menu.
  - **For the person:**
    - "Ideas for you" prefers stocks in their industries, still within their risk answers. Each idea says which interest it matches ("Fits your interest in Healthcare").
    - With no industries picked, ideas come from all industries.
    - If none of their industries has an agreed idea yet, the page says agents are looking at those industries.
  - **For Ziki:**
    - The weekly shortlist (idea 20) gives more places to industries more people picked, in proportion to the number of people.
    - Every industry keeps a small minimum share, so none is ignored.
    - Staff see how many people picked each industry on `/superadmin/finance`.
  - **Privacy:**
    - Only counts per industry are used. Nobody, agents included, sees who picked what.
    - Agents get ordinary review jobs and are never told why a stock was chosen.
- **Why:** You asked for it. It turns "what do people want?" into what agents research, without a long questionnaire.
- **Depends on:** idea 18 (each stock's industry comes from the data provider). It shapes idea 20.
- **Changes the approved wireframe 2 (setup):** it adds one optional field below the two questions.

### Idea 27 · Show how your stock is doing for you, without the "More" step
- **Summary:** Adding a stock asks only for the stock and its shares. Ziki records the price on the day it's added by itself. On the holding page, the person can optionally add what they paid, or when they bought, to see their profit. *(Revised 2026-11-16, after the user's decision. It replaces "take More and the average price out".)*
- **What we want to achieve:** People can see whether they're making money, without being asked for numbers they may not know when they add a stock.
- **What is expected:**
  - **No "More" link anywhere.** Setup and "+ Add" ask only for the stock and the number of shares, with "Just watch" as the other choice (idea 22). Editing a holding shows the shares.
  - **Layer 1, automatic:** when a stock is added, Ziki saves that day's price (`addedPrice`, `addedAt`). The holdings table and the holding page show "Up 4% since you added it". The person is asked nothing.
  - **Layer 2, the price paid (optional, on the holding page):** one plain line, "Add what you paid to see your profit". A field "Price per share you paid" turns it into "You're up $120 (+15%)", worked out from shares × (today's price − price paid).
  - **Layer 3, the date bought (optional, same place):** "Not sure? Pick the date you bought" opens a date picker. Ziki uses that day's closing price as the price paid and labels it "based on the price on 3 Mar 2026". Dates in the future, or before the stock was listed, are refused.
  - Whichever of layers 2 and 3 was given last is used, and it can be changed or cleared. Watch-only stocks show only layer 1.
  - **Profit is information only, never advice.**
    - The briefing may say "You're up 25% on ACME" next to the agents' view.
    - No message ever says or suggests to sell *because* of the price paid, such as "you're back to what you paid".
    - The agents' view never uses the price paid. That avoids anchoring, and stays out of personal advice (PRD §10).
  - The price paid stays private like the rest of the holding. Agents never see it.
- **Why:** You asked for a way to tell whether a stock is doing well *for you*. Asking during setup, behind "More", was the wrong place.
- **Depends on:** idea 18 (prices today and on past dates). The existing `avgCost` column holds layers 2 and 3. `addedPrice` and `addedAt` are new.
- **Changes the approved wireframe 2 note 3 and PRD §6.2 step 3:** the average price is no longer asked for in setup. It moves, optional, to the holding page.

### Idea 28 · A time-lapse demo of how Finance works
- **Summary:** A **"Watch how it works"** button on the Finance page plays a short time-lapse of a few days in Finance, with example agents doing their work. People can see what will happen even while the platform is empty. *(Added at the user's request, 2026-11-16.)*
- **What we want to achieve:** A new user understands in about a minute what agents do overnight and what they'll receive, without waiting days for real activity.
- **What is expected:**
  - **Where:**
    - A "Watch how it works" button near the top of the Finance page, most visible while the page is still in its empty state.
    - The same button on the signed-out welcome page (wireframe 1).
    - It is always available afterwards from the ⋯ menu.
  - **What it plays:** about 60–90 seconds, with a clock in the corner running from "Mon 16:30" to "Fri 07:00". The steps:
    1. The market closes. Stocks are queued for review.
    2. Example agents pick up reviews, one by one.
    3. Each posts a view, with its call, reasons, risk and sources.
    4. Other agents give agree, disagree or unsure verdicts, with a running count.
    5. A view reaches agreement ("4 of 5 agree").
    6. 07:00 arrives: a briefing lands in Inbox, opens and shows "Needs a look", "All good" and "New idea".
    7. A big move triggers one urgent alert.
    8. The demo skips ahead 30 days: past calls show how they did, including a wrong one.
  - **Controls:** play/pause, a speed choice (1×, 2×), "next step", and close. Keyboard-friendly. With reduced motion turned on, it plays as steps instead of animating.
  - **It is clearly a demo:**
    - A permanent "Demo, example data" label.
    - Only **made-up companies and agents** (for example Acme Corp, Northwind, "Agent Ada").
    - **Never real tickers**, so a demo "Buy" can't be read as a real recommendation (PRD §10).
    - The not-financial-advice footer is shown.
  - **It changes nothing:**
    - It runs from a fixed script in the browser.
    - It writes nothing to the database, sends no Inbox item or email, and uses no agents, AI or market data.
    - It never uses the person's own holdings.
  - It works at phone width, and closing it returns to the page exactly as it was.
- **Why:** Finance happens overnight and over days, so an empty page shows nothing. A demo shows the whole loop of agents researching and agreeing, the morning briefing and alerts.
- **Depends on:** nothing. It can be built at any point in step 2b. It shows step 3's alert as an example of what's coming.

## Not in step 2b
- **The two-layer "your agents' view" design (FIN-R-010)** is deferred by your decision, and is in the idea backlog. The requirement that a person's own agents can do enough (FIN-D-023) stays recorded, with its design open.
- **The Finance health numbers on the staff page (FIN-R-011)** are still a recommendation awaiting your approval.
- **Briefing emails** need email on Cloudflare first (INF-I-007, infrastructure work). Until then, briefings reach Inbox only.

## Housekeeping (not ideas)
- Delete the leftover duplicate branch `feat/finance-step1-agent-research`.
- Keep one session per folder or worktree, as `.project-memory/README.md` requires.
- Merge order: PR #1 (infrastructure), then steps 0, 1 and 2, then 2b, each reviewed.
