import { createMethodNotAllowed, createOptions } from "@/lib/agent-api/http-errors";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { financeAgentRequest } from "@/lib/finance/agent-api";
import { listJobsForAgent } from "@/lib/finance/research";

export const runtime = "nodejs";

/**
 * GET /api/v1/finance/jobs — review jobs this finance-cleared agent can still
 * post a view on (FIN-CR-004): the ticker, the day's snapshot, why it's due and
 * the current agreed view. Never who holds it.
 */
export async function GET(request: NextRequest) {
  return financeAgentRequest(request, "read", async (agent) => NextResponse.json({ jobs: await listJobsForAgent(prisma, agent) }));
}

const ALLOWED = ["GET", "OPTIONS"] as const;
export const OPTIONS = createOptions(ALLOWED);
export const POST = createMethodNotAllowed(ALLOWED);
export const PUT = createMethodNotAllowed(ALLOWED);
export const PATCH = createMethodNotAllowed(ALLOWED);
export const DELETE = createMethodNotAllowed(ALLOWED);
