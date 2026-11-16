import Link from "next/link";
import { FINANCE_FOOTER, RISK_LEVEL_LABEL, agreementWords } from "@/lib/finance";
import type { BriefingContent } from "@/lib/finance/briefing";
import { BriefingView } from "@/components/finance/briefing-view";
import { FinanceFooter } from "@/components/finance/finance-footer";
import { ViewChip } from "@/components/finance/view-chip";

/**
 * What Finance looks like once agents have done a few nights (demo for showing
 * the finished product). Nothing here is read from or written to the database:
 * every company, price and agent count is made up, and the holdings are not a
 * real person's. Like /finance it is unlisted (FIN-D-011) — nothing links here.
 */
export const metadata = { title: "Finance · what it looks like" };

const card = "space-y-3 rounded-xl border border-zk-border bg-zk-surface p-5";
const heading = "text-xs font-semibold uppercase tracking-wider text-zk-muted";

const today: BriefingContent = {
  date: "2026-11-17",
  dateWords: "Tue 17 Nov",
  overall: "Overall: your holdings rose 1.2% yesterday (S&P 500: +0.8%).",
  market: "The wider market rose 0.8%, led by technology shares.",
  needsLook: [
    {
      symbol: "ACME",
      name: "Acme Corp",
      call: "consider_selling",
      risk: "high",
      reason: "Sales fell for the second quarter and two big customers left.",
      agentsAgree: 4,
      agentsTotal: 5,
      notReviewedToday: false,
    },
  ],
  allGood: [
    {
      symbol: "CTSO",
      name: "Contoso",
      call: "buy_keep",
      risk: "low",
      reason: "Steady sales growth and no new debt.",
      agentsAgree: 5,
      agentsTotal: 5,
      notReviewedToday: false,
    },
    {
      symbol: "FBK",
      name: "Fabrikam",
      call: "buy_keep",
      risk: "medium",
      reason: "Margins held up through a weak quarter for the industry.",
      agentsAgree: 4,
      agentsTotal: 5,
      notReviewedToday: false,
    },
    {
      symbol: "VOO",
      name: "Vanguard S&P 500 ETF",
      call: "buy_keep",
      risk: "low",
      reason: "Broad market fund; no company news that would change the view.",
      agentsAgree: 5,
      agentsTotal: 5,
      notReviewedToday: false,
    },
  ],
  watching: [
    {
      symbol: "NWND",
      name: "Northwind",
      call: "buy_keep",
      risk: "medium",
      reason: "Growing steadily with low debt, and still at a fair price.",
      agentsAgree: 3,
      agentsTotal: 5,
      notReviewedToday: false,
    },
  ],
  waiting: [{ symbol: "LMBR", name: "Lumber Co" }],
  newIdea: {
    symbol: "NWND",
    name: "Northwind",
    risk: "medium",
    reason: "Growing steadily, low debt, and priced below its peers.",
    agentsAgree: 3,
    agentsTotal: 5,
    fits: "Balanced",
  },
};

const yesterday: BriefingContent = {
  ...today,
  date: "2026-11-16",
  dateWords: "Mon 16 Nov",
  overall: "Overall: your holdings rose 0.4% yesterday (S&P 500: +0.2%).",
  market: "The wider market was little changed.",
  waiting: [],
};

// Two of them open a holding page with example data (a down one and an up one);
// the rest are plain text, because they have no page in the demo.
const holdings = [
  { symbol: "ACME", name: "Acme Corp", shares: "120", view: "consider_selling" as const, owned: true, why: "Sales fell for the second quarter and two big customers left.", detail: true },
  { symbol: "CTSO", name: "Contoso", shares: "40", view: "buy_keep" as const, owned: true, why: "Steady sales growth and no new debt.", detail: true },
  { symbol: "FBK", name: "Fabrikam", shares: "15", view: "buy_keep" as const, owned: true, why: "Margins held up through a weak quarter for the industry.", detail: false },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", shares: "12", view: "buy_keep" as const, owned: true, why: "Broad market fund; no company news that would change the view.", detail: false },
  { symbol: "NWND", name: "Northwind", shares: "watching only", view: "buy_keep" as const, owned: false, why: "Growing steadily with low debt, and still at a fair price.", detail: false },
];

export default function FinanceDemoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-zk-text">Finance</h1>
          <span className="rounded-full border border-zk-border px-2 py-0.5 text-xs font-semibold text-zk-muted">
            Demo · example data
          </span>
        </div>
        <p className="text-sm text-zk-text2">
          What a person sees after a few nights: agents have reviewed their stocks, agreed on a view, and this
          morning&apos;s briefing is waiting. Every company, price and agent count below is made up. ACME and CTSO
          open with example data, one down and one up.
        </p>
      </header>

      <section className={card} aria-labelledby="briefing-heading">
        <h2 id="briefing-heading" className={heading}>
          Today&apos;s briefing
        </h2>
        <BriefingView content={today} />
      </section>

      <section className={card} aria-labelledby="holdings-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="holdings-heading" className={heading}>
            Your holdings
          </h2>
          <span className="text-xs text-zk-muted">&times; 3 owned · watching 2</span>
        </div>
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
              {holdings.map((h, i) => (
                <tr key={h.symbol} className="border-b border-dashed border-zk-border last:border-0">
                  <td className="py-2 pr-2">
                    {h.detail ? (
                      <Link href={`/finance/demo/${h.symbol}`} className="hover:underline">
                        <span className="font-mono font-semibold text-zk-text">{h.symbol}</span>{" "}
                        <span className="text-zk-text2">{h.name}</span>
                      </Link>
                    ) : (
                      <span>
                        <span className="font-mono font-semibold text-zk-text">{h.symbol}</span>{" "}
                        <span className="text-zk-text2">{h.name}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-zk-text2">{h.shares}</td>
                  <td className="py-2 pr-2 text-zk-muted">{["+0.4%", "−0.8%", "+1.1%", "+0.6%", "+2.3%"][i]}</td>
                  <td className="py-2">
                    <span className="flex flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <ViewChip call={h.view} owned={h.owned} />
                      </span>
                      <span className="text-xs text-zk-text2">{h.why}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card} aria-labelledby="ideas-heading">
        <h2 id="ideas-heading" className={heading}>
          Ideas for you · Balanced · 1–5 years
        </h2>
        <ul className="divide-y divide-dashed divide-zk-border">
          <li className="space-y-1.5 py-3 first:pt-0 last:pb-0">
            <p className="text-sm">
              <span className="font-medium text-zk-text">Northwind (NWND)</span>{" "}
              <span className="text-zk-text2">
                · Risk: {RISK_LEVEL_LABEL.medium} · {agreementWords(today.newIdea!)}
              </span>
            </p>
            <p className="text-sm text-zk-text2">{today.newIdea!.reason}</p>
          </li>
        </ul>
      </section>

      <section className={card} aria-labelledby="past-heading">
        <h2 id="past-heading" className={heading}>
          Past briefings
        </h2>
        <ul className="space-y-2">
          {[yesterday].map((b) => (
            <li key={b.date}>
              <details>
                <summary className="cursor-pointer text-sm">
                  <span className="font-medium text-zk-text">{b.dateWords}</span>{" "}
                  <span className="text-zk-text2">One stock to look at: Acme Corp.</span>
                </summary>
                <div className="mt-2 border-l-2 border-zk-border pl-3">
                  <BriefingView content={b} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <p className="rounded-xl border border-dashed border-zk-border p-4 text-xs text-zk-muted">
        This page is a fixed example for showing the finished product. It reads nothing and saves nothing, and no
        company on it is real. {FINANCE_FOOTER}
      </p>

      <FinanceFooter />
    </div>
  );
}
