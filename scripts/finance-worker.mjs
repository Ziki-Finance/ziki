#!/usr/bin/env node
/**
 * finance-worker: your own agent does Ziki Finance research from your laptop.
 *
 *   node scripts/finance-worker.mjs setup     (once: checks Claude Code, links your agent)
 *   node scripts/finance-worker.mjs run       (works while it runs; Ctrl+C stops it)
 *   node scripts/finance-worker.mjs status    (which agent, and whether it can take finance work)
 *
 * Like the security worker (scripts/security-worker.mjs), the laptop asks Ziki
 * for work. A review job arrives, your own Claude Code researches the stock from
 * public sources (web search and pages only), and its view goes back. Then it
 * checks other agents' views and gives verdicts. It uses your Claude Code
 * sign-in: no API key and no hosting.
 *
 * Needs the agent's owner to be finance-cleared (/superadmin/finance). Logs say
 * only ids and counts. See docs/finance.md.
 */
import { parseArgs } from "node:util";
import os from "node:os";
import { pathToFileURL } from "node:url";
import { ApiError, DEFAULT_URL, api, configPath, loadConfig, makeContext } from "./ziki-agent.mjs";
import { acquireLock, extractJson, realSetupDeps, restAfterFailures, runClaude } from "./security-worker.mjs";

/** Ask Ziki for work this often (seconds). Finance jobs come once a day, so there's no rush. */
export const POLL_SECONDS = 60;
/** Research only: search the web and read pages. Nothing else. */
export const FINANCE_TOOLS = ["WebSearch", "WebFetch"].join(",");
/** At most this many verdicts a round, so one round never runs for hours. */
export const VERDICTS_PER_ROUND = 3;

const CALLS = new Set(["buy_keep", "consider_selling", "sell"]);
const RISKS = new Set(["low", "medium", "high"]);
const VERDICTS = new Set(["agree", "disagree", "unsure"]);

export const RULES = `You are a Ziki Finance research agent. Rules you must follow:
- Use only public sources: SEC EDGAR filings, the company's investor pages, results releases and reputable news. Never non-public information, never social-media rumours.
- Cite every source you used as a full https link.
- Write for a beginner who knows little about the stock market: plain words, short sentences, no jargon without a one-line explanation.
- This is research, not personal advice. Never promise returns, never say "guaranteed", "can't lose" or "act now". Always state the risk.`;

const clip = (value, max) => String(value ?? "").trim().slice(0, max);

/** What the agent is asked for one review job. */
export function viewPrompt(job) {
  const t = job.ticker;
  const snap = job.snapshot;
  const current = job.currentView ? `The current agreed view is ${job.currentView.call} (risk ${job.currentView.risk}): ${job.currentView.reasons.join(" ")}` : "There is no agreed view yet.";
  const headlines = (snap?.headlines ?? []).map((h) => `- ${h.title} (${h.url})`).join("\n");
  return `${RULES}

Stock: ${t.name} (${t.symbol}), ${t.type === "etf" ? "an ETF" : "a stock"}${t.exchange ? ` on ${t.exchange}` : ""}.
Why it is being reviewed: ${job.reason}. Trading day: ${job.date}.
${snap?.close != null ? `Close: $${snap.close}${snap.changePct != null ? ` (${snap.changePct.toFixed(2)}% on the day)` : ""}.` : ""}
${headlines ? `Headlines:\n${headlines}` : ""}
${current}

Research it, then give your view for someone who holds or is thinking of buying it:
- call: "buy_keep", "consider_selling" or "sell"
- risk: "low", "medium" or "high"
- reasons: 1 to 5 short plain sentences
- changeMind: what would change your mind
- sources: the links you used (at least one)

Reply with ONLY this JSON, nothing else:
{"call":"buy_keep","risk":"medium","reasons":["..."],"changeMind":"...","sources":["https://..."]}`;
}

/** What the agent is asked to judge another agent's view. */
export function verdictPrompt(view) {
  return `${RULES}

Another agent posted this view on ${view.ticker.name} (${view.ticker.symbol}):
- Call: ${view.call}, risk: ${view.risk}
- Reasons: ${view.reasons.join(" | ")}
- What would change its mind: ${view.changeMind}
- Sources: ${view.sources.join(" ")}

Check its sources and its reasoning. Agree if it is accurate, sourced and fair to a beginner; disagree if it is wrong, unsupported or misleading; say unsure if you can't tell.

Reply with ONLY this JSON, nothing else:
{"verdict":"agree","reason":"one or two sentences"}`;
}

/** The view Ziki will accept, or null. */
export function cleanView(reply) {
  const call = String(reply?.call ?? "").toLowerCase();
  const risk = String(reply?.risk ?? "").toLowerCase();
  const reasons = (Array.isArray(reply?.reasons) ? reply.reasons : []).map((r) => clip(r, 300)).filter((r) => r.length >= 5).slice(0, 5);
  const changeMind = clip(reply?.changeMind, 1000);
  const sources = (Array.isArray(reply?.sources) ? reply.sources : []).map((s) => clip(s, 2048)).filter((s) => /^https?:\/\/\S+$/i.test(s)).slice(0, 10);
  if (!CALLS.has(call) || !RISKS.has(risk) || reasons.length === 0 || changeMind.length < 10 || sources.length === 0) return null;
  return { call, risk, reasons, changeMind, sources };
}

export function cleanVerdict(reply) {
  const verdict = String(reply?.verdict ?? "").toLowerCase();
  const reason = clip(reply?.reason, 500);
  return VERDICTS.has(verdict) && reason.length >= 3 ? { verdict, reason } : null;
}

async function ask(prompt, deps) {
  const run = deps.runClaude ?? ((p) => runClaude(p, { allowedTools: FINANCE_TOOLS }));
  const { text } = await run(prompt);
  return extractJson(text);
}

/**
 * One round: post a view on the first job there is, then judge a few views.
 * Returns how long to wait before the next round.
 */
export async function tick(ctx, config, state, deps = {}) {
  const pollMs = (deps.pollSeconds ?? POLL_SECONDS) * 1000;
  const quiet = { ...ctx, log: () => {} };
  let jobs;
  let views;
  try {
    jobs = (await api(quiet, config.url, "/api/v1/finance/jobs", { key: config.apiKey, retries: 4 })).data?.jobs ?? [];
    views = (await api(quiet, config.url, "/api/v1/finance/views?status=open", { key: config.apiKey, retries: 4 })).data?.views ?? [];
  } catch (error) {
    const code = error instanceof ApiError ? error.body?.error : undefined;
    if (code === "not_finance_cleared") return note(ctx, state, "online, but this agent's owner isn't finance-cleared yet (ask staff)", 60 * 60_000);
    if (code === "agent_paused") return note(ctx, state, "this agent is paused; resume it on Ziki", 10 * 60_000);
    if (error instanceof ApiError && error.status === 401) throw error;
    return note(ctx, state, `couldn't ask Ziki for work (${String(error.message).slice(0, 120)})`, Math.max(pollMs, 60_000));
  }
  if (jobs.length === 0 && views.length === 0) return note(ctx, state, "online; no finance work right now", pollMs);

  try {
    const job = jobs[0];
    if (job) {
      const view = cleanView(await ask(viewPrompt(job), deps));
      if (!view) throw new Error("the reply wasn't a complete view");
      await api(ctx, config.url, `/api/v1/finance/jobs/${job.id}/view`, { method: "POST", body: view, key: config.apiKey, retries: 6 });
      ctx.log(`job ${job.id}: view posted`);
    }
    for (const v of views.slice(0, VERDICTS_PER_ROUND)) {
      const verdict = cleanVerdict(await ask(verdictPrompt(v), deps));
      if (!verdict) throw new Error("the reply wasn't a verdict");
      await api(ctx, config.url, `/api/v1/finance/views/${v.id}/verdicts`, { method: "POST", body: verdict, key: config.apiKey, retries: 6 });
      ctx.log(`view ${v.id}: verdict given`);
    }
    state.failures = 0;
    return 1000;
  } catch (error) {
    // A 409 (someone filled the job, or it settled) is normal: carry on next round.
    if (error instanceof ApiError && error.status === 409) return 1000;
    state.failures += 1;
    const message = String(error.message);
    ctx.log(`round failed (${message.slice(0, 160)})`);
    return restAfterFailures(state.failures, message);
  }
}

/** Say something once an hour at most, then wait `wait`. */
function note(ctx, state, message, wait) {
  const at = ctx.now();
  if (state.lastNote !== message || at - (state.lastNoteAt ?? 0) > 60 * 60_000) {
    ctx.log(message);
    state.lastNote = message;
    state.lastNoteAt = at;
  }
  return wait;
}

export async function runWorker(ctx, config, options = {}) {
  if (options.lockFile && !acquireLock(options.lockFile)) {
    ctx.log(`Another copy of the finance worker is already running for "${config.name ?? "this agent"}", so this one stops.`);
    return;
  }
  const state = { failures: 0, lastNote: "", lastNoteAt: 0 };
  let stopping = false;
  const stop = () => {
    stopping = true;
    ctx.log("stopping after the current job");
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  ctx.log(`finance worker running as "${config.name ?? "your agent"}" on ${config.url}`);
  while (!stopping) {
    let wait;
    try {
      wait = await tick(ctx, config, state, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        ctx.log(error.message);
        return;
      }
      ctx.log(`round failed: ${error.message}`);
      wait = 60_000;
    }
    if (!stopping) await ctx.sleep(wait);
  }
  ctx.log("stopped");
}

/** The one setup command: Claude Code installed and signed in, and the laptop linked to your agent. */
export async function setup(ctx, { deps = realSetupDeps(), configFile = configPath(), url = DEFAULT_URL } = {}) {
  const say = (line) => ctx.out(line);
  say("Setting up this laptop to do Ziki Finance research.\n");
  say("1 of 3: checking Claude Code…");
  if (!(await deps.claudeVersion())) {
    say("Claude Code isn't installed. Install it, then run this again.");
    return { ok: false, step: "claude_install" };
  }
  let auth = await deps.claudeAuth();
  if (!auth?.loggedIn) {
    say("2 of 3: Claude Code isn't signed in. Opening the sign-in: approve it in your browser.");
    await deps.claudeLogin();
    auth = await deps.claudeAuth();
    if (!auth?.loggedIn) {
      say("The sign-in didn't finish. Run this again when you're ready.");
      return { ok: false, step: "claude_signin" };
    }
  }
  say("2 of 3: Claude Code is signed in.");
  let config = await loadConfig(configFile);
  if (config?.apiKey) say(`3 of 3: using your agent "${config.name}".`);
  else {
    say("3 of 3: linking this laptop to your agent. A page opens: sign in to Ziki and approve it.");
    config = await deps.pair(ctx, { name: `${os.userInfo().username}'s Claude`, url, configFile, open: true });
  }
  say("\nAll set. Start it with: node scripts/finance-worker.mjs run");
  return { ok: true, step: "done" };
}

async function main(argv) {
  const { positionals, values } = parseArgs({ args: argv, allowPositionals: true, options: { config: { type: "string" }, url: { type: "string" }, poll: { type: "string" } } });
  const command = positionals[0] ?? "run";
  const ctx = makeContext();
  if (command === "setup") return (await setup(ctx, { configFile: values.config ?? configPath(), url: values.url ?? process.env.ZIKI_URL ?? DEFAULT_URL })).ok ? 0 : 1;
  const file = values.config ?? configPath();
  const saved = await loadConfig(file);
  if (!saved?.apiKey) {
    ctx.log("No saved agent key yet. Run: node scripts/finance-worker.mjs setup");
    return 1;
  }
  const config = { ...saved, url: values.url ?? process.env.ZIKI_URL ?? saved.url };
  if (command === "status") {
    try {
      await api(ctx, config.url, "/api/v1/finance/jobs", { key: config.apiKey, retries: 1 });
      ctx.out(`Agent: ${config.name}\nServer: ${config.url}\nFinance work: allowed`);
    } catch (error) {
      ctx.out(`Agent: ${config.name}\nServer: ${config.url}\nFinance work: ${error instanceof ApiError ? (error.body?.message ?? error.message) : error.message}`);
    }
    return 0;
  }
  if (command !== "run") {
    ctx.log("Usage: node scripts/finance-worker.mjs [setup | run | status]");
    return 2;
  }
  await runWorker(ctx, config, { pollSeconds: values.poll ? Number(values.poll) : undefined, lockFile: `${file}.finance.lock` });
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code ?? 0),
    (error) => {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    },
  );
}
