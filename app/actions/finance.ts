"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { FINANCE_PATH, HORIZONS, RISK_COMFORTS, normalizeSymbol, parseAvgCost, parseShares, safeTimezone } from "@/lib/finance";
import { FinanceClearanceError, grantFinanceClearance, removeFinanceClearance } from "@/lib/finance/clearance";
import { FinanceError, addHolding, markSold, saveProfile, setBriefingEmail, stopWatching, updateShares } from "@/lib/finance/holdings";
import { marketData, type TickerMatch } from "@/lib/finance/market-data";
import { parseFinanceSettings, saveFinanceSettings } from "@/lib/finance/settings";

/**
 * Ziki Finance actions (FIN-CR-003). Every action that touches holdings needs a
 * signed-in person and only ever changes that person's own rows.
 */

export type FinanceActionResult = { ok?: boolean; error?: string };

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/** Autocomplete for the ticker box. Public facts only, so it works signed out too. */
export async function searchTickersAction(query: string): Promise<TickerMatch[]> {
  const q = String(query ?? "").trim().slice(0, 40);
  if (!q) return [];
  return marketData().search(q, 8);
}

/** First visit: the notice, the two answers and the first stocks, all in one go. */
export async function setUpFinanceAction(_prev: FinanceActionResult, formData: FormData): Promise<FinanceActionResult> {
  const user = await requireUser();
  if (formData.get("notice") !== "on") return { error: "Tick the box to say you understand and are 18 or over." };
  const riskComfort = field(formData, "riskComfort");
  const horizon = field(formData, "horizon");
  if (!(RISK_COMFORTS as readonly string[]).includes(riskComfort)) return { error: "Pick how you feel about risk." };
  if (!(HORIZONS as readonly string[]).includes(horizon)) return { error: "Pick when you might need this money." };

  // Stocks come as parallel lists: symbol[i], shares[i], avgCost[i].
  const symbols = formData.getAll("symbol").map(String);
  const shares = formData.getAll("shares").map(String);
  const costs = formData.getAll("avgCost").map(String);
  const stocks: { symbol: string; shares: number | null; avgCost: number | null }[] = [];
  for (let i = 0; i < Math.min(symbols.length, 50); i++) {
    const symbol = normalizeSymbol(symbols[i] ?? "");
    if (!symbol) continue;
    const s = parseShares(shares[i]);
    if (!s.ok) return { error: `${symbol}: ${s.error}` };
    const c = parseAvgCost(costs[i]);
    if (!c.ok) return { error: `${symbol}: ${c.error}` };
    stocks.push({ symbol, shares: s.shares, avgCost: c.price });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await saveProfile(tx, user.id, {
        riskComfort: riskComfort as (typeof RISK_COMFORTS)[number],
        horizon: horizon as (typeof HORIZONS)[number],
        timezone: safeTimezone(field(formData, "timezone")),
      });
      for (const stock of stocks) await addHolding(tx, user.id, stock);
    });
  } catch (error) {
    if (error instanceof FinanceError) return { error: error.message };
    throw error;
  }
  revalidatePath(FINANCE_PATH);
  return { ok: true };
}

/** Change the two answers later, from the "⋯" menu. */
export async function updateFinanceProfileAction(_prev: FinanceActionResult, formData: FormData): Promise<FinanceActionResult> {
  const user = await requireUser();
  const riskComfort = field(formData, "riskComfort");
  const horizon = field(formData, "horizon");
  if (!(RISK_COMFORTS as readonly string[]).includes(riskComfort) || !(HORIZONS as readonly string[]).includes(horizon)) {
    return { error: "Pick an answer to both questions." };
  }
  const existing = await prisma.financeProfile.findUnique({ where: { userId: user.id }, select: { timezone: true } });
  if (!existing) return { error: "Set up Finance first." };
  await saveProfile(prisma, user.id, {
    riskComfort: riskComfort as (typeof RISK_COMFORTS)[number],
    horizon: horizon as (typeof HORIZONS)[number],
    timezone: field(formData, "timezone") ? safeTimezone(field(formData, "timezone")) : existing.timezone,
  });
  await setBriefingEmail(prisma, user.id, formData.get("briefingEmail") === "on");
  revalidatePath(FINANCE_PATH);
  return { ok: true };
}

/** Add a stock, or update it if it's already on the list. */
export async function addHoldingAction(_prev: FinanceActionResult, formData: FormData): Promise<FinanceActionResult> {
  const user = await requireUser();
  const symbol = normalizeSymbol(field(formData, "symbol"));
  if (!symbol) return { error: "Type a ticker like AAPL, or pick a company from the list." };
  const s = parseShares(field(formData, "shares"));
  if (!s.ok) return { error: s.error };
  const c = parseAvgCost(field(formData, "avgCost"));
  if (!c.ok) return { error: c.error };
  try {
    await addHolding(prisma, user.id, { symbol, shares: s.shares, avgCost: c.price });
  } catch (error) {
    if (error instanceof FinanceError) return { error: error.message };
    throw error;
  }
  revalidatePath(FINANCE_PATH, "layout");
  return { ok: true };
}

export async function editSharesAction(_prev: FinanceActionResult, formData: FormData): Promise<FinanceActionResult> {
  const user = await requireUser();
  const s = parseShares(field(formData, "shares"));
  if (!s.ok) return { error: s.error };
  const c = parseAvgCost(field(formData, "avgCost"));
  if (!c.ok) return { error: c.error };
  try {
    await updateShares(prisma, user.id, field(formData, "holdingId"), s.shares, c.price);
  } catch (error) {
    if (error instanceof FinanceError) return { error: error.message };
    throw error;
  }
  revalidatePath(FINANCE_PATH, "layout");
  return { ok: true };
}

/** "I sold this" or "Stop watching", then back to the Finance page. */
export async function removeHoldingAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const holdingId = field(formData, "holdingId");
  try {
    if (field(formData, "how") === "sold") await markSold(prisma, user.id, holdingId);
    else await stopWatching(prisma, user.id, holdingId);
  } catch (error) {
    if (!(error instanceof FinanceError)) throw error;
  }
  revalidatePath(FINANCE_PATH, "layout");
  redirect(FINANCE_PATH);
}

/** The signed-out box: send the person to sign in, then back with the ticker filled in. */
export async function startWithTickerAction(formData: FormData): Promise<void> {
  const symbol = normalizeSymbol(field(formData, "symbol"));
  const back = symbol ? `${FINANCE_PATH}?add=${encodeURIComponent(symbol)}` : FINANCE_PATH;
  redirect(`/login?callbackUrl=${encodeURIComponent(back)}`);
}

// ---------------------------------------------------------------------------
// Staff: finance clearance (idea 5)

const CLEARANCE_PAGE = "/superadmin/finance";

export async function grantFinanceClearanceAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();
  try {
    await grantFinanceClearance(prisma, field(formData, "email"));
  } catch (error) {
    if (error instanceof FinanceClearanceError) redirect(`${CLEARANCE_PAGE}?error=${error.code}`);
    throw error;
  }
  revalidatePath(CLEARANCE_PAGE);
}

export async function removeFinanceClearanceAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();
  await removeFinanceClearance(prisma, field(formData, "userId"));
  revalidatePath(CLEARANCE_PAGE);
}

/** Staff set the agreement numbers (idea 19, FIN-D-022). A change applies from the next settle. */
export async function saveFinanceSettingsAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const parsed = parseFinanceSettings({
    agreementNeeded: field(formData, "agreementNeeded"),
    managerVoteWeight: field(formData, "managerVoteWeight"),
    sellAgreementNeeded: field(formData, "sellAgreementNeeded"),
  });
  if (!parsed.ok) redirect(`${CLEARANCE_PAGE}?error=${parsed.error}#agreement`);
  const result = await saveFinanceSettings(prisma, parsed.values, user.id);
  revalidatePath(CLEARANCE_PAGE);
  redirect(`${CLEARANCE_PAGE}?saved=${result.changed ? "1" : "unchanged"}#agreement`);
}

