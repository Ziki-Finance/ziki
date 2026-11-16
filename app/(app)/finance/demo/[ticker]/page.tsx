import Link from "next/link";
import { notFound } from "next/navigation";
import { FINANCE_FOOTER, RISK_LEVEL_LABEL, agreementWords, money, sharesWords, signedPercent } from "@/lib/finance";
import { ViewChip } from "@/components/finance/view-chip";
import { Sparkline } from "@/components/finance/sparkline";
import { FinanceFooter } from "@/components/finance/finance-footer";

/**
 * A holding's page in the demo (wireframe 4), for the two stocks that carry
 * example data: ACME (down, the agents say consider selling) and CTSO (up, the
 * agents say keep). Nothing is read or written; every number is made up.
 * Like the rest of Finance it is unlisted (FIN-D-011).
 */
const card = "space-y-3 rounded-xl border border-zk-border bg-zk-surface p-5";
const heading = "text-xs font-semibold uppercase tracking-wider text-zk-muted";

type Demo = {
  symbol: string;
  name: string;
  kind: string;
  shares: number;
  close: number;
  today: number;
  addedPrice: number;
  /** What the person paid a share, if they told us. */
  paid: number | null;
  paidWords: string | null;
  call: "buy_keep" | "consider_selling" | "sell";
  risk: "low" | "medium" | "high";
  agentsAgree: number;
  agentsTotal: number;
  reasons: string[];
  changeMind: string;
  sources: string[];
  history: { date: string; call: "buy_keep" | "consider_selling" | "sell"; price: number }[];
  spark: number[];
};

const DEMOS: Record<string, Demo> = {
  ACME: {
    symbol: "ACME",
    name: "Acme Corp",
    kind: "Stock on NASDAQ",
    shares: 120,
    close: 41.3,
    today: -1.2,
    addedPrice: 45.6,
    paid: 48.2,
    paidWords: "on 14 Mar 2026",
    call: "consider_selling",
    risk: "high",
    agentsAgree: 4,
    agentsTotal: 5,
    reasons: [
      "Sales fell for the second quarter running, and two of its five biggest customers left.",
      "Its debt costs more than it earns on new orders, so it may have to raise money.",
      "The share price has fallen 14% since we last agreed a view.",
    ],
    changeMind:
      "Two quarters of sales growth, or a new contract with a large customer, would put this back to Keep.",
    sources: [
      "https://example.com/acme/q3-results",
      "https://example.com/acme/customer-departures",
    ],
    history: [
      { date: "17 Nov 2026", call: "consider_selling", price: 41.3 },
      { date: "9 Nov 2026", call: "buy_keep", price: 46.1 },
      { date: "2 Nov 2026", call: "buy_keep", price: 47.4 },
    ],
    spark: [48.9, 48.1, 47.4, 47.9, 47.1, 46.6, 47.2, 46.1, 45.4, 46.0, 45.2, 44.8, 45.3, 44.6, 44.1, 43.8, 44.4, 43.6, 43.2, 42.9, 43.4, 42.7, 42.2, 41.9, 42.3, 41.7, 41.5, 41.9, 41.4, 41.3],
  },
  CTSO: {
    symbol: "CTSO",
    name: "Contoso",
    kind: "Stock on NYSE",
    shares: 40,
    close: 74.85,
    today: 0.4,
    addedPrice: 71.1,
    paid: 61.0,
    paidWords: "on 2 Feb 2026",
    call: "buy_keep",
    risk: "low",
    agentsAgree: 5,
    agentsTotal: 5,
    reasons: [
      "Sales grew 9% on last year, with steady margins.",
      "No new debt this year, and it pays a small dividend.",
      "Nothing in the last week's news changes the reason it was bought.",
    ],
    changeMind:
      "A second quarter of falling margins, or a cut to the dividend, would make us look again.",
    sources: ["https://example.com/contoso/investor-update"],
    history: [
      { date: "17 Nov 2026", call: "buy_keep", price: 74.85 },
      { date: "9 Nov 2026", call: "buy_keep", price: 73.9 },
      { date: "2 Nov 2026", call: "buy_keep", price: 72.6 },
    ],
    spark: [71.1, 70.8, 71.6, 72.0, 71.4, 71.9, 72.4, 71.7, 72.2, 72.8, 72.3, 73.0, 72.6, 73.1, 73.6, 73.2, 73.9, 73.4, 74.0, 73.7, 74.2, 74.6, 74.1, 74.4, 74.9, 74.5, 74.7, 75.2, 74.6, 74.85],
  },
};

const CALL_WORDS: Record<Demo["call"], string> = {
  buy_keep: "Keep",
  consider_selling: "Consider selling",
  sell: "Sell",
};

// Dynamic like the real holding page: the (app) layout reads the session, so this
// must not be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function FinanceDemoHoldingPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: raw } = await params;
  const demo = DEMOS[decodeURIComponent(raw).toUpperCase()];
  if (!demo) notFound();

  const sinceAdded = ((demo.close - demo.addedPrice) / demo.addedPrice) * 100;
  const paidInAll = demo.paid === null ? null : (demo.close - demo.paid) * demo.shares;
  const paidChange = demo.paid === null ? null : ((demo.close - demo.paid) / demo.paid) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/finance/demo" className="text-sm text-zk-accent hover:underline">
        ← Finance
      </Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-zk-text">
          {demo.name} <span className="font-mono text-zk-text2">({demo.symbol})</span>
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-zk-text2">
          <span>
            {sharesWords(demo.shares)} shares ·{" "}
            <span className={demo.today >= 0 ? "text-zk-text" : "text-zk-bad-fg"}>{signedPercent(demo.today)} today</span>{" "}
            · {demo.kind}
          </span>
          <Sparkline values={demo.spark} label={`${demo.symbol} over the last 30 days`} />
        </p>
        <p className="text-sm text-zk-text2">Last close: {money(demo.close)}</p>
        <p className={`text-sm ${sinceAdded >= 0 ? "text-zk-text2" : "text-zk-bad-fg"}`}>
          {sinceAdded >= 0 ? "Up" : "Down"} {Math.abs(sinceAdded).toFixed(1)}% since you added it
        </p>
        {demo.paid !== null ? (
          <p className={`text-sm ${(paidChange ?? 0) >= 0 ? "text-zk-text2" : "text-zk-bad-fg"}`}>
            You paid {money(demo.paid)} a share{demo.paidWords ? ` (based on the price on ${demo.paidWords})` : ""}
            {paidInAll === null || paidChange === null
              ? ""
              : ` · You're ${paidInAll >= 0 ? "up" : "down"} ${money(Math.abs(paidInAll))} (${signedPercent(paidChange)})`}
          </p>
        ) : null}
      </header>

      <section className={card} aria-labelledby="why-heading">
        <h2 id="why-heading" className={heading}>
          The agents&apos; view
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <ViewChip call={demo.call} owned />
            <span className="text-zk-text2">
              {agreementWords(demo)} · Risk: {RISK_LEVEL_LABEL[demo.risk]}
            </span>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-zk-text">
            {demo.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <div>
            <p className="font-semibold text-zk-text">What would change our mind</p>
            <p className="text-zk-text2">{demo.changeMind}</p>
          </div>
        </div>
      </section>

      <section className={card} aria-labelledby="history-heading">
        <h2 id="history-heading" className={heading}>
          History of the view
        </h2>
        <ul className="space-y-1 text-sm text-zk-text2">
          {demo.history.map((h) => (
            <li key={h.date}>
              {h.date} · {CALL_WORDS[h.call]} at ${h.price.toFixed(2)}
            </li>
          ))}
        </ul>
      </section>

      <section className={card} aria-labelledby="sources-heading">
        <h2 id="sources-heading" className={heading}>
          Sources
        </h2>
        <ul className="space-y-1 text-sm">
          {demo.sources.map((source) => (
            <li key={source} className="truncate">
              <span className="text-zk-accent">{source}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="rounded-xl border border-dashed border-zk-border p-4 text-xs text-zk-muted">
        Demo · example data. {demo.name} is a made-up company and these numbers are not real. Nothing on this page
        reads or saves anything, and the edit buttons are left out. {FINANCE_FOOTER}
      </p>

      <FinanceFooter />
    </div>
  );
}
