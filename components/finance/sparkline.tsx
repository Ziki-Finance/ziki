import { sparklinePoints } from "@/lib/finance/prices";

/**
 * A 30-day sparkline drawn from the closes we recorded (FIN-CR-006, PR B,
 * idea 18). It is decoration beside the number, so the number and its label
 * carry the meaning and the SVG itself is hidden from screen readers.
 */
export function Sparkline({ values, label }: { values: readonly number[]; label: string }) {
  const points = sparklinePoints(values);
  if (!points) return <span className="text-xs text-zk-muted">no history yet</span>;
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? first;
  const rising = last >= first;
  return (
    <svg viewBox="0 0 96 28" width="96" height="28" className="shrink-0" aria-hidden="true" focusable="false">
      <title>{label}</title>
      <polyline points={points} fill="none" strokeWidth="1.5" className={rising ? "stroke-zk-accent" : "stroke-zk-bad-fg"} />
    </svg>
  );
}
