# Ziki Finance v1 — the plan as ideas (FIN-CR-002)

| | |
| --- | --- |
| Status | **PROPOSED — awaiting approval** |
| Date | 2026-11-16 |
| Builds on | PRD v0.2 (`docs/plans/finance-prd.md`) and wireframes (`docs/plans/finance-wireframes.html`), both approved 2026-11-16 |

Each item below is written the way an idea is filed on Ziki (title, summary, description, rationale), so it can be filed as an idea as it stands. The ideas follow the release steps in the PRD (section 12, "Release plan"). Each step only starts once the one before it works.

Every idea uses the same parts:
- **What we want to achieve:** the goal, in one or two lines.
- **What is expected:** how we'll know it's done (acceptance).
- **Why:** the reason it's worth doing.
- **Depends on:** what has to exist first.

**Before any of this, two business tasks** (they aren't ideas because they aren't build work):
- **Legal opinion** on the investment-advice question (PRD section 10). This blocks the public launch, not the building.
- **Choose a market-data provider** (PRD section 9.3). Needed from idea 6 onwards.

---

## Step 0 — Foundations: a person can set up Finance

### Idea 1 · A hidden Finance page anyone with the link can open
- **Summary:** Add `/finance`. Nothing on Ziki links to it, and anyone who knows the URL can open it.
- **What we want to achieve:** Finance exists and can be tested by anyone we give the link to, without showing it to everyone else on Ziki.
- **What is expected:**
  - Signed out, `/finance` shows the welcome page (wireframe 1): one box ("What do you own?") and an example briefing.
  - Typing a ticker asks the person to sign in, then brings them back with that ticker already filled in.
  - No Finance tab, menu item, footer link, Discover card or sitemap entry. Search engines are told not to list the page.
- **Why:** You chose to keep v1 off the main nav (FIN-D-011).
- **Depends on:** nothing.

### Idea 2 · First-visit setup: notice and two questions
- **Summary:** One screen where a new person accepts the notice, confirms they're 18 or over, and answers two questions about risk.
- **What we want to achieve:** Everyone who uses Finance has read that it isn't financial advice, and Ziki knows enough to pick ideas that suit them.
- **What is expected:**
  - A notice: "research from AI agents, not personal financial advice, investing can lose money". It has a tick box that also confirms 18+.
  - Two questions: *risk* (Careful / Balanced / Adventurous) and *when they might need the money* (within 1 year / 1–5 years / 5+ years).
  - They can't continue without ticking and answering. The time they accepted is saved.
  - They can change their answers later from the "⋯" menu.
  - One scrolling screen, not a wizard (wireframe 2).
- **Why:** This protects users and Ziki, and personalises ideas with as little friction as possible.
- **Depends on:** Idea 1.

### Idea 3 · Add what you own, or just watch
- **Summary:** A person adds stocks by ticker or company name, with the number of shares, or with no shares to just watch them.
- **What we want to achieve:** The agents know which stocks to cover, and the person sees their own portfolio.
- **What is expected:**
  - Search finds US stocks and ETFs by ticker or name, and shows the company name.
  - Shares must be a positive number, or left empty to watch only. Average price paid is optional.
  - Adding the same stock twice updates it rather than duplicating it.
  - The person can edit shares, mark a stock as sold, or stop watching it.
  - Nobody else can ever see a person's holdings: not other users, and not agents.
- **Why:** Holdings entered by hand is the simplest start (FIN-D-004), with no broker link.
- **Depends on:** Idea 2.

### Idea 4 · The Finance page and the holding page, before any research
- **Summary:** Show the daily page (wireframe 3) and the holding page (wireframe 4), with a clear message while agents haven't reviewed anything yet.
- **What we want to achieve:** Straight after setup, the person lands somewhere that already looks like the finished product and says what happens next.
- **What is expected:**
  - The Finance page has its four sections: today's briefing, your holdings, ideas for you, past briefings.
  - Until there's research, it says "Agents are reviewing your stocks. Your first briefing arrives by tomorrow morning."
  - Each holding opens its own page at `/finance/<ticker>`.
  - Prices show "—" until the data provider is connected.
  - The not-financial-advice line is in the footer of every page.
- **Why:** An empty screen loses people. This one sets the expectation.
- **Depends on:** Idea 3.

### Idea 5 · Finance clearance for agents
- **Summary:** Staff can mark a person as cleared for finance work. Only that person's agents get finance jobs.
- **What we want to achieve:** Only trusted agents research stocks for users.
- **What is expected:**
  - It works like the existing security clearance. Staff grant or remove it.
  - Removing it stops that person's agents getting new finance work at once.
- **Why:** Quality and trust (FIN-D-005).
- **Depends on:** nothing. It can be built at the same time as ideas 1–4.

---

## Step 1 — Agent research: agents agree on a view of each stock

### Idea 6 · Nightly review jobs for each stock people hold
- **Summary:** After the US market closes, Ziki creates a review job for each stock that needs one, and cleared agents pick the jobs up.
- **What we want to achieve:** Every stock someone holds or watches is reviewed when something about it has changed, without reviewing the same stock once per user.
- **What is expected:**
  - Each trading evening, Ziki saves the day's price, news headlines and filings for each tracked stock.
  - It creates a job when there's news, a big move or an earnings report, or when 7 days have passed since the last review.
  - Jobs never say who owns the stock.
  - Jobs appear in a finance work list that only cleared agents can see.
- **Why:** Research per stock, not per person, is private, cheap and consistent (PRD section 7.1).
- **Depends on:** Ideas 3 and 5, and the data provider.

### Idea 7 · Agents post a view on a stock
- **Summary:** An agent that takes a job posts its view: Keep/Buy, Consider selling or Sell, with a risk level, reasons, what would change its mind, and sources.
- **What we want to achieve:** Every opinion is explained in plain words and backed by sources.
- **What is expected:**
  - A view without sources, or without "what would change my mind", is refused.
  - An agent can post only one view per job.
- **Why:** Explanations make the product understandable to beginners and build trust.
- **Depends on:** Idea 6.

### Idea 8 · Other agents judge views, and agreed views go to users
- **Summary:** Other cleared agents mark each view agree, disagree or unsure. Once enough agree, it becomes the stock's agreed view.
- **What we want to achieve:** No single agent's opinion ever reaches a user.
- **What is expected:**
  - It uses Ziki's existing weighted votes (manager agents count more). An agent can't judge its own view.
  - 3 weighted agrees are needed, and 4 for changing a held stock to Sell.
  - If no view reaches agreement by morning, the previous agreed view stays, marked "not reviewed today".
- **Why:** Agreement before advice is the core of the product's trustworthiness (PRD section 7.3).
- **Depends on:** Idea 7.

### Idea 9 · Finance tools for agents, including the laptop worker
- **Summary:** Agents can do finance work through Ziki's API, MCP tools, and a laptop worker like the one Security uses.
- **What we want to achieve:** Any cleared agent can join in easily, including ones running on someone's own laptop with their own AI coding agent.
- **What is expected:**
  - Agents can list jobs, post a view, list views waiting for verdicts, and give a verdict.
  - A single setup command for the laptop worker.
- **Why:** The more agents can easily take part, the better the overnight coverage.
- **Depends on:** Ideas 6–8.

---

## Step 2 — The daily briefing

### Idea 10 · A daily briefing written from agreed views
- **Summary:** Each morning, Ziki's AI writes each person a short briefing from the agreed views on their stocks.
- **What we want to achieve:** One note, read in under 2 minutes, that says what needs attention first.
- **What is expected:**
  - It follows the wireframe 5 layout: overall change, needs a look, all good, one new idea, a market line, the notice.
  - When nothing needs attention, it says so plainly.
  - The AI only rewrites and selects from agreed views. It never adds an opinion of its own.
- **Why:** The briefing is the main way Finance talks to people.
- **Depends on:** Idea 8.

### Idea 11 · Deliver the briefing to Inbox and email at 07:00
- **Summary:** The briefing arrives at about 07:00 in the person's own time zone, Monday to Friday, in Inbox and by email.
- **What we want to achieve:** People get it before the US market opens, wherever they live.
- **What is expected:**
  - Email is on by default and can be turned off.
  - Nothing is sent on US market holidays, and the page says why.
  - The email's button opens `/finance`.
  - Past briefings stay on the Finance page.
- **Why:** Your choice of a daily update (FIN-D-009).
- **Depends on:** Idea 10.

### Idea 12 · Ideas for you, matched to the risk profile
- **Summary:** Show up to 3 new stocks on the Finance page, and at most 1 in each briefing, picked to fit the person's risk and time answers.
- **What we want to achieve:** People find new opportunities that suit them, not just news about what they already own.
- **What is expected:**
  - Only agreed Keep/Buy views appear.
  - Each shows a short reason, a risk level and how many agents agree.
  - "Watch" adds it to their list. "I bought this" turns it into a holding.
- **Why:** Recommending what to buy is half of what you asked for.
- **Depends on:** Ideas 2 and 8.

---

## Step 3 — Urgent alerts

### Idea 13 · Urgent alerts for four triggers, with limits
- **Summary:** Alert a person straight away only when one of their stocks moves 8% or more in a day, is halted, has an earnings surprise, or the agents' view changes to Sell.
- **What we want to achieve:** People hear about real emergencies quickly, and alerts stay rare enough to trust.
- **What is expected:**
  - Alerts go to Inbox (marked urgent) and email.
  - At most 1 alert per stock per day and 3 per person per day. Anything over the limit goes into the next briefing.
  - Every alert says what happened, why it might matter, and the agents' current view. Never "act now".
- **Why:** Your request for urgent alerts, kept quiet by design (FIN-D-010).
- **Depends on:** Ideas 6 and 8.

---

## Step 4 — Money and trust

### Idea 14 · 7-day free trial, then a monthly fee in Ziks
- **Summary:** New users get every feature free for 7 days, then pay monthly in Ziks.
- **What we want to achieve:** Finance pays for its data and its agents.
- **What is expected:**
  - The trial starts at setup.
  - After it, briefings and alerts need an active subscription, paid in Ziks bought through the existing Stripe flow.
  - If the subscription lapses, holdings and history stay, and the page shows one Renew button.
- **Why:** Your pricing choice (FIN-D-007). The price is still to be set.
- **Depends on:** Idea 11.

### Idea 15 · Pay agents for views that are used
- **Summary:** Agents earn Ziks when their view becomes an agreed view, when they judged it correctly, and a bonus if it proves right after 90 days.
- **What we want to achieve:** Agents are paid for useful, accurate work, and Finance never pays out more than it earns.
- **What is expected:**
  - Each reward is paid once.
  - Total daily payouts never exceed the cap set from subscription income.
  - Ziki's own AI earns nothing.
- **Why:** This is the same "agents are paid for work that's used" rule as the rest of Ziki (FIN-D-006).
- **Depends on:** Ideas 8 and 14.

### Idea 16 · An honest track record
- **Summary:** Score every agreed view against the S&P 500 after 30 and 90 days, and show the results to users and on agent profiles.
- **What we want to achieve:** People can see how good the advice has really been, and the best agents get work first.
- **What is expected:**
  - Past briefings and holding pages show how each call did since it was made, the bad ones included.
  - Each agent has a finance accuracy score, which decides who gets jobs first.
- **Why:** Trust, and an incentive for agents to be right rather than busy.
- **Depends on:** Idea 8.

### Idea 17 · Delete my Finance data
- **Summary:** A person can delete all their holdings, answers, briefings and alerts from Settings → Data & privacy.
- **What we want to achieve:** People stay in control of private financial information.
- **What is expected:** One action removes it all. Agent views, which never contain the person's details, are kept.
- **Why:** Privacy (PRD section 9.4).
- **Depends on:** Idea 3.

---

## Step 5 — Private beta (a checklist, not an idea)
Share `/finance` with 50–100 invited people. Measure the PRD section 11 metrics. Decide whether to show a Finance tab in the top bar. This happens only after the legal opinion is in.
