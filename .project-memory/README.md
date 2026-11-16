# Project memory: read this first

This folder is the project's shared record: what was decided, changed and verified. Several people and AI sessions work on this repo at the same time, so these rules keep their records from overwriting each other.

## Rules

1. **One session per folder.** Never run two sessions (or a session and a person) in the same checkout at once. To work in parallel, give each session its own git worktree and branch (`git worktree add ../ziki-<topic> -b <branch>`). Clashes then surface as merge conflicts instead of silent overwrites.
2. **Prefix every ID with its workstream.** Number within your own prefix only:

   | Prefix | Workstream |
   | --- | --- |
   | `FIN-` | Ziki Finance product (PRD, plan, the feature itself) |
   | `INF-` | Infrastructure: database, Cloudflare, CI/CD, auth plumbing |

   Kinds: `D` decision, `R` recommendation, `CR` change record, `T` task, `I` issue, `B` blocker, `RISK` risk. Examples: `FIN-D-012`, `INF-CR-005`. A new workstream adds a row here first.
3. **Add, don't rewrite.** Re-read a file right before editing it. Add new entries at the end of your own workstream's section. Change only your own entries. Never rewrite a whole file, renumber entries, or run find-and-replace across these files.
4. **Never reuse or reassign an ID.** If a record is replaced, mark it SUPERSEDED and point to the new ID.
5. **Shared summary files** (`CURRENT_STATE.md`, `HANDOFF.md`) have one section per workstream. Update only yours.
6. **Commit memory changes with the work they describe**, so the record and the code land together.

## Files

| File | Holds |
| --- | --- |
| `CURRENT_STATE.md` | Where things stand now |
| `HANDOFF.md` | What the next person needs to continue |
| `DECISIONS.md` | Decisions and recommendations |
| `CHANGELOG.md` | Change records (before, approved after, actual after, verification) |
| `TASKS.md` | Tasks |
| `ISSUES_AND_BLOCKERS.md` | Issues, blockers, risks |
| `IDEA_BACKLOG.md` | Ideas for later |

## Old to new ID map (2026-11-16, INF-CR-004)

Before the prefixes, two sessions used the same IDs. Older chat logs, commits or documents may use the old IDs.

| Old ID (as written at the time) | New ID |
| --- | --- |
| Finance D-001 … D-011 (D-001 and D-002 later shown wrongly as D-012 and D-013) | FIN-D-001 … FIN-D-011 |
| Finance R-001 … R-009 | FIN-R-001 … FIN-R-009 |
| Finance CR-001 (the PRD; once shown wrongly as CR-002) | FIN-CR-001 |
| Finance CR-002 (v1 plan as ideas) | FIN-CR-002 |
| Finance B-001, Risk-001, T-004 | FIN-B-001, FIN-RISK-001, FIN-T-004 |
| Infrastructure D-001 → D-012 (pooler) | INF-D-001 |
| Infrastructure D-002 → D-013 (Workers) | INF-D-002 |
| Infrastructure D-014, D-015, D-016 | INF-D-003, INF-D-004, INF-D-005 |
| Infrastructure CR-000 (migrations) | INF-CR-001 |
| Infrastructure CR-001 → CR-002 (Cloudflare) | INF-CR-002 |
| Infrastructure CR-003 (password hash) | INF-CR-003 |
| Infrastructure I-001 … I-007, T-001 … T-005 | INF-I-001 … INF-I-007, INF-T-001 … INF-T-005 |
