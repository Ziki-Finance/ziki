import { requireSuperAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { grantFinanceClearanceAction, removeFinanceClearanceAction } from "@/app/actions/finance";
import { listFinanceCleared } from "@/lib/finance/clearance";

export const metadata = { title: "Finance clearance" };

const ERRORS: Record<string, string> = {
  invalid_email: "That doesn't look like an email address.",
  not_found: "No one has that email. They need to sign up first.",
  already_cleared: "That person is already cleared for finance work.",
};

const card = "rounded-xl border border-zk-border bg-zk-surface";
const primary = "rounded-md bg-zk-accent px-3 py-1.5 text-sm font-medium text-white";
const button = "rounded-md border border-zk-border px-3 py-1.5 text-sm text-zk-text2 hover:bg-zk-chip";

/**
 * Site staff only (FIN-D-005, idea 5). Clear a person for Ziki Finance work, so
 * their agents get finance jobs, or take it away. Like security clearance.
 */
export default async function FinanceClearancePage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  await requireSuperAdmin();
  const params = searchParams ? await searchParams : {};
  const error = params.error ? (ERRORS[params.error] ?? "Something went wrong.") : null;
  const people = await listFinanceCleared(prisma);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-zk-text">Finance clearance</h1>
        <p className="text-sm text-zk-text2">Only the agents of a cleared person get Ziki Finance jobs. Removing clearance stops new finance work for their agents at once.</p>
      </header>

      <form action={grantFinanceClearanceAction} className={`${card} flex flex-wrap items-end gap-2 p-4`}>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-zk-text">
          Clear a person by email
          <input name="email" type="email" required placeholder="name@example.com" className="rounded-md border border-zk-border bg-zk-surface px-2 py-1.5 text-sm" />
        </label>
        <button type="submit" className={primary}>
          Clear for finance
        </button>
        {error ? (
          <p role="alert" className="basis-full text-sm text-zk-bad-fg">
            {error}
          </p>
        ) : null}
      </form>

      <section className={card} aria-labelledby="cleared-heading">
        <h2 id="cleared-heading" className="border-b border-zk-border px-4 py-3 text-sm font-semibold text-zk-text">
          Cleared people ({people.length})
        </h2>
        {people.length === 0 ? (
          <p className="px-4 py-3 text-sm text-zk-text2">No one is cleared yet.</p>
        ) : (
          <ul className="divide-y divide-zk-border">
            {people.map((person) => (
              <li key={person.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-zk-text">{person.name}</span> <span className="text-zk-text2">{person.email}</span>
                  <span className="block text-xs text-zk-muted">
                    Cleared {person.clearedAt.toISOString().slice(0, 10)} · {person.agents} {person.agents === 1 ? "agent" : "agents"}
                  </span>
                </span>
                <form action={removeFinanceClearanceAction}>
                  <input type="hidden" name="userId" value={person.id} />
                  <button type="submit" className={button}>
                    Remove clearance
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
