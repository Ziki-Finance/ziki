import { describe, expect, it, vi } from "vitest";
import { changeSince, dayChange, daysBefore, lastClose, latestChanges, portfolioChange, recentBars, sparklinePoints, SPARKLINE_DAYS } from "@/lib/finance/prices";

/** A fake Prisma client: only financeSnapshot is used here. */
function fakeDb() {
  return { financeSnapshot: { findMany: vi.fn().mockResolvedValue([]) } };
}
const asDb = (db: ReturnType<typeof fakeDb>) => db as never;

describe("reading prices already recorded (FIN-CR-006, PR B)", () => {
  it("steps back by whole calendar days", () => {
    expect(daysBefore("2026-11-16", 30)).toBe("2026-10-17");
    expect(daysBefore("2026-01-01", 1)).toBe("2025-12-31");
  });

  it("asks for 30 days of closes by default, oldest first, skipping tickers with none", async () => {
    const db = fakeDb();
    db.financeSnapshot.findMany.mockResolvedValue([
      { tickerId: "t1", date: "2026-11-01", close: 100 },
      { tickerId: "t1", date: "2026-11-02", close: 105 },
      { tickerId: "t2", date: "2026-11-02", close: 50 },
    ]);
    const bars = await recentBars(asDb(db), ["t1", "t2", "t3"], undefined, new Date("2026-11-16T12:00:00Z"));
    expect(db.financeSnapshot.findMany.mock.calls[0][0]).toMatchObject({
      where: { tickerId: { in: ["t1", "t2", "t3"] }, date: { gte: "2026-10-17" }, close: { not: null } },
      orderBy: { date: "asc" },
    });
    expect(bars.get("t1")).toEqual([
      { date: "2026-11-01", close: 100 },
      { date: "2026-11-02", close: 105 },
    ]);
    expect(bars.get("t2")).toEqual([{ date: "2026-11-02", close: 50 }]);
    expect(bars.has("t3")).toBe(false);
    expect(SPARKLINE_DAYS).toBe(30);
  });

  it("does nothing for an empty list of tickers", async () => {
    const db = fakeDb();
    expect(await recentBars(asDb(db), [])).toEqual(new Map());
    expect(db.financeSnapshot.findMany).not.toHaveBeenCalled();
  });

  it("reads each ticker's latest recorded change in one query", async () => {
    const db = fakeDb();
    db.financeSnapshot.findMany.mockResolvedValue([
      { tickerId: "t1", changePct: 1.2 },
      { tickerId: "t2", changePct: null },
    ]);
    const changes = await latestChanges(asDb(db), ["t1", "t2"]);
    expect(db.financeSnapshot.findMany.mock.calls[0][0]).toMatchObject({ where: { tickerId: { in: ["t1", "t2"] } }, orderBy: { date: "desc" }, distinct: ["tickerId"] });
    expect(changes.get("t1")).toBe(1.2);
    expect(changes.get("t2")).toBeNull();
    expect(await latestChanges(asDb(db), [])).toEqual(new Map());
  });

  it("works out the change from one price to another", () => {
    expect(changeSince(105, 100)).toBe(5);
    expect(changeSince(95, 100)).toBe(-5);
    expect(changeSince(null, 100)).toBeNull();
    expect(changeSince(100, null)).toBeNull();
    expect(changeSince(100, 0)).toBeNull();
    expect(changeSince(100.126, 100)).toBe(0.13);
  });

  it("takes the day's change from the last two closes, or leaves it out with fewer than two", () => {
    expect(dayChange([{ date: "a", close: 100 }, { date: "b", close: 102 }])).toBe(2);
    expect(dayChange([{ date: "a", close: 100 }])).toBeNull();
    expect(dayChange([])).toBeNull();
  });

  it("returns the last recorded close, or null without one", () => {
    const bars = new Map([["t1", [{ date: "a", close: 100 }, { date: "b", close: 103 }]]]);
    expect(lastClose(bars, "t1")).toBe(103);
    expect(lastClose(bars, "t2")).toBeNull();
  });

  it("weights the portfolio's change by shares, not a plain average, and skips watch-only and priceless stocks", () => {
    const bars = new Map([
      ["t1", [{ date: "a", close: 100 }, { date: "b", close: 110 }]], // +10%, 10 shares
      ["t2", [{ date: "a", close: 50 }, { date: "b", close: 45 }]], // -10%, 2 shares
      ["t3", [{ date: "a", close: 20 }]], // only one close: left out
    ]);
    const holdings = [
      { tickerId: "t1", shares: 10 },
      { tickerId: "t2", shares: 2 },
      { tickerId: "t3", shares: 5 },
      { tickerId: "t4", shares: null }, // watch only: left out
    ];
    // now: 10*110 + 2*45 = 1190; then: 10*100 + 2*50 = 1100; (1190-1100)/1100 = 8.18%
    expect(portfolioChange(holdings, bars)).toBe(8.18);
  });

  it("has nothing to weigh when no held stock has two closes", () => {
    expect(portfolioChange([{ tickerId: "t1", shares: 10 }], new Map())).toBeNull();
    expect(portfolioChange([{ tickerId: "t1", shares: null }], new Map([["t1", [{ date: "a", close: 1 }, { date: "b", close: 2 }]]]))).toBeNull();
  });

  it("draws nothing with fewer than two values, and a flat line down the middle", () => {
    expect(sparklinePoints([])).toBe("");
    expect(sparklinePoints([5])).toBe("");
    expect(sparklinePoints([3, 3, 3], 90, 20)).toBe("0,10 45,10 90,10");
  });

  it("draws a rising and a falling line within the box", () => {
    const points = sparklinePoints([10, 20, 15], 100, 30).split(" ");
    expect(points[0]).toBe("0,30"); // the lowest value sits at the bottom
    expect(points[1]).toBe("50,0"); // the highest value sits at the top
  });
});
