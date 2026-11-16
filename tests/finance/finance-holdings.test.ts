import { afterEach, describe, expect, it, vi } from "vitest";
import { FinanceError, addHolding, ensureTicker, listHoldings, markSold, saveProfile, setPaidFromDate, setPaidPrice, stopWatching, updateShares } from "@/lib/finance/holdings";
import { FinanceClearanceError, grantFinanceClearance, removeFinanceClearance } from "@/lib/finance/clearance";
import { setMarketDataForTests, type MarketData } from "@/lib/finance/market-data";

/** A fake Prisma client: every model method used here is a mock. */
function fakeDb() {
  return {
    financeProfile: { findUnique: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    financeTicker: { findUnique: vi.fn(), upsert: vi.fn() },
    financeHolding: { upsert: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    financeSnapshot: { findUnique: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  };
}
const asDb = (db: ReturnType<typeof fakeDb>) => db as never;
const now = new Date("2026-11-16T10:00:00Z");

describe("first-visit setup (idea 2)", () => {
  it("saves the notice time and a 7-day trial once, and later only changes the answers", async () => {
    const db = fakeDb();
    await saveProfile(asDb(db), "u1", { riskComfort: "balanced", horizon: "gt5", timezone: "Africa/Lagos" }, now);
    const call = db.financeProfile.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ userId: "u1" });
    expect(call.create).toMatchObject({ userId: "u1", noticeAcceptedAt: now, trialEndsAt: new Date("2026-11-23T10:00:00Z") });
    expect(call.update).toEqual({ riskComfort: "balanced", horizon: "gt5", timezone: "Africa/Lagos" });
  });
});

describe("holdings (idea 3)", () => {
  it("refuses to add stocks before setup", async () => {
    const db = fakeDb();
    db.financeProfile.findUnique.mockResolvedValue(null);
    await expect(addHolding(asDb(db), "u1", { symbol: "AAPL", shares: 10 })).rejects.toMatchObject({ code: "not_set_up" });
  });

  afterEach(() => setMarketDataForTests(null));

  it("creates the shared ticker from the directory, then upserts the person's holding (no duplicates), with no price without a provider", async () => {
    const db = fakeDb();
    db.financeProfile.findUnique.mockResolvedValue({ noticeAcceptedAt: now });
    db.financeTicker.findUnique.mockResolvedValue(null);
    db.financeTicker.upsert.mockResolvedValue({ id: "t1", symbol: "AAPL" });
    await addHolding(asDb(db), "u1", { symbol: "aapl", shares: 10 });
    expect(db.financeTicker.upsert.mock.calls[0][0].create).toEqual({ symbol: "AAPL", name: "Apple", exchange: "NASDAQ", type: "stock" });
    const call = db.financeHolding.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ userId_tickerId: { userId: "u1", tickerId: "t1" } });
    expect(call.create).toEqual({ userId: "u1", tickerId: "t1", shares: 10, avgCost: null, addedPrice: null });
    expect(call.update).toEqual({ shares: 10, soldAt: null });
  });

  it("saves the day's close as addedPrice when a provider has one (idea 27, layer 1)", async () => {
    const db = fakeDb();
    db.financeProfile.findUnique.mockResolvedValue({ noticeAcceptedAt: now });
    db.financeTicker.findUnique.mockResolvedValue({ id: "t1", symbol: "AAPL" });
    setMarketDataForTests({
      name: "test",
      hasPrices: true,
      search: async () => [],
      lookup: async () => null,
      latestBar: async () => ({ date: "2026-11-16", close: 230.5, changePct: 1.2 }),
      headlines: async () => [],
    } satisfies MarketData);
    await addHolding(asDb(db), "u1", { symbol: "AAPL", shares: 10 });
    expect(db.financeHolding.upsert.mock.calls[0][0].update).toEqual({ shares: 10, addedPrice: 230.5, soldAt: null });
  });

  it("never asks for a price while adding a watch-only stock", async () => {
    const db = fakeDb();
    db.financeProfile.findUnique.mockResolvedValue({ noticeAcceptedAt: now });
    db.financeTicker.findUnique.mockResolvedValue({ id: "t1", symbol: "VOO" });
    const latestBar = vi.fn();
    setMarketDataForTests({ name: "test", hasPrices: true, search: async () => [], lookup: async () => null, latestBar, headlines: async () => [] } satisfies MarketData);
    await addHolding(asDb(db), "u1", { symbol: "VOO", shares: null });
    expect(latestBar).not.toHaveBeenCalled();
    expect(db.financeHolding.upsert.mock.calls[0][0].update).toEqual({ shares: null, avgCost: null, avgCostAsOf: null, soldAt: null });
  });

  it("watch only clears shares and price paid; adding again without a provider keeps the old price", async () => {
    const db = fakeDb();
    db.financeProfile.findUnique.mockResolvedValue({ noticeAcceptedAt: now });
    db.financeTicker.findUnique.mockResolvedValue({ id: "t1", symbol: "VOO" });
    await addHolding(asDb(db), "u1", { symbol: "VOO", shares: null });
    expect(db.financeHolding.upsert.mock.calls[0][0].update).toEqual({ shares: null, avgCost: null, avgCostAsOf: null, soldAt: null });
    await addHolding(asDb(db), "u1", { symbol: "VOO", shares: 4 });
    expect(db.financeHolding.upsert.mock.calls[1][0].update).toEqual({ shares: 4, soldAt: null });
  });

  it("rejects a ticker the directory doesn't know", async () => {
    const db = fakeDb();
    db.financeTicker.findUnique.mockResolvedValue(null);
    await expect(ensureTicker(asDb(db), "ZZZZ")).rejects.toBeInstanceOf(FinanceError);
    await expect(ensureTicker(asDb(db), "not a ticker")).rejects.toMatchObject({ code: "unknown_ticker" });
  });

  it("lists only the person's own, unsold stocks, owned before watched", async () => {
    const db = fakeDb();
    db.financeHolding.findMany.mockResolvedValue([
      { id: "a", shares: null },
      { id: "b", shares: 3 },
    ]);
    const rows = await listHoldings(asDb(db), "u1");
    expect(db.financeHolding.findMany.mock.calls[0][0].where).toEqual({ userId: "u1", soldAt: null });
    expect(rows.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("never edits, sells or removes another person's holding", async () => {
    const db = fakeDb();
    db.financeHolding.findFirst.mockResolvedValue(null);
    await expect(updateShares(asDb(db), "u2", "h1", 5)).rejects.toMatchObject({ code: "not_found" });
    await expect(markSold(asDb(db), "u2", "h1")).rejects.toMatchObject({ code: "not_found" });
    await expect(stopWatching(asDb(db), "u2", "h1")).rejects.toMatchObject({ code: "not_found" });
    expect(db.financeHolding.findFirst.mock.calls[0][0].where).toEqual({ id: "h1", userId: "u2" });
    expect(db.financeHolding.update).not.toHaveBeenCalled();
    expect(db.financeHolding.delete).not.toHaveBeenCalled();
  });

  it("marks a sale with a time and stops watching by removing the row", async () => {
    const db = fakeDb();
    db.financeHolding.findFirst.mockResolvedValue({ id: "h1" });
    await markSold(asDb(db), "u1", "h1", now);
    expect(db.financeHolding.update.mock.calls[0][0]).toEqual({ where: { id: "h1" }, data: { soldAt: now } });
    await stopWatching(asDb(db), "u1", "h1");
    expect(db.financeHolding.delete.mock.calls[0][0]).toEqual({ where: { id: "h1" } });
  });
});

describe("what a holding cost them, information only (idea 27, layers 2 and 3)", () => {
  it("saves the price they typed, and clears any date-based price", async () => {
    const db = fakeDb();
    db.financeHolding.findFirst.mockResolvedValue({ id: "h1" });
    await setPaidPrice(asDb(db), "u1", "h1", 150.25);
    expect(db.financeHolding.update.mock.calls[0][0]).toEqual({ where: { id: "h1" }, data: { avgCost: 150.25, avgCostAsOf: null } });
    await setPaidPrice(asDb(db), "u1", "h1", null);
    expect(db.financeHolding.update.mock.calls[1][0]).toEqual({ where: { id: "h1" }, data: { avgCost: null, avgCostAsOf: null } });
  });

  it("never lets one person set what another paid", async () => {
    const db = fakeDb();
    db.financeHolding.findFirst.mockResolvedValue(null);
    await expect(setPaidPrice(asDb(db), "u2", "h1", 10)).rejects.toMatchObject({ code: "not_found" });
    expect(db.financeHolding.update).not.toHaveBeenCalled();
  });

  it("uses the close we recorded on a date they picked", async () => {
    const db = fakeDb();
    db.financeHolding.findFirst.mockResolvedValue({ id: "h1", tickerId: "t1" });
    db.financeSnapshot.findUnique.mockResolvedValue({ close: 41.2 });
    await setPaidFromDate(asDb(db), "u1", "h1", "2026-11-12", now);
    expect(db.financeSnapshot.findUnique.mock.calls[0][0].where).toEqual({ tickerId_date: { tickerId: "t1", date: "2026-11-12" } });
    expect(db.financeHolding.update.mock.calls[0][0]).toEqual({ where: { id: "h1" }, data: { avgCost: 41.2, avgCostAsOf: new Date("2026-11-12T12:00:00Z") } });
  });

  it("refuses a day we have no closing price for, a future date, or a holding that isn't theirs", async () => {
    const db = fakeDb();
    db.financeHolding.findFirst.mockResolvedValue({ id: "h1", tickerId: "t1" });
    db.financeSnapshot.findUnique.mockResolvedValue(null);
    await expect(setPaidFromDate(asDb(db), "u1", "h1", "2026-11-12", now)).rejects.toMatchObject({ code: "invalid" });
    await expect(setPaidFromDate(asDb(db), "u1", "h1", "2026-12-01", now)).rejects.toMatchObject({ code: "invalid" });
    await expect(setPaidFromDate(asDb(db), "u1", "h1", "not-a-date", now)).rejects.toMatchObject({ code: "invalid" });
    db.financeHolding.findFirst.mockResolvedValue(null);
    await expect(setPaidFromDate(asDb(db), "u2", "h1", "2026-11-12", now)).rejects.toMatchObject({ code: "not_found" });
    expect(db.financeHolding.update).not.toHaveBeenCalled();
  });
});

describe("finance clearance (idea 5)", () => {
  it("clears a person by lowercase email", async () => {
    const db = fakeDb();
    db.user.findUnique.mockResolvedValue({ id: "u1", financeClearedAt: null });
    expect(await grantFinanceClearance(asDb(db), " Ada@Example.com ", now)).toEqual({ userId: "u1" });
    expect(db.user.findUnique.mock.calls[0][0].where).toEqual({ email: "ada@example.com" });
    expect(db.user.update.mock.calls[0][0]).toEqual({ where: { id: "u1" }, data: { financeClearedAt: now } });
  });

  it("refuses a bad email, an unknown person, or someone already cleared", async () => {
    const db = fakeDb();
    await expect(grantFinanceClearance(asDb(db), "nope")).rejects.toBeInstanceOf(FinanceClearanceError);
    db.user.findUnique.mockResolvedValueOnce(null);
    await expect(grantFinanceClearance(asDb(db), "a@b.co")).rejects.toMatchObject({ code: "not_found" });
    db.user.findUnique.mockResolvedValueOnce({ id: "u1", financeClearedAt: now });
    await expect(grantFinanceClearance(asDb(db), "a@b.co")).rejects.toMatchObject({ code: "already_cleared" });
  });

  it("removes clearance", async () => {
    const db = fakeDb();
    await removeFinanceClearance(asDb(db), "u1");
    expect(db.user.updateMany.mock.calls[0][0]).toEqual({ where: { id: "u1" }, data: { financeClearedAt: null } });
  });
});
