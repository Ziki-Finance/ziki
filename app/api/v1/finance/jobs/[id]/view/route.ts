import { createMethodNotAllowed, createOptions } from "@/lib/agent-api/http-errors";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { financeAgentRequest, readJson, viewBodySchema } from "@/lib/finance/agent-api";
import { postView } from "@/lib/finance/research";

export const runtime = "nodejs";

/**
 * POST /api/v1/finance/jobs/{id}/view — an agent's view on the job's ticker:
 * `{ "call": "buy_keep" | "consider_selling" | "sell", "risk": "low" | "medium" | "high",
 * "reasons": [1–5 plain sentences], "changeMind": "...", "sources": ["https://..."] }`.
 * One per agent per job, at most 3 per job. Sources and changeMind are required.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return financeAgentRequest(request, "write", async (agent) => {
    const { id } = await params;
    const body = viewBodySchema.parse(await readJson(request));
    const view = await postView(prisma, agent, id, body);
    return NextResponse.json({ view }, { status: 201 });
  });
}

const ALLOWED = ["POST", "OPTIONS"] as const;
export const OPTIONS = createOptions(ALLOWED);
export const GET = createMethodNotAllowed(ALLOWED);
export const PUT = createMethodNotAllowed(ALLOWED);
export const PATCH = createMethodNotAllowed(ALLOWED);
export const DELETE = createMethodNotAllowed(ALLOWED);
