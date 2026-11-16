"use client";

import { useActionState, useState } from "react";
import { addHoldingAction, type FinanceActionResult } from "@/app/actions/finance";

const button = "rounded-md border border-zk-border px-3 py-1 text-sm text-zk-text2 hover:bg-zk-chip disabled:opacity-50";

/** "Watch" adds an idea to the watch list; "I bought this" asks for the shares and makes it a holding (idea 12). */
export function IdeaActions({ symbol }: { symbol: string }) {
  const [state, action, pending] = useActionState<FinanceActionResult, FormData>(addHoldingAction, {});
  const [bought, setBought] = useState(false);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="symbol" value={symbol} />
      {bought ? (
        <>
          <label className="sr-only" htmlFor={`bought-${symbol}`}>
            Shares of {symbol} you bought
          </label>
          <input id={`bought-${symbol}`} name="shares" inputMode="decimal" required placeholder="Shares" className="w-24 rounded-md border border-zk-border bg-zk-surface px-2 py-1 text-sm" />
          <button type="submit" disabled={pending} className={button}>
            Save
          </button>
          <button type="button" onClick={() => setBought(false)} className="text-xs text-zk-muted hover:text-zk-text">
            Cancel
          </button>
        </>
      ) : (
        <>
          <input type="hidden" name="shares" value="" />
          <button type="submit" disabled={pending} className={button}>
            Watch
          </button>
          <button type="button" onClick={() => setBought(true)} className={button}>
            I bought this
          </button>
        </>
      )}
      {state.error ? (
        <p role="alert" className="basis-full text-sm text-zk-bad-fg">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
