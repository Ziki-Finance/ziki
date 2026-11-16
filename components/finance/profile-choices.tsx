import type { FinanceHorizon, FinanceRiskComfort } from "@prisma/client";
import { HORIZONS, HORIZON_LABEL, RISK_COMFORTS, RISK_LABEL } from "@/lib/finance";

/** The two questions (FIN-D-008) as radio buttons that look like choice cards. */
export function ProfileChoices({ risk, horizon }: { risk?: FinanceRiskComfort; horizon?: FinanceHorizon }) {
  return (
    <div className="space-y-4">
      <Group legend="How do you feel about risk?" name="riskComfort" options={RISK_COMFORTS.map((v) => ({ value: v, label: RISK_LABEL[v] }))} selected={risk} />
      <Group legend="When might you need this money?" name="horizon" options={HORIZONS.map((v) => ({ value: v, label: HORIZON_LABEL[v] }))} selected={horizon} />
    </div>
  );
}

function Group({ legend, name, options, selected }: { legend: string; name: string; options: { value: string; label: string }[]; selected?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-zk-text">{legend}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center justify-center rounded-lg border border-zk-border px-3 py-2 text-sm text-zk-text2 has-[:checked]:border-2 has-[:checked]:border-zk-accent has-[:checked]:font-semibold has-[:checked]:text-zk-text"
          >
            <input type="radio" name={name} value={option.value} defaultChecked={selected === option.value} required className="sr-only" />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
