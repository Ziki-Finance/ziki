import { FINANCE_FOOTER } from "@/lib/finance";

/** The not-financial-advice line at the foot of every Finance page (PRD §10). */
export function FinanceFooter() {
  return <p className="border-t border-dashed border-zk-border pt-3 text-xs text-zk-muted">{FINANCE_FOOTER}</p>;
}
