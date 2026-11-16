"use client";

import { useEffect, useId, useRef, useState } from "react";
import { searchTickersAction } from "@/app/actions/finance";
import type { TickerMatch } from "@/lib/finance/market-data";

/**
 * The one box: type a ticker or a company name, pick from the list. The company
 * name always shows next to the ticker (PRD §5). The chosen ticker is posted as
 * `name`; typing a symbol and pressing Enter works without picking.
 */
export function TickerBox({
  name = "symbol",
  defaultValue = "",
  placeholder = "Ticker or company, e.g. AAPL or Apple",
  onPick,
  onWatch,
  label = "Ticker or company",
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  onPick?: (match: TickerMatch) => void;
  /** The other choice beside the box: watch what is typed, with no shares (idea 22). */
  onWatch?: (symbol: string) => void;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [matches, setMatches] = useState<TickerMatch[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const listId = useId();
  // Nothing typed: no list, whatever the last search found.
  const shown = value.trim() ? matches : [];
  const seq = useRef(0);

  useEffect(() => {
    const q = value.trim();
    if (!q) return;
    const mine = ++seq.current;
    const timer = setTimeout(() => {
      searchTickersAction(q)
        .then((found) => {
          if (mine === seq.current) setMatches(found);
        })
        .catch(() => {});
    }, 150);
    return () => clearTimeout(timer);
  }, [value]);

  function pick(match: TickerMatch) {
    setValue(onPick ? "" : match.symbol);
    setOpen(false);
    setActive(-1);
    onPick?.(match);
  }

  return (
    <div className="relative min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`${listId}-input`}>
          {label}
        </label>
        <input
          id={`${listId}-input`}
          name={onPick ? undefined : name}
          value={value}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open && shown.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zk-border bg-zk-surface px-3 py-2 text-sm text-zk-text placeholder:text-zk-muted focus:border-zk-accent focus:outline-none"
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(event) => {
            if (!open || shown.length === 0) {
              if (event.key === "Enter" && onPick && value.trim()) {
                event.preventDefault();
                const exact = shown.find((m) => m.symbol === value.trim().toUpperCase());
                if (exact) pick(exact);
              }
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => (i + 1) % shown.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => (i <= 0 ? shown.length - 1 : i - 1));
            } else if (event.key === "Enter") {
              const choice = shown[active] ?? (onPick ? shown[0] : undefined);
              if (choice) {
                event.preventDefault();
                pick(choice);
              }
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {onWatch ? (
          <button
            type="button"
            onClick={() => {
              const symbol = value.trim().toUpperCase();
              if (!symbol) return;
              setValue("");
              setOpen(false);
              onWatch(symbol);
            }}
            className="whitespace-nowrap rounded-lg border border-zk-border px-3 py-2 text-sm text-zk-text2 hover:bg-zk-chip"
          >
            Just watch instead
          </button>
        ) : null}
      </div>
      {open && shown.length > 0 ? (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-zk-border bg-zk-surface py-1 shadow-lg">
          {shown.map((match, i) => (
            <li
              key={match.symbol}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`flex cursor-pointer items-baseline gap-2 px-3 py-1.5 text-sm ${i === active ? "bg-zk-chip" : ""}`}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(match);
              }}
            >
              <span className="font-mono font-semibold text-zk-text">{match.symbol}</span>
              <span className="truncate text-zk-text2">{match.name}</span>
              {match.type === "etf" ? <span className="ml-auto text-xs text-zk-muted">ETF</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
