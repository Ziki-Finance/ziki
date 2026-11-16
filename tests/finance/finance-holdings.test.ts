import { describe, expect, it, vi } from "vitest";
import { FinanceError, addHolding, ensureTicker, listHoldings, markSold, saveProfile, stopWatching, updateShares } from "@/lib/finance/holdings";
import { FinanceClearanceError, grantFinanceClearance, removeFinanceClearance } from "@/lib/finance/clearance";

/** A fake Prisma client: every model method used here is a mock. */
function fakeDb() {
  return {
    financeProfile: { findUnique: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    financeTicker: { findUnique: vi.fn(), upsert: vi.fn() },
    financeHolding: { upsert: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
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

  it("creates the shared ticker from the directory, then upserts the person's holding (no duplicates)", async () => {
    const db = fakeDb();
    db.financeProfile.findUnique.mockResolvedValue({ noticeAcceptedAt: now });
    db.financeTicker.findUnique.mockResolvedValue(null);
    db.financeTicker.upsert.mockResolvedValue({ id: "t1", symbol: "AAPL" });
    await addHolding(asDb(db), "u1", { symbol: "aapl", shares: 10, avgCost: 150 });
    expect(db.financeTicker.upsert.mock.calls[0][0].create).toEqual({ symbol: "AAPL", name: "Apple", exchange: "NASDAQ", type: "stock" });
    const call = db.financeHolding.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ userId_tickerId: { userId: "u1", tickerId: "t1" } });
    expect(call.create).toEqual({ userId: "u1", tickerId: "t1", shares: 10, avgCost: 150 });
    expect(call.update).toEqual({ shares: 10, avgCost: 150, soldAt: null });
  });

  it("watch only clears shares and price; adding again without a price keeps the old one", async () => {
    const db = fakeDb();
    db.financeProfile.findUnique.mockResolvedValue({ noticeAcceptedAt: now });
    db.financeTicker.findUnique.mockResolvedValue({ id: "t1", symbol: "VOO" });
    await addHolding(asDb(db), "u1", { symbol: "VOO", shares: null, avgCost: 400 });
    expect(db.financeHolding.upsert.mock.calls[0][0].update).toEqual({ shares: null, avgCost: null, soldAt: null });
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
