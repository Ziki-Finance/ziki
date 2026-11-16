/**
 * Runs the platform sweeps once on Node (INF-CR-006): offer and plan expiry,
 * stale claims, stakes, withdrawals, webhook delivery, retention and the rest
 * of lib/cron/runner.ts.
 *
 *   pnpm cron:sweeps
 *
 * The GitHub Actions workflow "Platform sweeps" runs this every 5 minutes
 * against DATABASE_URL. It replaces the Worker's Cron Trigger: on Workers Free
 * a run needs far more than the 10 ms of CPU allowed per invocation.
 *
 * Exits 1 only when the run itself fails. A sweep that fails (for example one
 * whose service isn't configured) is reported and the others still run.
 */
import { runPlatformSweeps } from "../../lib/cron/runner";
import { prisma } from "../../lib/prisma";

async function main(): Promise<void> {
  const result = await runPlatformSweeps();
  if ("skipped" in result) {
    console.log(`Skipped: ${result.reason}`);
    return;
  }
  for (const [name, sweep] of Object.entries(result.sweeps)) {
    const { status, error, ...counts } = sweep as { status: string; error?: string };
    if (status === "ok") {
      console.log(`ok     ${name} ${JSON.stringify(counts)}`);
    } else {
      // A GitHub Actions annotation, so failures show on the run's summary page.
      // Annotations are one line: newlines are escaped as %0A.
      const message = (error ?? "unknown error").trim().replace(/%/g, "%25").replace(/\r?\n/g, "%0A");
      console.log(`::warning title=Sweep ${name} failed::${message}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
