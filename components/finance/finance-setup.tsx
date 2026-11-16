"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setUpFinanceAction, type FinanceActionResult } from "@/app/actions/finance";
import { FINANCE_NOTICE, FINANCE_TRIAL_DAYS } from "@/lib/finance";
import type { TickerMatch } from "@/lib/finance/market-data";
import { ProfileChoices } from "./profile-choices";
import { TickerBox } from "./ticker-box";

type Row = { symbol: string; name: string; shares: string };

/**
 * First visit (wireframe 2): one scrolling screen, not a wizard. The notice and
 * 18+ tick, the two questions, then what they own or want to watch. The button
 * stays disabled until the box is ticked.
 */
export function FinanceSetup({ initial }: { initial: TickerMatch | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FinanceActionResult, FormData>(setUpFinanceAction, {});
  const [accepted, setAccepted] = useState(false);
  const [rows, setRows] = useState<Row[]>(initial ? [{ symbol: initial.symbol, name: initial.name, shares: "" }] : []);
  // The person's time zone, for the 07:00 briefing; the server checks it and falls back to US Eastern.
  const timezone = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      if (timezone.current) timezone.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    } catch {
      // Left empty: the server uses its default.
    }
  }, []);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  function add(match: TickerMatch) {
    setRows((current) => (current.some((r) => r.symbol === match.symbol) ? current : [...current, { symbol: match.symbol, name: match.name, shares: "" }]));
  }
  /** "Just watch instead" (idea 22): the stock goes in with no shares, so it is only watched. */
  function watch(symbol: string) {
    const match = rows.find((r) => r.symbol === symbol);
    if (match) return;
    setRows((current) => (current.some((r) => r.symbol === symbol) ? current : [...current, { symbol, name: "", shares: "" }]));
  }
  function change(i: number, patch: Partial<Row>) {
    setRows((current) => current.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  return (
    <form action={action} className="space-y-6">
      <input ref={timezone} type="hidden" name="timezone" defaultValue="" />

      <section className="space-y-3 rounded-xl border border-zk-border bg-zk-surface p-5" aria-labelledby="notice-heading">
        <h2 id="notice-heading" className="text-sm font-semibold text-zk-text">
          Before you start
        </h2>
        <p className="text-sm text-zk-text2">{FINANCE_NOTICE}</p>
        <label className="flex items-start gap-2 text-sm text-zk-text">
          <input type="checkbox" name="notice" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
          I understand, and I&apos;m 18 or over
        </label>
      </section>

      <section className="space-y-3 rounded-xl border border-zk-border bg-zk-surface p-5" aria-labelledby="questions-heading">
        <h2 id="questions-heading" className="text-sm font-semibold text-zk-text">
          Two quick questions
        </h2>
        <ProfileChoices />
      </section>

      <section className="space-y-3 rounded-xl border border-zk-border bg-zk-surface p-5" aria-labelledby="own-heading">
        <h2 id="own-heading" className="text-sm font-semibold text-zk-text">
          Add what you own
        </h2>
        <p className="text-sm text-zk-text2">Pick a stock, then type how many shares you have. Leave shares empty to just watch it.</p>
        <TickerBox onPick={add} onWatch={watch} placeholder="Ticker or company, e.g. AAPL or Apple" />
        {rows.length > 0 ? (
          <ul className="divide-y divide-dashed divide-zk-border">
            {rows.map((row, i) => (
              <li key={row.symbol} className="flex flex-wrap items-center gap-2 py-2">
                <input type="hidden" name="symbol" value={row.symbol} />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-mono font-semibold text-zk-text">{row.symbol}</span> <span className="text-zk-text2">{row.name}</span>
                </span>
                <label className="sr-only" htmlFor={`shares-${row.symbol}`}>
                  Shares of {row.symbol}
                </label>
                <input
                  id={`shares-${row.symbol}`}
                  name="shares"
                  inputMode="decimal"
                  placeholder="Shares (empty = watch)"
                  value={row.shares}
                  onChange={(e) => change(i, { shares: e.target.value })}
                  className="w-44 rounded-md border border-zk-border bg-zk-surface px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setRows((current) => current.filter((_, j) => j !== i))}
                  className="text-xs text-zk-muted hover:text-zk-text"
                  aria-label={`Remove ${row.symbol}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-zk-muted">Nothing added yet. You can also add stocks later.</p>
        )}
      </section>

      {state.error ? (
        <p role="alert" className="text-sm text-zk-bad-fg">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zk-text2">{FINANCE_TRIAL_DAYS} days free, then a monthly fee in Ziks.</p>
        <button type="submit" disabled={!accepted || pending} className="rounded-lg bg-zk-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Saving…" : "Start my briefings"}
        </button>
      </div>
    </form>
  );
}
