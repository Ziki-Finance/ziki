import Link from "next/link";
import { startWithTickerAction } from "@/app/actions/finance";
import { FINANCE_FOOTER } from "@/lib/finance";
import { TickerBox } from "./ticker-box";

/**
 * /finance signed out (wireframe 1, FIN-D-011): one box and a static example
 * briefing. Typing a ticker asks the person to sign in, then brings them back
 * to setup with that ticker already added.
 */
export function FinanceWelcome() {
  return (
    <div className="flex min-h-screen flex-col bg-zk-bg">
      <header className="border-b border-zk-border bg-zk-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-zk-text">
            Ziki
          </Link>
          <Link href="/login?callbackUrl=%2Ffinance" className="text-sm font-bold text-zk-accent hover:underline">
            Sign in
          </Link>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10">
        <section className="space-y-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-zk-text sm:text-3xl">Agents watch your stocks. You get one short note each morning.</h1>
          <p className="max-w-prose text-zk-text2">
            They tell you what to keep, what to think about selling, and what&apos;s worth watching, with the reasons in plain words.
          </p>
          <form action={startWithTickerAction} className="flex flex-col gap-2 sm:flex-row">
            <TickerBox label="What do you own?" placeholder="What do you own? Type a ticker or company" />
            <button type="submit" className="rounded-lg bg-zk-accent px-4 py-2 text-sm font-semibold text-white">
              Get started
            </button>
          </form>
        </section>

        <section aria-labelledby="example-heading" className="space-y-3 rounded-xl border border-zk-border bg-zk-surface p-5">
          <h2 id="example-heading" className="text-xs font-semibold uppercase tracking-wider text-zk-muted">
            Example briefing
          </h2>
          <div className="space-y-3 text-sm text-zk-text">
            <p className="font-semibold">Good morning. Here&apos;s your portfolio for Tuesday.</p>
            <p>Overall: your holdings rose 1.2% yesterday (S&amp;P 500: +0.8%).</p>
            <div>
              <p className="font-semibold">Needs a look (1)</p>
              <p className="text-zk-text2">
                Consider selling Acme Corp (ACME): sales fell for the second quarter and two big customers left. 4 of 5 agents agree. Risk: High.
              </p>
            </div>
            <div>
              <p className="font-semibold">All good (3)</p>
              <p className="text-zk-text2">Keep Contoso (CTSO), Fabrikam (FBK), Vanguard S&amp;P 500 ETF (VOO).</p>
            </div>
            <div>
              <p className="font-semibold">New idea (1)</p>
              <p className="text-zk-text2">Northwind (NWND): growing steadily, low debt. Fits a Balanced profile.</p>
            </div>
            <p className="text-xs text-zk-muted">This is an example with made-up companies, not a real briefing.</p>
          </div>
        </section>

        <p className="border-t border-dashed border-zk-border pt-3 text-xs text-zk-muted">{FINANCE_FOOTER}</p>
      </main>
    </div>
  );
}
