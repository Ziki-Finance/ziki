import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { FINANCE_PATH, RISK_LEVEL_LABEL, TICKER_TYPE_LABEL, agreementWords, callLabel, normalizeSymbol, sharesWords, tickerPath } from "@/lib/finance";
import { getProfile, holdingFor } from "@/lib/finance/holdings";
import { currentViews, viewHistory } from "@/lib/finance/research";
import { ViewChip } from "@/components/finance/view-chip";
import { removeHoldingAction } from "@/app/actions/finance";
import { FinanceFooter } from "@/components/finance/finance-footer";
import { EditSharesForm } from "@/components/finance/holding-forms";

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={FINANCE_PATH} className="text-sm text-zk-accent hover:underline">
        ← Finance
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-zk-text">
          {ticker.name} <span className="font-mono text-zk-text2">({ticker.symbol})</span>
        </h1>
        <p className="text-sm text-zk-text2">
          {holding.shares === null ? "Watching" : `${sharesWords(holding.shares)} shares`} · — · {TICKER_TYPE_LABEL[ticker.type]}
          {ticker.exchange ? ` on ${ticker.exchange}` : ""}
        </p>
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
        <EditSharesForm
          holdingId={holding.id}
          shares={holding.shares === null ? "" : holding.shares.toString()}
          avgCost={holding.avgCost === null ? "" : holding.avgCost.toString()}
        />
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
