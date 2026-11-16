import type { Prisma, PrismaClient } from "@prisma/client";
import { eastern } from "./calendar";

/**
 * Prices already recorded, worked out for the page (FIN-CR-006, PR B): today's
 * change, the 30-day sparkline, the portfolio line and "since you added it".
 *
 * Nothing here calls the data provider. It reads the snapshots the evening run
 * stored, so opening the page costs no calls and works when a provider is down.
 */

type Db = PrismaClient | Prisma.TransactionClient;

export type BarPoint = { date: string; close: number };

/** How many days of closes the sparkline shows. */
export const SPARKLINE_DAYS = 30;

/** "YYYY-MM-DD" `days` before a "YYYY-MM-DD". */
export function daysBefore(date: string, days: number): string {
  const at = new Date(`${date}T12:00:00Z`);
  at.setUTCDate(at.getUTCDate() - days);
  return at.toISOString().slice(0, 10);
}

/** The closes per ticker, oldest first, at most `days` each. */
export async function recentBars(db: Db, tickerIds: readonly string[], days = SPARKLINE_DAYS, now = new Date()): Promise<Map<string, BarPoint[]>> {
  const out = new Map<string, BarPoint[]>();
  if (tickerIds.length === 0) return out;
  const from = daysBefore(eastern(now).date, days);
  const rows = await db.financeSnapshot.findMany({
    where: { tickerId: { in: [...tickerIds] }, date: { gte: from }, close: { not: null } },
    orderBy: { date: "asc" },
    select: { tickerId: true, date: true, close: true },
  });
  for (const row of rows) {
    if (row.close === null) continue;
    const list = out.get(row.tickerId) ?? [];
    list.push({ date: row.date, close: Number(row.close) });
    out.set(row.tickerId, list);
  }
  return out;
}

/** Each ticker's latest recorded change in percent, for the "Today" column. */
export async function latestChanges(db: Db, tickerIds: readonly string[]): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  if (tickerIds.length === 0) return out;
  const rows = await db.financeSnapshot.findMany({
    where: { tickerId: { in: [...tickerIds] } },
    orderBy: { date: "desc" },
    distinct: ["tickerId"],
    select: { tickerId: true, changePct: true },
  });
  for (const row of rows) out.set(row.tickerId, row.changePct ?? null);
  return out;
}

/** The change from the previous close to the latest one, in percent; null without both. */
export function dayChange(closes: readonly BarPoint[]): number | null {
  return changeSince(closes[closes.length - 1]?.close ?? null, closes[closes.length - 2]?.close ?? null);
}

/**
 * The person's own change yesterday, in percent: shares × the previous close
 * weigh each holding, instead of a plain average of percentages. Watch-only
 * stocks are left out, and so is anything without a price.
 */
export function portfolioChange(
  holdings: readonly { tickerId: string; shares: number | null }[],
  bars: ReadonlyMap<string, readonly BarPoint[]>,
): number | null {
  let nowValue = 0;
  let thenValue = 0;
  for (const holding of holdings) {
    if (holding.shares === null || !(holding.shares > 0)) continue;
    const closes = bars.get(holding.tickerId);
    const latest = closes?.[closes.length - 1];
    const previous = closes?.[closes.length - 2];
    if (!latest || !previous || !(previous.close > 0)) continue;
    nowValue += holding.shares * latest.close;
    thenValue += holding.shares * previous.close;
  }
  if (!(thenValue > 0)) return null;
  return Math.round(((nowValue - thenValue) / thenValue) * 10_000) / 100;
}

/** The change from one price to another, in percent; null without both. */
export function changeSince(current: number | null | undefined, then: number | null | undefined): number | null {
  if (current == null || then == null || !(then > 0)) return null;
  return Math.round(((current - then) / then) * 10_000) / 100;
}

/** The last close we recorded for a ticker, or null. */
export function lastClose(bars: ReadonlyMap<string, readonly BarPoint[]>, tickerId: string): number | null {
  const closes = bars.get(tickerId);
  return closes?.[closes.length - 1]?.close ?? null;
}

/**
 * An SVG polyline's points for a sparkline, drawn in a `width`×`height` box.
 * A flat line sits in the middle; fewer than two closes draws nothing.
 */
export function sparklinePoints(values: readonly number[], width = 96, height = 28): string {
  if (values.length < 2) return "";
  let min = values[0];
  let max = values[0];
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const span = max - min;
  return values
    .map((value, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = span === 0 ? height / 2 : height - ((value - min) / span) * height;
      return `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`;
    })
    .join(" ");
}
