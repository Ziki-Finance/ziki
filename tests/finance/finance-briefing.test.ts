import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
vi.mock("@/lib/mail", () => ({ canSendMail: () => true, sendMail: (...args: unknown[]) => sendMail(...args) }));
vi.mock("@/lib/cache-tags", () => ({ expireUnreadCounts: vi.fn() }));
vi.mock("@/lib/site-url", () => ({ absoluteUrl: (p: string) => `https://ziki.test${p}` }));

import { briefingText, composeBriefing, dateWords, isBriefingTime, sweepBriefings, type BriefingHolding } from "@/lib/finance/briefing";
import type { CurrentView } from "@/lib/finance/research";

const view = (call: CurrentView["call"], reason: string, agree = 4, total = 5): CurrentView => ({
  call,
  risk: call === "buy_keep" ? "low" : "high",
  reasons: [reason],
  changeMind: "x",
  sources: ["https://x"],
  agreedAt: new Date(),
  agentsAgree: agree,
  agentsTotal: total,
  divided: false,
  notReviewedToday: false,
});
const profile = { riskComfort: "balanced" as const, horizon: "gt5" as const };
const holdings: BriefingHolding[] = [
  { tickerId: "t1", symbol: "ACME", name: "Acme Corp", owned: true },
  { tickerId: "t2", symbol: "CTSO", name: "Contoso", owned: true },
  { tickerId: "t3", symbol: "NWND", name: "Northwind", owned: false },
  { tickerId: "t4", symbol: "NEWW", name: "Newco", owned: true },
];
const views = new Map([
  ["t1", view("consider_selling", "Sales fell for the second quarter.")],
  ["t2", view("buy_keep", "Earns steadily.")],
  ["t3", view("buy_keep", "Growing with low debt.")],
]);

describe("composing the briefing (idea 10)", () => {
  it("leads with what needs a look, then keeps, watches and stocks still being reviewed", () => {
    const { content, headline, needsLook, hasViews } = composeBriefing("2026-11-17", holdings, views, null, profile);
    expect(content.dateWords).toBe("Tue 17 Nov");
    expect(content.needsLook.map((l) => l.symbol)).toEqual(["ACME"]);
    expect(content.allGood.map((l) => l.symbol)).toEqual(["CTSO"]);
    expect(content.watching.map((l) => l.symbol)).toEqual(["NWND"]);
    expect(content.waiting).toEqual([{ symbol: "NEWW", name: "Newco" }]);
    expect(headline).toBe("1 stock needs a look");
    expect(needsLook).toBe(true);
    expect(hasViews).toBe(true);
  });

  it("says so plainly when nothing needs attention", () => {
    const calm = new Map([["t2", view("buy_keep", "Earns steadily.")]]);
    const { headline, content } = composeBriefing("2026-11-17", holdings.slice(1, 2), calm, null, profile);
    expect(headline).toBe("Nothing needs your attention today");
    expect(briefingText(content)).toContain("Nothing needs your attention today.");
  });

  it("only uses agreed views: with none, there is nothing to send", () => {
    const { hasViews, headline } = composeBriefing("2026-11-17", holdings, new Map(), null, profile);
    expect(hasViews).toBe(false);
    expect(headline).toBe("Agents are still reviewing your stocks");
  });

  it("writes the email in plain words with the agreement, the risk, one idea and the notice", () => {
    const idea = { symbol: "FBK", name: "Fabrikam", risk: "medium" as const, reason: "Growing steadily, with low debt.", agentsAgree: 5, agentsTotal: 6, agreedAt: new Date() };
    const { content } = composeBriefing("2026-11-17", holdings, views, idea, profile);
    const text = briefingText(content);
    expect(text).toContain("Good morning. Here's your portfolio for Tue 17 Nov.");
    expect(text).toContain("Consider selling Acme Corp (ACME): Sales fell for the second quarter. 4 of 5 agents agree. Risk: High.");
    expect(text).toContain("Keep Contoso (CTSO)");
    expect(text).toContain("Fabrikam (FBK): Growing steadily, with low debt. Risk: Medium. Fits a Balanced, 5+ years profile.");
    expect(text).toContain("https://ziki.test/finance");
    expect(text).toMatch(/not financial advice/);
    expect(text).not.toMatch(/guarantee|act now|can't lose/i);
    expect(dateWords("2026-11-20")).toBe("Fri 20 Nov");
  });
});

describe("delivery at 07:00 local, Monday to Friday (idea 11)", () => {
  it("is due from 07:00 to 09:59 on a weekday that isn't a US market holiday", () => {
    expect(isBriefingTime(new Date("2026-11-17T06:30:00Z"), "Africa/Lagos")).toEqual({ due: true, date: "2026-11-17" }); // Tue 07:30 in Lagos
    expect(isBriefingTime(new Date("2026-11-17T12:05:00Z"), "America/New_York").due).toBe(true); // 07:05 ET
    expect(isBriefingTime(new Date("2026-11-17T08:30:00Z"), "Africa/Lagos").due).toBe(true); // 09:30, still in the window (idea 24)
    expect(isBriefingTime(new Date("2026-11-17T05:30:00Z"), "Africa/Lagos").due).toBe(false); // 06:30, too early
    expect(isBriefingTime(new Date("2026-11-17T09:00:00Z"), "Africa/Lagos").due).toBe(false); // 10:00, the day is skipped
    expect(isBriefingTime(new Date("2026-11-21T06:30:00Z"), "Africa/Lagos").due).toBe(false); // Saturday
    expect(isBriefingTime(new Date("2026-11-26T06:30:00Z"), "Africa/Lagos").due).toBe(false); // Thanksgiving
  });

  function fakeDb() {
    return {
      financeProfile: { findMany: vi.fn() },
      financeHolding: { findMany: vi.fn().mockResolvedValue([{ shares: 3, ticker: { id: "t2", symbol: "CTSO", name: "Contoso" } }]) },
      financeAgreedView: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      financeJob: { findMany: vi.fn().mockResolvedValue([]) },
      financeBriefing: { createMany: vi.fn().mockResolvedValue({ count: 1 }), updateMany: vi.fn() },
      notification: { create: vi.fn() },
    };
  }
  beforeEach(() => sendMail.mockReset());

  it("writes one briefing per person per day, then sends it to the Inbox and by email", async () => {
    const db = fakeDb();
    db.financeProfile.findMany
      .mockResolvedValueOnce([{ timezone: "Africa/Lagos" }, { timezone: "Asia/Tokyo" }])
      .mockResolvedValueOnce([{ userId: "u1", riskComfort: "balanced", horizon: "gt5", timezone: "Africa/Lagos", briefingEmail: true, user: { email: "ada@example.com" } }]);
    db.financeAgreedView.findMany.mockImplementation(async (args: { distinct?: string[]; where?: { tickerId?: unknown } }) =>
      args.where?.tickerId
        ? [{ tickerId: "t2", agreedAt: new Date(), agentsAgree: 4, agentsTotal: 4, divided: false, view: { call: "buy_keep", risk: "low", reasons: ["Earns steadily."], changeMind: "x", sources: ["https://x"] } }]
        : [],
    );
    const result = await sweepBriefings(db as never, new Date("2026-11-17T06:30:00Z"));
    expect(result).toEqual({ made: 1, inbox: 1, emails: 1 });
    // Tokyo is at 15:30: only Lagos is asked for people.
    expect(db.financeProfile.findMany).toHaveBeenCalledTimes(2);
    expect(db.financeProfile.findMany.mock.calls[1][0].where).toMatchObject({ timezone: "Africa/Lagos", user: { financeBriefings: { none: { date: "2026-11-17" } } } });
    expect(db.financeBriefing.createMany.mock.calls[0][0]).toMatchObject({ data: [{ userId: "u1", date: "2026-11-17", headline: "Nothing needs your attention today" }], skipDuplicates: true });
    expect(db.notification.create.mock.calls[0][0].data).toMatchObject({ userId: "u1", kind: "finance_briefing", url: "/finance" });
    expect(sendMail.mock.calls[0][0]).toMatchObject({ to: "ada@example.com", subject: "Your Ziki Finance briefing: Nothing needs your attention today" });
  });

  it("keeps an empty briefing but sends nothing, and skips email when it's off", async () => {
    const db = fakeDb();
    db.financeProfile.findMany
      .mockResolvedValueOnce([{ timezone: "Africa/Lagos" }])
      .mockResolvedValueOnce([{ userId: "u1", riskComfort: "balanced", horizon: "gt5", timezone: "Africa/Lagos", briefingEmail: false, user: { email: "ada@example.com" } }]);
    const result = await sweepBriefings(db as never, new Date("2026-11-17T06:30:00Z"));
    expect(result).toEqual({ made: 1, inbox: 0, emails: 0 });
    expect(db.notification.create).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("does nothing when the day's briefing already exists", async () => {
    const db = fakeDb();
    db.financeProfile.findMany.mockResolvedValueOnce([{ timezone: "Africa/Lagos" }]).mockResolvedValueOnce([{ userId: "u1", riskComfort: "balanced", horizon: "gt5", timezone: "Africa/Lagos", briefingEmail: true, user: { email: "a@b.co" } }]);
    db.financeBriefing.createMany.mockResolvedValue({ count: 0 });
    expect(await sweepBriefings(db as never, new Date("2026-11-17T06:30:00Z"))).toEqual({ made: 0, inbox: 0, emails: 0 });
    expect(db.notification.create).not.toHaveBeenCalled();
  });
});
