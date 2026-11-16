import type { FinanceHorizon, FinanceRisk, FinanceRiskComfort, PrismaClient } from "@prisma/client";

/**
 * Ideas for you (FIN-CR-005, idea 12; FIN-D-019): new stocks that fit a
 * person's two answers. Only agreed Keep/Buy views, never one agent's opinion,
 * and never a stock the person already holds or watches.
 */

type Db = PrismaClient;

export const IDEAS_ON_PAGE = 3;
export const IDEAS_IN_BRIEFING = 1;

const BY_RISK: Record<FinanceRiskComfort, readonly FinanceRisk[]> = {
  careful: ["low"],
  balanced: ["low", "medium"],
  adventurous: ["low", "medium", "high"],
};
const BY_HORIZON: Record<FinanceHorizon, readonly FinanceRisk[]> = {
  lt1: ["low"],
  y1to5: ["low", "medium"],
  gt5: ["low", "medium", "high"],
};

/** The risk levels both answers allow. */
export function allowedRisks(profile: { riskComfort: FinanceRiskComfort; horizon: FinanceHorizon }): FinanceRisk[] {
  return BY_RISK[profile.riskComfort].filter((risk) => BY_HORIZON[profile.horizon].includes(risk));
}

export type Idea = {
  symbol: string;
  name: string;
  risk: FinanceRisk;
  reason: string;
  agentsAgree: number;
  agentsTotal: number;
  agreedAt: Date;
};

/**
 * Up to `limit` ideas for a person: the current agreed view of each ticker,
 * kept only if it is Keep/Buy at an allowed risk, most agreement first.
 */
export async function ideasFor(
  db: Db,
  person: { userId: string; riskComfort: FinanceRiskComfort; horizon: FinanceHorizon },
  limit = IDEAS_ON_PAGE,
): Promise<Idea[]> {
  const risks = allowedRisks(person);
  const latest = await db.financeAgreedView.findMany({
    where: { ticker: { holdings: { none: { userId: person.userId } } } },
    orderBy: { agreedAt: "desc" },
    distinct: ["tickerId"],
    take: 200,
    select: {
      agreedAt: true,
      agentsAgree: true,
      agentsTotal: true,
      ticker: { select: { symbol: true, name: true } },
      view: { select: { call: true, risk: true, reasons: true } },
    },
  });
  return latest
    .filter((row) => row.view.call === "buy_keep" && risks.includes(row.view.risk))
    .sort((a, b) => b.agentsAgree / b.agentsTotal - a.agentsAgree / a.agentsTotal || b.agentsAgree - a.agentsAgree || b.agreedAt.getTime() - a.agreedAt.getTime())
    .slice(0, limit)
    .map((row) => ({
      symbol: row.ticker.symbol,
      name: row.ticker.name,
      risk: row.view.risk,
      reason: row.view.reasons[0] ?? "",
      agentsAgree: row.agentsAgree,
      agentsTotal: row.agentsTotal,
      agreedAt: row.agreedAt,
    }));
}
