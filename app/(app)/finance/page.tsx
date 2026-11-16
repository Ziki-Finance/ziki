import Link from "next/link";
import { optionalUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { RISK_LEVEL_LABEL, agreementWords, normalizeSymbol, profileWords, sharesWords, signedPercent, tickerPath } from "@/lib/finance";
import { getProfile, listHoldings } from "@/lib/finance/holdings";
import { currentViews } from "@/lib/finance/research";
import { changeSince, lastClose, latestChanges, recentBars } from "@/lib/finance/prices";
import { dateWords, pastBriefings, previewBriefing, type BriefingContent } from "@/lib/finance/briefing";
import { holidayName, zonedParts } from "@/lib/finance/calendar";
import { ideasFor } from "@/lib/finance/ideas";
import { BriefingView } from "@/components/finance/briefing-view";
import { IdeaActions } from "@/components/finance/idea-actions";
import { marketData } from "@/lib/finance/market-data";
import { FinanceFooter } from "@/components/finance/finance-footer";
import { FinanceSetup } from "@/components/finance/finance-setup";
import { FinanceWelcome } from "@/components/finance/finance-welcome";
import { AddHoldingForm, FinanceProfileMenu } from "@/components/finance/holding-forms";
import { Sparkline } from "@/components/finance/sparkline";
import { ViewChip } from "@/components/finance/view-chip";

export const dynamic = "force-dynamic";

const card = "space-y-3 rounded-xl border border-zk-border bg-zk-surface p-5";
const heading = "text-xs font-semibold uppercase tracking-wider text-zk-muted";

/**
 * Ziki Finance (FIN-CR-003, wireframes 1–3). Signed out: the welcome page.
 * Signed in without a profile: first-visit setup. Otherwise the Finance page,
 * whose four sections fill in as agents review stocks (release steps 1–2).
 */
export default async function FinancePage({ searchParams }: { searchParams?: Promise<{ add?: string }> }) {
  const user = await optionalUser();
  if (!user) return <FinanceWelcome />;

  const params = searchParams ? await searchParams : {};
  const profile = await getProfile(prisma, user.id);
  if (!profile) {
    const symbol = normalizeSymbol(params.add ?? "");
    const initial = symbol ? await marketData().lookup(symbol) : null;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-zk-text">Finance</h1>
          <p className="text-sm text-zk-text2">Agents watch your stocks. You get one short note each morning.</p>
        </header>
        <FinanceSetup initial={initial} />
        <FinanceFooter />
      </div>
    );
  }

  const holdings = await listHoldings(prisma, user.id);
  // Only agreed views ever reach a person (PRD §7.3), never one agent's opinion.
  const tickerIds = holdings.map((h) => h.ticker.id);
  const [views, changes, bars] = await Promise.all([
    currentViews(prisma, tickerIds),
    latestChanges(prisma, tickerIds),
    recentBars(prisma, tickerIds),
  ]);
  const person = { userId: user.id, riskComfort: profile.riskComfort, horizon: profile.horizon, timezone: profile.timezone };
  const [ideas, past, preview] = await Promise.all([ideasFor(prisma, person), pastBriefings(prisma, user.id), previewBriefing(prisma, person)]);
  // Today's stored briefing when it has been sent; otherwise the same briefing worked out now, so a
  // new person sees one within minutes of agents agreeing (PRD §6.2).
  const local = zonedParts(new Date(), profile.timezone);
  const stored = past.find((b) => b.date === local.date && b.hasViews);
  const today = stored ? (stored.content as unknown as BriefingContent) : preview.hasViews ? preview.content : null;
  const holiday = holidayName(local.date);
  const weekend = local.weekday === 0 || local.weekday === 6;
  const earlier = past.filter((b) => b.date !== local.date && b.hasViews);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-zk-text">Finance</h1>
        <FinanceProfileMenu risk={profile.riskComfort} horizon={profile.horizon} briefingEmail={profile.briefingEmail} />
      </header>

      <section className={card} aria-labelledby="briefing-heading">
        <h2 id="briefing-heading" className={heading}>
          Today&apos;s briefing
        </h2>
        {holiday ? <p className="text-sm text-zk-text2">No briefing today: US markets are closed ({holiday}).</p> : null}
        {!holiday && weekend ? <p className="text-sm text-zk-text2">No briefing at the weekend. The next one arrives on Monday at about 07:00.</p> : null}
        {today ? (
          <BriefingView content={today} />
        ) : (
          <p className="text-sm text-zk-text2">Agents are reviewing your stocks. Your first briefing arrives by tomorrow morning.</p>
        )}
      </section>

      <section className={card} aria-labelledby="holdings-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="holdings-heading" className={heading}>
            Your holdings
          </h2>
          <AddHoldingForm />
        </div>
        {holdings.length === 0 ? (
          <p className="text-sm text-zk-text2">Nothing here yet. Add a stock you own, or one to watch.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="border-b border-dashed border-zk-border text-left text-xs uppercase tracking-wider text-zk-muted">
                  <th className="py-2 pr-2 font-semibold">Company</th>
                  <th className="py-2 pr-2 font-semibold">Shares</th>
                  <th className="py-2 pr-2 font-semibold">Today</th>
                  <th className="py-2 font-semibold">Agents&apos; view</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const view = views.get(h.ticker.id);
                  const today = changes.get(h.ticker.id) ?? null;
                  // The close when they added it, so the line needs nothing from them (idea 27, layer 1).
                  const sinceAdded = h.addedPrice === null ? null : changeSince(lastClose(bars, h.ticker.id), Number(h.addedPrice));
                  const sparkline = (bars.get(h.ticker.id) ?? []).map((bar) => bar.close);
                  return (
                  <tr key={h.id} className="border-b border-dashed border-zk-border last:border-0">
                    <td className="py-2 pr-2">
                      <Link href={tickerPath(h.ticker.symbol)} className="hover:underline">
                        <span className="font-mono font-semibold text-zk-text">{h.ticker.symbol}</span> <span className="text-zk-text2">{h.ticker.name}</span>
                      </Link>
                      {sinceAdded !== null ? (
                        <span className={`block text-xs ${sinceAdded >= 0 ? "text-zk-text2" : "text-zk-bad-fg"}`}>
                          {sinceAdded >= 0 ? "Up" : "Down"} {Math.abs(sinceAdded).toFixed(1)}% since you added it
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-2 text-zk-text2">{sharesWords(h.shares)}</td>
                    <td className="py-2 pr-2">
                      {today === null ? (
                        <span className="text-zk-muted">—</span>
                      ) : (
                        <span className={`flex items-center gap-2 ${today >= 0 ? "text-zk-text" : "text-zk-bad-fg"}`}>
                          <span>{signedPercent(today)}</span>
                          <Sparkline values={sparkline} label={`${h.ticker.symbol} over the last 30 days`} />
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      {view ? (
                        <span className="flex flex-col gap-0.5">
                          <span className="flex flex-wrap items-center gap-2">
                            <ViewChip call={view.call} owned={h.shares !== null} />
                            {view.notReviewedToday ? <span className="text-xs text-zk-muted">not reviewed today</span> : null}
                          </span>
                          <span className="text-xs text-zk-text2">{view.reasons[0]}</span>
                        </span>
                      ) : (
                        <span className="text-zk-muted">Not reviewed yet</span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={card} aria-labelledby="ideas-heading">
        <h2 id="ideas-heading" className={heading}>
          Ideas for you · {profileWords(profile)}
        </h2>
        {ideas.length === 0 ? (
          <p className="text-sm text-zk-text2">Ideas appear here once agents agree on stocks that fit your answers.</p>
        ) : (
          <ul className="divide-y divide-dashed divide-zk-border">
            {ideas.map((idea) => (
              <li key={idea.symbol} className="space-y-1.5 py-3 first:pt-0 last:pb-0">
                <p className="text-sm">
                  <span className="font-medium text-zk-text">
                    {idea.name} ({idea.symbol})
                  </span>{" "}
                  <span className="text-zk-text2">
                    · Risk: {RISK_LEVEL_LABEL[idea.risk]} · {agreementWords(idea)}
                  </span>
                </p>
                <p className="text-sm text-zk-text2">{idea.reason}</p>
                <IdeaActions symbol={idea.symbol} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="past-heading">
        <h2 id="past-heading" className={heading}>
          Past briefings
        </h2>
        {earlier.length === 0 ? (
          <p className="text-sm text-zk-text2">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {earlier.map((b) => (
              <li key={b.date}>
                <details>
                  <summary className="cursor-pointer text-sm">
                    <span className="font-medium text-zk-text">{dateWords(b.date)}</span> <span className="text-zk-text2">{b.headline}</span>
                  </summary>
                  <div className="mt-2 border-l-2 border-zk-border pl-3">
                    <BriefingView content={b.content as unknown as BriefingContent} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FinanceFooter />
    </div>
  );
}
