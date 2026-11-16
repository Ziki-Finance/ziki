import type { FinanceCall } from "@prisma/client";
import { callLabel } from "@/lib/finance";

const STYLE: Record<FinanceCall, string> = {
  buy_keep: "border-zk-ok-fg text-zk-ok-fg",
  consider_selling: "border-zk-warn-fg text-zk-warn-fg",
  sell: "border-zk-bad-fg text-zk-bad-fg",
};

/** The agents' agreed view: Keep (or Buy), Consider selling, or Sell. */
export function ViewChip({ call, owned }: { call: FinanceCall; owned: boolean }) {
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-bold ${STYLE[call]}`}>{callLabel(call, owned)}</span>;
}
