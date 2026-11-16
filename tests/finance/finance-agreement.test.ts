import { describe, expect, it } from "vitest";
import { neededFor, reachesAgreement, settleViews, tally, verdictWeight, type TallyVerdict } from "@/lib/finance/agreement";

const v = (ownerId: string, verdict: TallyVerdict["verdict"], weight = 1): TallyVerdict => ({ ownerId, verdict, weight });
const at = (s: number) => new Date(1_800_000_000_000 + s * 1000);

describe("agreement (PRD §7.3)", () => {
  it("weights a manager's verdict 3 and a working agent's 1", () => {
    expect(verdictWeight("manager")).toBe(3);
    expect(verdictWeight("working")).toBe(1);
  });

  it("counts one verdict per owner, the heaviest", () => {
    const t = tally([v("a", "agree"), v("a", "agree"), v("b", "agree", 3), v("b", "disagree", 1)]);
    expect(t).toEqual({ agree: 4, disagree: 0, unsure: 0, agentsAgree: 3, agentsTotal: 3 });
  });

  it("needs 3 agrees, outweighing disagree and unsure together", () => {
    expect(reachesAgreement(tally([v("a", "agree"), v("b", "agree"), v("c", "agree")]), 3)).toBe(true);
    expect(reachesAgreement(tally([v("a", "agree"), v("b", "agree")]), 3)).toBe(false);
    const split = tally([v("a", "agree"), v("b", "agree"), v("c", "agree"), v("d", "disagree"), v("e", "disagree"), v("f", "unsure")]);
    expect(reachesAgreement(split, 3)).toBe(false);
  });

  it("asks 4 for a change to Sell, 3 to stay at Sell", () => {
    expect(neededFor("sell", "buy_keep")).toBe(4);
    expect(neededFor("sell", null)).toBe(4);
    expect(neededFor("sell", "sell")).toBe(3);
    expect(neededFor("consider_selling", "buy_keep")).toBe(3);
  });

  it("picks the heaviest agreed view and says when agents are divided", () => {
    const three = [v("a", "agree"), v("b", "agree"), v("c", "agree")];
    const four = [...three, v("d", "agree")];
    const keep = { id: "keep", call: "buy_keep" as const, createdAt: at(1), verdicts: three };
    const sell = { id: "sell", call: "consider_selling" as const, createdAt: at(2), verdicts: four };
    expect(settleViews([keep, sell], "buy_keep")).toMatchObject({ agreed: true, viewId: "sell", divided: true });
    expect(settleViews([keep], "buy_keep")).toMatchObject({ agreed: true, viewId: "keep", divided: false, tally: { agentsAgree: 4, agentsTotal: 4 } });
    expect(settleViews([{ ...keep, verdicts: [v("a", "agree")] }], null)).toEqual({ agreed: false });
  });

  it("breaks a tie by the earlier view", () => {
    const three = [v("a", "agree"), v("b", "agree"), v("c", "agree")];
    const first = { id: "first", call: "buy_keep" as const, createdAt: at(1), verdicts: three };
    const second = { id: "second", call: "buy_keep" as const, createdAt: at(2), verdicts: three };
    expect(settleViews([second, first], null)).toMatchObject({ viewId: "first", divided: false });
  });
});
