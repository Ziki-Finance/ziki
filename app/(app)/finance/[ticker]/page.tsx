import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { FINANCE_PATH, RISK_LEVEL_LABEL, TICKER_TYPE_LABEL, agreementWords, callLabel, dayWords, money, normalizeSymbol, sharesWords, signedPercent, tickerPath } from "@/lib/finance";
import { getProfile, holdingFor } from "@/lib/finance/holdings";
import { currentViews, viewHistory } from "@/lib/finance/research";
import { changeSince, lastClose, latestChanges, recentBars } from "@/lib/finance/prices";
import { ViewChip } from "@/components/finance/view-chip";
import { removeHoldingAction } from "@/app/actions/finance";
import { FinanceFooter } from "@/components/finance/finance-footer";
import { EditSharesForm, PaidDateForm, PaidPriceForm } from "@/components/finance/holding-forms";
import { Sparkline } from "@/components/finance/sparkline";

export const dynamic = "force-dynamic";

const card = "space-y-3 rounded-xl border border-zk-border bg-zk-surface p-5";
const heading = "text-xs font-semibold uppercase tracking-wider text-zk-muted";
const button = "rounded-md border border-zk-border px-3 py-1.5 text-sm text-zk-text2 hover:bg-zk-chip";

/** A holding's page (wireframe 4). Only the person's own holdings open here. */
export default async function FinanceHoldingPage({ params }: { params: Promise<{ ticker: string }> }) {
  const user = await requireUser();
  const { ticker: raw } = await params;
  const symbol = normalizeSymbol(decodeURIComponent(raw));
  if (!symbol) notFound();
  if (symbol !== decodeURIComponent(raw)) redirect(tickerPath(symbol));

  const profile = await getProfile(prisma, user.id);
  if (!profile) redirect(FINANCE_PATH);
  const holding = await holdingFor(prisma, user.id, symbol);
  if (!holding || holding.soldAt) notFound();
  const { ticker } = holding;
  const [views, history] = await Promise.all([currentViews(prisma, [ticker.id]), viewHistory(prisma, ticker.id)]);
  const view = views.get(ticker.id) ?? null;
  const [changes, bars] = await Promise.all([latestChanges(prisma, [ticker.id]), recentBars(prisma, [ticker.id])]);
  const today = changes.get(ticker.id) ?? null;
  const close = lastClose(bars, ticker.id);
  // The close when they added it, so this needs nothing from them (idea 27, layer 1).
  const sinceAdded = holding.addedPrice === null ? null : changeSince(close, Number(holding.addedPrice));
  // What they paid is theirs alone: shown here, never sent to an agent.
  const paid = holding.avgCost === null ? null : Number(holding.avgCost);
  const paidChange = changeSince(close, paid);
  // What the position is up or down in dollars, for the "in all" part of the line.
  const paidInAll = paid !== null && close !== null && holding.shares !== null ? (close - paid) * Number(holding.shares) : null;
  const sparkline = (bars.get(ticker.id) ?? []).map((bar) => bar.close);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={FINANCE_PATH} className="text-sm text-zk-accent hover:underline">
        ← Finance
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-zk-text">
          {ticker.name} <span className="font-mono text-zk-text2">({ticker.symbol})</span>
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-zk-text2">
          <span>
            {holding.shares === null ? "Watching" : `${sharesWords(holding.shares)} shares`} ·{" "}
            {today === null ? "—" : <span className={today >= 0 ? "text-zk-text" : "text-zk-bad-fg"}>{signedPercent(today)} today</span>} ·{" "}
            {TICKER_TYPE_LABEL[ticker.type]}
            {ticker.exchange ? ` on ${ticker.exchange}` : ""}
          </span>
          {sparkline.length > 1 ? <Sparkline values={sparkline} label={`${ticker.symbol} over the last 30 days`} /> : null}
        </p>
        {close !== null ? <p className="text-sm text-zk-text2">Last close: {money(close)}</p> : null}
        {sinceAdded !== null ? (
          <p className={`text-sm ${sinceAdded >= 0 ? "text-zk-text2" : "text-zk-bad-fg"}`}>
            {sinceAdded >= 0 ? "Up" : "Down"} {Math.abs(sinceAdded).toFixed(1)}% since you added it
          </p>
        ) : null}
        {paid !== null ? (
          <p className={`text-sm ${(paidChange ?? 0) >= 0 ? "text-zk-text2" : "text-zk-bad-fg"}`}>
            You paid {money(paid)} a share
            {holding.avgCostAsOf ? ` (based on the price on ${dayWords(holding.avgCostAsOf)})` : ""}
            {paidInAll === null || paidChange === null
              ? ""
              : ` · You're ${paidInAll >= 0 ? "up" : "down"} ${money(Math.abs(paidInAll))} (${signedPercent(paidChange)})`}
          </p>
        ) : holding.shares !== null ? (
          <p className="text-sm text-zk-text2">Add what you paid to see your profit.</p>
        ) : null}
      </header>

      <section className={card} aria-labelledby="why-heading">
        <h2 id="why-heading" className={heading}>
          The agents&apos; view
        </h2>
        {view ? (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <ViewChip call={view.call} owned={holding.shares !== null} />
              <span className="text-zk-text2">
                {agreementWords(view)} · Risk: {RISK_LEVEL_LABEL[view.risk]}
              </span>
              {view.notReviewedToday ? <span className="text-xs text-zk-muted">Not reviewed today: this is the last view agents agreed on.</span> : null}
            </div>
            {view.divided ? <p className="text-zk-text2">Agents are divided: another view with a different call also had support.</p> : null}
            <ul className="list-disc space-y-1 pl-5 text-zk-text">
              {view.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <div>
              <p className="font-semibold text-zk-text">What would change our mind</p>
              <p className="text-zk-text2">{view.changeMind}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zk-text2">Agents haven&apos;t reviewed {ticker.symbol} yet. Its first review arrives by tomorrow morning.</p>
        )}
      </section>

      {history.length > 0 ? (
        <section className={card} aria-labelledby="history-heading">
          <h2 id="history-heading" className={heading}>
            History of the view
          </h2>
          <ul className="space-y-1 text-sm text-zk-text2">
            {history.map((h) => (
              <li key={h.agreedAt.toISOString()}>
                {h.agreedAt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} · {callLabel(h.call, holding.shares !== null)}
                {h.price !== null ? ` at $${h.price.toFixed(2)}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {view ? (
        <section className={card} aria-labelledby="sources-heading">
          <h2 id="sources-heading" className={heading}>
            Sources
          </h2>
          <ul className="space-y-1 text-sm">
            {view.sources.map((source) => (
              <li key={source} className="truncate">
                <a href={source} target="_blank" rel="noopener noreferrer nofollow" className="text-zk-accent hover:underline">
                  {source}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={card} aria-labelledby="edit-heading">
        <h2 id="edit-heading" className={heading}>
          Your stock
        </h2>
        <EditSharesForm holdingId={holding.id} shares={holding.shares === null ? "" : holding.shares.toString()} />
        {holding.shares !== null ? (
          <div className="space-y-3 border-t border-dashed border-zk-border pt-3">
            <p className="text-xs text-zk-muted">Optional, and only ever shown to you. Agents never see what you paid.</p>
            <PaidPriceForm holdingId={holding.id} avgCost={holding.avgCost === null ? "" : holding.avgCost.toString()} />
            <PaidDateForm holdingId={holding.id} boughtOn={holding.avgCostAsOf ? holding.avgCostAsOf.toISOString().slice(0, 10) : ""} />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {holding.shares !== null ? (
            <form action={removeHoldingAction}>
              <input type="hidden" name="holdingId" value={holding.id} />
              <input type="hidden" name="how" value="sold" />
              <button type="submit" className={button}>
                I sold this
              </button>
            </form>
          ) : null}
          <form action={removeHoldingAction}>
            <input type="hidden" name="holdingId" value={holding.id} />
            <input type="hidden" name="how" value="unwatch" />
            <button type="submit" className={button}>
              Stop watching
            </button>
          </form>
        </div>
      </section>

      <FinanceFooter />
    </div>
  );
}
