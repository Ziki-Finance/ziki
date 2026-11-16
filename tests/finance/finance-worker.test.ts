import { describe, expect, it, vi } from "vitest";
import { FINANCE_TOOLS, cleanVerdict, cleanView, tick, verdictPrompt, viewPrompt } from "../../scripts/finance-worker.mjs";

/** A fake context: a canned fetch and a log to read. */
function fakeCtx(replies: Array<{ status: number; body: unknown }>) {
  const calls: { url: string; method: string; body: unknown }[] = [];
  const logs: string[] = [];
  let at = 1_000_000;
  const queue = [...replies];
  const ctx = {
    fetch: vi.fn(async (url: URL, init: RequestInit) => {
      calls.push({ url: url.pathname, method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : undefined });
      const next = queue.shift() ?? { status: 200, body: {} };
      return new Response(JSON.stringify(next.body), { status: next.status, headers: { "Content-Type": "application/json" } });
    }),
    sleep: vi.fn(async () => {}),
    now: () => (at += 1000),
    log: (line: string) => logs.push(line),
  };
  return { ctx: ctx as never, calls, logs };
}
const config = { url: "https://ziki.test", apiKey: "zk_test", name: "Ada's Claude" };
const job = { id: "j1", date: "2026-11-16", reason: "first", ticker: { symbol: "ACME", name: "Acme Corp", type: "stock", exchange: "NYSE" }, snapshot: null, currentView: null };
const view = { id: "v1", call: "consider_selling", risk: "high", reasons: ["Sales fell"], changeMind: "Sales grow again", sources: ["https://www.sec.gov/x"], ticker: { symbol: "ACME", name: "Acme Corp" } };
const goodView = { call: "buy_keep", risk: "medium", reasons: ["Earns steadily and has little debt"], changeMind: "Two weak quarters in a row", sources: ["https://www.sec.gov/acme-10q"] };

describe("the finance worker (idea 9)", () => {
  it("only searches and reads the web", () => {
    expect(FINANCE_TOOLS).toBe("WebSearch,WebFetch");
  });

  it("asks for public sources and beginner words, with no promises", () => {
    const prompt = viewPrompt(job);
    expect(prompt).toContain("Acme Corp (ACME)");
    expect(prompt).toMatch(/public sources/);
    expect(prompt).toMatch(/Never promise returns/);
    expect(verdictPrompt(view)).toContain("https://www.sec.gov/x");
  });

  it("drops a view Ziki would refuse", () => {
    expect(cleanView(goodView)).toEqual(goodView);
    expect(cleanView({ ...goodView, sources: [] })).toBeNull();
    expect(cleanView({ ...goodView, sources: ["not a link"] })).toBeNull();
    expect(cleanView({ ...goodView, changeMind: "" })).toBeNull();
    expect(cleanView({ ...goodView, call: "hold" })).toBeNull();
    expect(cleanVerdict({ verdict: "Agree", reason: "Matches the filing" })).toEqual({ verdict: "agree", reason: "Matches the filing" });
    expect(cleanVerdict({ verdict: "agree" })).toBeNull();
  });

  it("posts a view on the first job, then judges views", async () => {
    const { ctx, calls } = fakeCtx([
      { status: 200, body: { jobs: [job] } },
      { status: 200, body: { views: [view] } },
      { status: 201, body: {} },
      { status: 201, body: {} },
    ]);
    const runClaude = vi
      .fn()
      .mockResolvedValueOnce({ text: JSON.stringify(goodView) })
      .mockResolvedValueOnce({ text: `Here you go: {"verdict":"agree","reason":"The filing says so"}` });
    const state = { failures: 0, lastNote: "", lastNoteAt: 0 };
    expect(await tick(ctx, config, state, { runClaude })).toBe(1000);
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "GET /api/v1/finance/jobs",
      "GET /api/v1/finance/views",
      "POST /api/v1/finance/jobs/j1/view",
      "POST /api/v1/finance/views/v1/verdicts",
    ]);
    expect(calls[2]!.body).toEqual(goodView);
    expect(calls[3]!.body).toEqual({ verdict: "agree", reason: "The filing says so" });
  });

  it("waits an hour, saying so once, while the owner isn't cleared", async () => {
    const { ctx, logs } = fakeCtx([{ status: 403, body: { error: "not_finance_cleared", message: "no" } }]);
    const state = { failures: 0, lastNote: "", lastNoteAt: 0 };
    expect(await tick(ctx, config, state, { runClaude: vi.fn() })).toBe(60 * 60_000);
    expect(logs.join("\n")).toMatch(/isn't finance-cleared/);
  });

  it("rests when its coding agent can't work, instead of retrying at once", async () => {
    const { ctx } = fakeCtx([
      { status: 200, body: { jobs: [job] } },
      { status: 200, body: { views: [] } },
    ]);
    const state = { failures: 0, lastNote: "", lastNoteAt: 0 };
    const wait = await tick(ctx, config, state, { runClaude: vi.fn().mockRejectedValue(new Error("usage limit reached")) });
    expect(wait).toBe(30 * 60_000);
    expect(state.failures).toBe(1);
  });
});
