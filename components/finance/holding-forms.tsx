"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { FinanceHorizon, FinanceRiskComfort } from "@prisma/client";
import {
  addHoldingAction,
  editSharesAction,
  updateFinanceProfileAction,
  type FinanceActionResult,
} from "@/app/actions/finance";
import { ProfileChoices } from "./profile-choices";
import { TickerBox } from "./ticker-box";

const input = "rounded-md border border-zk-border bg-zk-surface px-2 py-1.5 text-sm";
const primary = "rounded-md bg-zk-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50";

/** "+ Add" on the Finance page: a stock, with shares or empty to watch. Adding one already listed updates it. */
export function AddHoldingForm() {
  const [state, action, pending] = useActionState<FinanceActionResult, FormData>(addHoldingAction, {});
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  const handled = useRef<FinanceActionResult | null>(null);
  useEffect(() => {
    if (state.ok && handled.current !== state) {
      handled.current = state;
      setKey((k) => k + 1);
    }
  }, [state]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-md border border-zk-border px-3 py-1.5 text-sm text-zk-text2 hover:bg-zk-chip">
        + Add
      </button>
    );
  }
  return (
    <form key={key} action={action} className="flex w-full flex-col gap-2 sm:flex-row sm:items-start">
      <TickerBox />
      <label className="sr-only" htmlFor="add-shares">
        Shares
      </label>
      <input id="add-shares" name="shares" inputMode="decimal" placeholder="Shares (empty = watch)" className={`${input} sm:w-44`} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Adding…" : "Add"}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-zk-bad-fg sm:basis-full">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

/** "Edit shares" on a holding's page. Empty shares turns it into watch only. */
export function EditSharesForm({ holdingId, shares, avgCost }: { holdingId: string; shares: string; avgCost: string }) {
  const [state, action, pending] = useActionState<FinanceActionResult, FormData>(editSharesAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="holdingId" value={holdingId} />
      <label className="text-sm text-zk-text2" htmlFor="edit-shares">
        Shares
      </label>
      <input id="edit-shares" name="shares" defaultValue={shares} inputMode="decimal" placeholder="empty = watch" className={`${input} w-32`} />
      <label className="text-sm text-zk-text2" htmlFor="edit-cost">
        Avg price paid
      </label>
      <input id="edit-cost" name="avgCost" defaultValue={avgCost} inputMode="decimal" placeholder="optional" className={`${input} w-28`} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Saving…" : "Edit shares"}
      </button>
      {state.ok ? <span className="text-sm text-zk-text2">Saved.</span> : null}
      {state.error ? (
        <p role="alert" className="basis-full text-sm text-zk-bad-fg">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

/** The "⋯" menu: change the two answers and the briefing email. */
export function FinanceProfileMenu({ risk, horizon, briefingEmail }: { risk: FinanceRiskComfort; horizon: FinanceHorizon; briefingEmail: boolean }) {
  const [state, action, pending] = useActionState<FinanceActionResult, FormData>(updateFinanceProfileAction, {});
  return (
    <details className="group relative">
      <summary aria-label="Finance settings" className="cursor-pointer list-none rounded-md border border-zk-border px-2.5 py-1 text-sm text-zk-text2 hover:bg-zk-chip">
        ⋯
      </summary>
      <form action={action} className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] space-y-4 rounded-xl border border-zk-border bg-zk-surface p-4 shadow-lg">
        <ProfileChoices risk={risk} horizon={horizon} />
        <label className="flex items-center gap-2 text-sm text-zk-text">
          <input type="checkbox" name="briefingEmail" defaultChecked={briefingEmail} />
          Email me the daily briefing
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className={primary}>
            {pending ? "Saving…" : "Save"}
          </button>
          {state.ok ? <span className="text-sm text-zk-text2">Saved.</span> : null}
          {state.error ? <span className="text-sm text-zk-bad-fg">{state.error}</span> : null}
        </div>
      </form>
    </details>
  );
}
