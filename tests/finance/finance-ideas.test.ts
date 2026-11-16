import { describe, expect, it, vi } from "vitest";
import { allowedRisks, ideasFor } from "@/lib/finance/ideas";

const row = (symbol: string, call: string, risk: string, agree: number, total: number, day = 1) => ({
  agreedAt: new Date(`2026-11-${String(day).padStart(2, "0")}T10:00:00Z`),
  agentsAgree: agree,
  agentsTotal: total,
  ticker: { symbol, name: `${symbol} Inc` },
  view: { call, risk, reasons: [`${symbol} reason`] },
});

describe("ideas for you (idea 12, FIN-D-019)", () => {
  it("allows only risk levels both answers accept", () => {
    expect(allowedRisks({ riskComfort: "careful", horizon: "gt5" })).toEqual(["low"]);
    expect(allowedRisks({ riskComfort: "balanced", horizon: "gt5" })).toEqual(["low", "medium"]);
    expect(allowedRisks({ riskComfort: "adventurous", horizon: "lt1" })).toEqual(["low"]);
    expect(allowedRisks({ riskComfort: "adventurous", horizon: "gt5" })).toEqual(["low", "medium", "high"]);
  });

  it("keeps agreed Keep/Buy views that fit, most agreement first, and skips the person's own stocks", async () => {
    const findMany = vi.fn().mockResolvedValue([
      row("HIGH", "buy_keep", "high", 5, 5),
      row("SELL", "consider_selling", "low", 5, 5),
      row("OKAY", "buy_keep", "medium", 3, 4),
      row("BEST", "buy_keep", "low", 5, 5),
      row("MORE", "buy_keep", "low", 4, 6),
    ]);
    const ideas = await ideasFor({ financeAgreedView: { findMany } } as never, { userId: "u1", riskComfort: "balanced", horizon: "gt5" });
    expect(ideas.map((i) => i.symbol)).toEqual(["BEST", "OKAY", "MORE"]);
    expect(ideas[0]).toMatchObject({ reason: "BEST reason", agentsAgree: 5, agentsTotal: 5 });
    expect(findMany.mock.calls[0][0].where).toEqual({ ticker: { holdings: { none: { userId: "u1" } } } });
  });
});
