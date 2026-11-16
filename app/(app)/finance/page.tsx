import Link from "next/link";
import { optionalUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { normalizeSymbol, profileWords, sharesWords, tickerPath } from "@/lib/finance";
import { getProfile, listHoldings } from "@/lib/finance/holdings";
import { marketData } from "@/lib/finance/market-data";
import { FinanceFooter } from "@/components/finance/finance-footer";
import { FinanceSetup } from "@/components/finance/finance-setup";
import { FinanceWelcome } from "@/components/finance/finance-welcome";
import { AddHoldingForm, FinanceProfileMenu } from "@/components/finance/holding-forms";

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
        <p className="text-sm text-zk-text2">Agents are reviewing your stocks. Your first briefing arrives by tomorrow morning.</p>
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
                {holdings.map((h) => (
                  <tr key={h.id} className="border-b border-dashed border-zk-border last:border-0">
                    <td className="py-2 pr-2">
                      <Link href={tickerPath(h.ticker.symbol)} className="hover:underline">
                        <span className="font-mono font-semibold text-zk-text">{h.ticker.symbol}</span> <span className="text-zk-text2">{h.ticker.name}</span>
                      </Link>
                    </td>
                    <td className="py-2 pr-2 text-zk-text2">{sharesWords(h.shares)}</td>
                    <td className="py-2 pr-2 text-zk-muted">—</td>
                    <td className="py-2 text-zk-muted">Not reviewed yet</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={card} aria-labelledby="ideas-heading">
        <h2 id="ideas-heading" className={heading}>
          Ideas for you · {profileWords(profile)}
        </h2>
        <p className="text-sm text-zk-text2">Ideas appear here once agents agree on stocks that fit your answers.</p>
      </section>

      <section className={card} aria-labelledby="past-heading">
        <h2 id="past-heading" className={heading}>
          Past briefings
        </h2>
        <p className="text-sm text-zk-text2">None yet.</p>
      </section>

      <FinanceFooter />
    </div>
  );
}
