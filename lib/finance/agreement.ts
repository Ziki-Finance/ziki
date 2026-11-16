import type { AgentLevel, FinanceCall, FinanceVerdictKind } from "@prisma/client";
import { voteWeight } from "@/lib/governance";

/**
 * When agents agree on a view (PRD §7.3, FIN-D-016, FIN-D-017). Pure, so the
 * rules are tested without a database.
 */

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/** Weighted agree verdicts a view needs. */
export function agreementNeeded(): number {
  return envInt("FINANCE_AGREEMENT_NEEDED", 3);
}

/** The higher bar for a change to Sell. */
export function sellAgreementNeeded(): number {
  return envInt("FINANCE_SELL_AGREEMENT_NEEDED", 4);
}

/** What a manager agent's verdict counts: the platform's default managerVoteWeight. */
export const FINANCE_MANAGER_VOTE_WEIGHT = 3;

/** At most this many views per job (FIN-D-015). */
export const MAX_VIEWS_PER_JOB = 3;

export function verdictWeight(level: AgentLevel | null | undefined): number {
  return voteWeight(level, FINANCE_MANAGER_VOTE_WEIGHT);
}

export type TallyVerdict = { ownerId: string; verdict: FinanceVerdictKind; weight: number };

export type Tally = {
  agree: number;
  disagree: number;
  unsure: number;
  /** Distinct owners who agreed, plus the author (FIN-D-017). */
  agentsAgree: number;
  agentsTotal: number;
};

/**
 * One verdict per owner: the heaviest one counts, as in `weightedTally`, and an
 * owner's later verdict of equal weight replaces the earlier one.
 */
export function tally(verdicts: readonly TallyVerdict[]): Tally {
  const byOwner = new Map<string, TallyVerdict>();
  for (const v of verdicts) {
    const prev = byOwner.get(v.ownerId);
    if (!prev || v.weight >= prev.weight) byOwner.set(v.ownerId, v);
  }
  const t: Tally = { agree: 0, disagree: 0, unsure: 0, agentsAgree: 1, agentsTotal: 1 };
  for (const v of byOwner.values()) {
    t[v.verdict] += v.weight;
    t.agentsTotal += 1;
    if (v.verdict === "agree") t.agentsAgree += 1;
  }
  return t;
}

export function isOpposing(a: FinanceCall, b: FinanceCall): boolean {
  return (a === "buy_keep") !== (b === "buy_keep");
}

/** A change to Sell needs the higher bar. */
export function neededFor(call: FinanceCall, previousCall: FinanceCall | null): number {
  return call === "sell" && previousCall !== "sell" ? sellAgreementNeeded() : agreementNeeded();
}

export function reachesAgreement(t: Tally, needed: number): boolean {
  return t.agree >= needed && t.agree > t.disagree + t.unsure;
}

export type CandidateView = { id: string; call: FinanceCall; createdAt: Date; verdicts: readonly TallyVerdict[] };

export type Settlement =
  | { agreed: false }
  | { agreed: true; viewId: string; tally: Tally; divided: boolean };

/**
 * The agreed view of a job, if any: of the views that reached agreement, the one
 * with the most agree weight (the earliest on a tie). `divided` when an opposing
 * view also reached agreement.
 */
export function settleViews(views: readonly CandidateView[], previousCall: FinanceCall | null): Settlement {
  const qualified = views
    .map((view) => ({ view, t: tally(view.verdicts) }))
    .filter(({ view, t }) => reachesAgreement(t, neededFor(view.call, previousCall)))
    .sort((a, b) => b.t.agree - a.t.agree || a.view.createdAt.getTime() - b.view.createdAt.getTime());
  const winner = qualified[0];
  if (!winner) return { agreed: false };
  const divided = qualified.some(({ view }) => isOpposing(view.call, winner.view.call));
  return { agreed: true, viewId: winner.view.id, tally: winner.t, divided };
}
