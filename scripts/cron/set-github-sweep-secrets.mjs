/**
 * INF-CR-006: copy the secrets the Platform sweeps workflow needs from .env to
 * GitHub Actions secrets. Only keys listed in scripts/cron/sweep-secrets.json
 * and set in .env are sent. Values go to `gh` on stdin and are never printed.
 *
 *   node scripts/cron/set-github-sweep-secrets.mjs
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { readEnvFile } from "../cloudflare/read-env.mjs";

const REPO = "Ziki-Finance/ziki";
const { secrets } = JSON.parse(readFileSync(new URL("./sweep-secrets.json", import.meta.url), "utf8"));
const env = readEnvFile();

const sent = [];
const missing = [];
for (const [secretName, envName] of Object.entries(secrets)) {
  // SMTP_PASSWORD is the name the Cloudflare upload uses; the code reads SMTP_PASS.
  const value = env[envName] ?? (envName === "SMTP_PASS" ? env.SMTP_PASSWORD : undefined);
  if (!value) {
    missing.push(envName);
    continue;
  }
  const result = spawnSync("gh", ["secret", "set", secretName, "--repo", REPO], {
    input: value,
    stdio: ["pipe", "ignore", "inherit"],
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(`Could not set ${secretName}.`);
    process.exit(result.status ?? 1);
  }
  sent.push(secretName);
}
console.log(`Set ${sent.length} secrets: ${sent.join(", ")}`);
if (missing.length) console.log(`Not in .env (skipped): ${missing.join(", ")}`);
