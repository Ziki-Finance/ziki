import type { FinanceTickerType } from "@prisma/client";
import { directoryEntry, searchDirectory } from "./directory";

/**
 * The one place Ziki Finance talks to market data (FIN-D-013).
 *
 * No licensed provider has been chosen yet (PRD §9.3: Polygon.io, Alpaca or
 * Financial Modeling Prep). Until one is, search uses the built-in directory
 * and there are no prices: pages show "—". Wiring a provider in means
 * implementing `MarketData` for it and returning it from `marketData()`.
 */

export type TickerMatch = { symbol: string; name: string; exchange: string | null; type: FinanceTickerType };

export type DailyBar = {
  /** The trading day, "YYYY-MM-DD" (US Eastern). */
  date: string;
  close: number;
  /** Change from the previous close, in percent. */
  changePct: number;
};

export type Headline = { title: string; url: string; publishedAt: string; kind: "news" | "filing" | "earnings" };

export interface MarketData {
  /** A short name for logs and the staff page, e.g. "directory" or "polygon". */
  readonly name: string;
  /** Whether it has prices. False for the built-in directory. */
  readonly hasPrices: boolean;
  search(query: string, limit?: number): Promise<TickerMatch[]>;
  /** One ticker by its exact symbol; null when it isn't a US-listed stock or ETF it knows. */
  lookup(symbol: string): Promise<TickerMatch | null>;
  /** The latest end-of-day bar; null without prices. */
  latestBar(symbol: string): Promise<DailyBar | null>;
  /** News, filings and earnings headlines since a time (links and titles only). */
  headlines(symbol: string, since: Date): Promise<Headline[]>;
}

/** The built-in list: search and names, no prices, no headlines. */
export const directoryMarketData: MarketData = {
  name: "directory",
  hasPrices: false,
  async search(query, limit) {
    return searchDirectory(query, limit).map(({ symbol, name, exchange, type }) => ({ symbol, name, exchange, type }));
  },
  async lookup(symbol) {
    const entry = directoryEntry(symbol);
    return entry ? { symbol: entry.symbol, name: entry.name, exchange: entry.exchange, type: entry.type } : null;
  },
  async latestBar() {
    return null;
  },
  async headlines() {
    return [];
  },
};

let override: MarketData | null = null;

/** The market data in use. */
export function marketData(): MarketData {
  return override ?? directoryMarketData;
}

/** Tests only: use another provider, or `null` to go back. */
export function setMarketDataForTests(provider: MarketData | null): void {
  override = provider;
}
