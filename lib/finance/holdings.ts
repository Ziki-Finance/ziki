import type { FinanceHorizon, FinanceRiskComfort, Prisma, PrismaClient } from "@prisma/client";
import { FINANCE_TRIAL_DAYS, normalizeSymbol } from "@/lib/finance";
import { eastern } from "./calendar";
import { marketData } from "./market-data";

/**
 * A person's Finance profile and holdings (FIN-CR-003, ideas 2 and 3).
 *
 * Everything here is private to that person. Every read and write is scoped by
 * `userId`, so one person can never see or change another's holdings. Nothing
 * here writes events, webhooks or logs with holding data.
 */

type Db = PrismaClient | Prisma.TransactionClient;

export class FinanceError extends Error {
  constructor(
    readonly code: "unknown_ticker" | "not_set_up" | "not_found" | "invalid",
    message: string,
  ) {
    super(message);
  }
}

export type ProfileAnswers = { riskComfort: FinanceRiskComfort; horizon: FinanceHorizon; timezone: string };

export async function getProfile(db: Db, userId: string) {
  return db.financeProfile.findUnique({ where: { userId } });
}

/**
 * First setup, or changing the answers later. The notice time and the trial are
 * set once, at first setup, and never moved by a later change.
 */
export async function saveProfile(db: Db, userId: string, answers: ProfileAnswers, now = new Date()) {
  const trialEndsAt = new Date(now.getTime() + FINANCE_TRIAL_DAYS * 24 * 60 * 60 * 1000);
  return db.financeProfile.upsert({
    where: { userId },
    create: { userId, ...answers, noticeAcceptedAt: now, trialEndsAt },
    update: { riskComfort: answers.riskComfort, horizon: answers.horizon, timezone: answers.timezone },
  });
}

export async function setBriefingEmail(db: Db, userId: string, on: boolean): Promise<void> {
  await db.financeProfile.updateMany({ where: { userId }, data: { briefingEmail: on } });
}

/** The shared, owner-free ticker row for a symbol, created the first time anyone adds it. */
export async function ensureTicker(db: Db, rawSymbol: string) {
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) throw new FinanceError("unknown_ticker", "That isn't a US ticker. Try a symbol like AAPL, or a company name.");
  const existing = await db.financeTicker.findUnique({ where: { symbol } });
  if (existing) return existing;
  const match = await marketData().lookup(symbol);
  if (!match) throw new FinanceError("unknown_ticker", `We couldn't find ${symbol}. v1 covers US-listed stocks and ETFs.`);
  return db.financeTicker.upsert({
    where: { symbol },
    create: { symbol: match.symbol, name: match.name, exchange: match.exchange, type: match.type },
    update: {},
  });
}

export type HoldingInput = { symbol: string; shares: number | null };

/**
 * Adds a stock, or updates it if the person already has it: never a
 * duplicate. Adding again a stock they sold brings it back. The day's close is
 * saved as `addedPrice`, so "Up 4% since you added it" asks the person nothing
 * (idea 27, layer 1). What they paid is asked for later, on the stock's own
 * page, and is never part of adding.
 */
export async function addHolding(db: Db, userId: string, input: HoldingInput) {
  const profile = await db.financeProfile.findUnique({ where: { userId }, select: { noticeAcceptedAt: true } });
  if (!profile) throw new FinanceError("not_set_up", "Accept the notice and answer the two questions first.");
  const ticker = await ensureTicker(db, input.symbol);
  const bar = input.shares === null ? null : await marketData().latestBar(ticker.symbol);
  return db.financeHolding.upsert({
    where: { userId_tickerId: { userId, tickerId: ticker.id } },
    create: { userId, tickerId: ticker.id, shares: input.shares, avgCost: null, addedPrice: bar?.close ?? null },
    update: {
      shares: input.shares,
      // Watching only: what they paid no longer applies.
      ...(input.shares === null ? { avgCost: null, avgCostAsOf: null } : {}),
      // With no price today, keep the one already recorded rather than blanking the line.
      ...(bar ? { addedPrice: bar.close } : {}),
      soldAt: null,
    },
    include: { ticker: true },
  });
}

/** The person's holdings and watch list (not the ones they sold), owned first, then A–Z. */
export async function listHoldings(db: Db, userId: string) {
  const rows = await db.financeHolding.findMany({
    where: { userId, soldAt: null },
    include: { ticker: { select: { id: true, symbol: true, name: true, type: true, exchange: true } } },
    orderBy: { ticker: { symbol: "asc" } },
  });
  return [...rows.filter((r) => r.shares !== null), ...rows.filter((r) => r.shares === null)];
}

/** One of the person's own holdings by ticker; null when they don't have it. */
export async function holdingFor(db: Db, userId: string, symbol: string) {
  const normal = normalizeSymbol(symbol);
  if (!normal) return null;
  return db.financeHolding.findFirst({
    where: { userId, ticker: { symbol: normal } },
    include: { ticker: true },
  });
}

async function ownHolding(db: Db, userId: string, holdingId: string) {
  const row = await db.financeHolding.findFirst({ where: { id: holdingId, userId }, select: { id: true } });
  if (!row) throw new FinanceError("not_found", "That stock isn't on your list any more.");
  return row;
}

/** Changes the share count. Empty shares turns it into watch only, which clears what they paid. */
export async function updateShares(db: Db, userId: string, holdingId: string, shares: number | null) {
  await ownHolding(db, userId, holdingId);
  await db.financeHolding.update({
    where: { id: holdingId },
    data: shares === null ? { shares, avgCost: null, avgCostAsOf: null } : { shares },
  });
}

/**
 * What they paid per share, typed by them (idea 27, layer 2). A number clears a
 * date they picked before; null clears both. Information only, never advice, and
 * agents never see it.
 */
export async function setPaidPrice(db: Db, userId: string, holdingId: string, price: number | null) {
  await ownHolding(db, userId, holdingId);
  await db.financeHolding.update({ where: { id: holdingId }, data: { avgCost: price, avgCostAsOf: null } });
}

/**
 * What they paid, worked out from the close on a date they picked (idea 27,
 * layer 3). The free data plan has no price history, so only days we recorded a
 * closing price for are accepted, and a future date is refused.
 */
export async function setPaidFromDate(db: Db, userId: string, holdingId: string, date: string, now = new Date()) {
  const row = await db.financeHolding.findFirst({ where: { id: holdingId, userId }, select: { id: true, tickerId: true } });
  if (!row) throw new FinanceError("not_found", "That stock isn't on your list any more.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new FinanceError("invalid", "Pick a date.");
  if (date > eastern(now).date) throw new FinanceError("invalid", "Pick a date in the past.");
  const snapshot = await db.financeSnapshot.findUnique({
    where: { tickerId_date: { tickerId: row.tickerId, date } },
    select: { close: true },
  });
  if (!snapshot?.close) {
    throw new FinanceError("invalid", `We don't have a closing price for that day. Pick one we've recorded for this stock.`);
  }
  await db.financeHolding.update({
    where: { id: holdingId },
    data: { avgCost: snapshot.close, avgCostAsOf: new Date(`${date}T12:00:00Z`) },
  });
}

/** "I sold this": it stays in their history but stops counting as held. */
export async function markSold(db: Db, userId: string, holdingId: string, now = new Date()) {
  await ownHolding(db, userId, holdingId);
  await db.financeHolding.update({ where: { id: holdingId }, data: { soldAt: now } });
}

/** "Stop watching": removes it from their list. */
export async function stopWatching(db: Db, userId: string, holdingId: string) {
  await ownHolding(db, userId, holdingId);
  await db.financeHolding.delete({ where: { id: holdingId } });
}
