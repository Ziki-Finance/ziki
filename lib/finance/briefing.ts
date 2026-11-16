import type { FinanceCall, FinanceHorizon, FinanceRisk, FinanceRiskComfort, Prisma, PrismaClient } from "@prisma/client";
import { expireUnreadCounts } from "@/lib/cache-tags";
import { FINANCE_FOOTER, FINANCE_PATH, RISK_LEVEL_LABEL, agreementWords, callLabel, profileWords } from "@/lib/finance";
import { logger } from "@/lib/logger";
import { canSendMail, sendMail } from "@/lib/mail";
import { absoluteUrl } from "@/lib/site-url";
import { isMarketHoliday, zonedParts } from "./calendar";
import { IDEAS_IN_BRIEFING, ideasFor, type Idea } from "./ideas";
import { currentViews, type CurrentView } from "./research";

/**
 * The daily briefing (FIN-CR-005, ideas 10 and 11; PRD §6.4).
 *
 * Put together by code from agreed views only (FIN-D-018): it selects and
 * orders what agents agreed, in fixed sentences, and never adds an opinion.
 * It leads with what needs a look. Sent about 07:00 in the person's own time
 * zone, Monday to Friday, never on a US market holiday, to the Inbox
 * (`finance_briefing`) and by email when they leave it on.
 */

type Db = PrismaClient;

export const BRIEFING_HOUR = 7;
export const BRIEFING_KIND = "finance_briefing";

export type BriefingLine = { symbol: string; name: string; call: FinanceCall; risk: FinanceRisk; reason: string; agentsAgree: number; agentsTotal: number; notReviewedToday: boolean };

export type BriefingContent = {
  date: string;
  /** "Tue 17 Nov". */
  dateWords: string;
  /** Owned stocks the agents say to consider selling or sell. */
  needsLook: BriefingLine[];
  /** Owned stocks to keep. */
  allGood: BriefingLine[];
  /** Watched stocks with a view. */
  watching: BriefingLine[];
  /** Owned or watched stocks agents haven't agreed on yet. */
  waiting: { symbol: string; name: string }[];
  newIdea: (Omit<Idea, "agreedAt"> & { fits: string }) | null;
};

export type BriefingHolding = { tickerId: string; symbol: string; name: string; owned: boolean };

/** "Tue 17 Nov" for a "YYYY-MM-DD". */
export function dateWords(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).replace(",", "");
}

/** Pure: the briefing's sections from the person's stocks, their agreed views and one idea. */
export function composeBriefing(
  date: string,
  holdings: readonly BriefingHolding[],
  views: ReadonlyMap<string, CurrentView>,
  idea: Idea | null,
  profile: { riskComfort: FinanceRiskComfort; horizon: FinanceHorizon },
): { content: BriefingContent; headline: string; needsLook: boolean; hasViews: boolean } {
  const content: BriefingContent = { date, dateWords: dateWords(date), needsLook: [], allGood: [], watching: [], waiting: [], newIdea: null };
  for (const h of holdings) {
    const view = views.get(h.tickerId);
    if (!view) {
      content.waiting.push({ symbol: h.symbol, name: h.name });
      continue;
    }
    const line: BriefingLine = {
      symbol: h.symbol,
      name: h.name,
      call: view.call,
      risk: view.risk,
      reason: view.reasons[0] ?? "",
      agentsAgree: view.agentsAgree,
      agentsTotal: view.agentsTotal,
      notReviewedToday: view.notReviewedToday,
    };
    if (!h.owned) content.watching.push(line);
    else if (view.call === "buy_keep") content.allGood.push(line);
    else content.needsLook.push(line);
  }
  // Sell before consider selling, then the strongest agreement.
  content.needsLook.sort((a, b) => Number(b.call === "sell") - Number(a.call === "sell") || b.agentsAgree - a.agentsAgree);
  if (idea) {
    content.newIdea = {
      symbol: idea.symbol,
      name: idea.name,
      risk: idea.risk,
      reason: idea.reason,
      agentsAgree: idea.agentsAgree,
      agentsTotal: idea.agentsTotal,
      fits: profileWords(profile),
    };
  }
  const hasViews = content.needsLook.length + content.allGood.length + content.watching.length + (content.newIdea ? 1 : 0) > 0;
  const headline =
    content.needsLook.length > 0
      ? `${content.needsLook.length} ${content.needsLook.length === 1 ? "stock needs" : "stocks need"} a look`
      : hasViews
        ? "Nothing needs your attention today"
        : "Agents are still reviewing your stocks";
  return { content, headline, needsLook: content.needsLook.length > 0, hasViews };
}

const label = (l: BriefingLine) => `${l.name} (${l.symbol})`;

/** The briefing as plain text, for email. The same content as the page and the Inbox. */
export function briefingText(content: BriefingContent): string {
  const out: string[] = [`Good morning. Here's your portfolio for ${content.dateWords}.`, ""];
  if (content.needsLook.length > 0) {
    out.push(`Needs a look (${content.needsLook.length})`);
    for (const l of content.needsLook) {
      out.push(`  • ${callLabel(l.call, true)} ${label(l)}: ${l.reason} ${agreementWords(l)}. Risk: ${RISK_LEVEL_LABEL[l.risk]}.`);
    }
    out.push("");
  } else {
    out.push("Nothing needs your attention today.", "");
  }
  if (content.allGood.length > 0) out.push(`All good (${content.allGood.length})`, `  • Keep ${content.allGood.map(label).join(", ")}`, "");
  if (content.watching.length > 0) {
    out.push(`Watching (${content.watching.length})`);
    for (const l of content.watching) out.push(`  • ${callLabel(l.call, false)} ${label(l)}: ${l.reason}`);
    out.push("");
  }
  if (content.newIdea) {
    const i = content.newIdea;
    out.push("New idea (1)", `  • ${i.name} (${i.symbol}): ${i.reason} Risk: ${RISK_LEVEL_LABEL[i.risk]}. Fits a ${i.fits} profile.`, "");
  }
  if (content.waiting.length > 0) out.push(`Still being reviewed: ${content.waiting.map((w) => w.symbol).join(", ")}.`, "");
  out.push(`Open Ziki Finance: ${absoluteUrl(FINANCE_PATH)}`, "", FINANCE_FOOTER);
  return out.join("\n");
}

/** The person's stocks, owned first. Only their own rows. */
async function holdingsOf(db: Db, userId: string): Promise<BriefingHolding[]> {
  const rows = await db.financeHolding.findMany({
    where: { userId, soldAt: null },
    select: { shares: true, ticker: { select: { id: true, symbol: true, name: true } } },
    orderBy: { ticker: { symbol: "asc" } },
  });
  return rows.map((r) => ({ tickerId: r.ticker.id, symbol: r.ticker.symbol, name: r.ticker.name, owned: r.shares !== null }));
}

/** Today's briefing for a person, worked out now (for the page before the 07:00 one exists). */
export async function previewBriefing(db: Db, profile: { userId: string; riskComfort: FinanceRiskComfort; horizon: FinanceHorizon; timezone: string }, now = new Date()) {
  const holdings = await holdingsOf(db, profile.userId);
  const [views, ideas] = await Promise.all([currentViews(db, holdings.map((h) => h.tickerId)), ideasFor(db, profile, IDEAS_IN_BRIEFING)]);
  return composeBriefing(zonedParts(now, profile.timezone).date, holdings, views, ideas[0] ?? null, profile);
}

/** Writes the day's briefing once; returns it, or null when it already existed. */
export async function createBriefing(db: Db, profile: { userId: string; riskComfort: FinanceRiskComfort; horizon: FinanceHorizon; timezone: string }, date: string) {
  const holdings = await holdingsOf(db, profile.userId);
  const [views, ideas] = await Promise.all([currentViews(db, holdings.map((h) => h.tickerId)), ideasFor(db, profile, IDEAS_IN_BRIEFING)]);
  const built = composeBriefing(date, holdings, views, ideas[0] ?? null, profile);
  const made = await db.financeBriefing.createMany({
    data: [{ userId: profile.userId, date, content: built.content as unknown as Prisma.InputJsonValue, headline: built.headline, needsLook: built.needsLook, hasViews: built.hasViews }],
    skipDuplicates: true,
  });
  return made.count > 0 ? built : null;
}

/** Inbox, then email when it's on. An empty briefing is kept but not sent (FIN-D-020). */
async function deliver(db: Db, person: { userId: string; email: string; briefingEmail: boolean }, date: string, built: NonNullable<Awaited<ReturnType<typeof createBriefing>>>, now: Date) {
  if (!built.hasViews) return { inbox: false, email: false };
  await db.notification.create({
    data: { userId: person.userId, kind: BRIEFING_KIND, title: `Your Finance briefing for ${built.content.dateWords}: ${built.headline.toLowerCase()}`, url: FINANCE_PATH },
  });
  await db.financeBriefing.updateMany({ where: { userId: person.userId, date }, data: { inboxAt: now } });
  expireUnreadCounts([person.userId]);
  let email = false;
  if (person.briefingEmail && canSendMail()) {
    try {
      await sendMail({ to: person.email, subject: `Your Ziki Finance briefing: ${built.headline}`, text: briefingText(built.content) });
      await db.financeBriefing.updateMany({ where: { userId: person.userId, date }, data: { emailedAt: new Date() } });
      email = true;
    } catch (error) {
      // Never log the briefing or the address.
      logger.error("[finance] briefing email failed", error instanceof Error ? error.name : "unknown");
    }
  }
  return { inbox: true, email };
}

/** Whether a person's local moment is briefing time: 07:xx, Monday to Friday, not a US market holiday. */
export function isBriefingTime(now: Date, timezone: string): { due: boolean; date: string } {
  const local = zonedParts(now, timezone);
  const weekday = local.weekday >= 1 && local.weekday <= 5;
  return { due: weekday && local.hour === BRIEFING_HOUR && !isMarketHoliday(local.date), date: local.date };
}

/**
 * Run by the platform cron every minute. Finds the time zones where it is now
 * 07:00–07:59 on a weekday, then up to `limit` people there without today's
 * briefing who hold or watch something.
 */
export async function sweepBriefings(db: Db, now = new Date(), limit = 25): Promise<{ made: number; inbox: number; emails: number }> {
  const zones = await db.financeProfile.findMany({ distinct: ["timezone"], select: { timezone: true } });
  const result = { made: 0, inbox: 0, emails: 0 };
  for (const { timezone } of zones) {
    const { due, date } = isBriefingTime(now, timezone);
    if (!due) continue;
    const people = await db.financeProfile.findMany({
      where: { timezone, user: { financeBriefings: { none: { date } }, financeHoldings: { some: { soldAt: null } } } },
      select: { userId: true, riskComfort: true, horizon: true, timezone: true, briefingEmail: true, user: { select: { email: true } } },
      take: limit - result.made,
    });
    for (const p of people) {
      const built = await createBriefing(db, p, date);
      if (!built) continue;
      result.made += 1;
      const sent = await deliver(db, { userId: p.userId, email: p.user.email, briefingEmail: p.briefingEmail }, date, built, now);
      if (sent.inbox) result.inbox += 1;
      if (sent.email) result.emails += 1;
    }
    if (result.made >= limit) break;
  }
  return result;
}

/** The person's own past briefings, newest first. */
export async function pastBriefings(db: Db, userId: string, take = 10) {
  return db.financeBriefing.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take,
    select: { date: true, headline: true, content: true, hasViews: true },
  });
}
