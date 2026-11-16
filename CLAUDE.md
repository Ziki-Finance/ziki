# PROJECT CONTINUITY PROTOCOL

## Mandatory Instructions for All AI Agents

### 1. YOUR RESPONSIBILITY

You are working on a project that must remain understandable, transferable and maintainable independently of the AI agent, model, platform or application being used.

You must maintain a persistent project memory that records:

- What the project is intended to achieve.

- What has already been built or accomplished.

- What decisions have been made and why.

- What changes have been proposed, approved, implemented and verified.

- What remains outstanding.

- What assumptions, constraints and risks exist.

- What the next person or AI agent needs to know to continue the work.

**The project documentation is the source of truth for project continuity, not your conversational memory.**

Never assume that another agent will have access to this conversation or your internal memory.

### 2. INITIAL PROJECT SETUP

At the beginning of a new project:

1. Inspect the existing project structure and documentation.

2. Identify the project's purpose, objectives, scope and constraints.

3. Create a `.project-memory/` directory if one does not exist.

4. Create or update the following files:

- `PROJECT.md`

- `.project-memory/CURRENT_STATE.md`

- `.project-memory/DECISIONS.md`

- `.project-memory/CHANGELOG.md`

- `.project-memory/TASKS.md`

- `.project-memory/IDEA_BACKLOG.md`

- `.project-memory/ISSUES_AND_BLOCKERS.md`

- `.project-memory/HANDOFF.md`

5. Create an `AGENTS.md` or equivalent project instruction file where supported.

6. Record any information that is unknown as unknown. Never invent project history or decisions.

If documentation already exists, preserve it and update it. Do not overwrite historical records simply to create a cleaner document.

### 3. CHANGE MANAGEMENT

Every meaningful proposed change must be recorded before implementation.

A change record must contain:

- Unique ID.

- Date created.

- Title.

- Description of the problem or opportunity.

- BEFORE: Existing behaviour, implementation or situation.

- PROPOSED AFTER: Intended behaviour, implementation or outcome.

- Reason for the change.

- Expected benefits.

- Risks and dependencies.

- Acceptance criteria.

- Approval status.

- Implementation status.

- Verification status.

- Files or components affected.

Use this lifecycle:

**PROPOSED → APPROVED → IN PROGRESS → COMPLETED → VERIFIED / APPROVED**

Additional statuses:

- REJECTED: The proposal was declined.

- ON HOLD: Work has been paused.

- BLOCKED: Work cannot proceed because of an unresolved dependency.

- SUPERSEDED: A newer decision or proposal has replaced it.

Do not skip approval.

Do not interpret a user's request for an explanation, recommendation or exploration as approval to implement.

If the user explicitly authorises implementation, record that approval and proceed within the approved scope.

If the user changes their mind, update the record and preserve the previous decision history.

### 4. BEFORE-AND-AFTER INTEGRITY

Never erase the original state when recording a change.

Maintain a clear distinction between:

- BEFORE: What existed before the change.

- APPROVED AFTER: What was authorised.

- ACTUAL AFTER: What was implemented.

- VERIFIED RESULT: What was tested and accepted.

If the implementation differs from the approved outcome, document the difference and seek approval where the deviation changes the agreed scope or outcome.

Never claim that something works merely because code was written.

Record the tests performed and their actual results.

### 5. DECISION REGISTER

Every significant project decision must be recorded.

For each decision, document:

- Decision ID.

- Date.

- Context and problem.

- Options considered.

- Decision taken.

- Reason for the decision.

- Consequences and trade-offs.

- Person responsible for approval.

- Related tasks or change records.

Distinguish between:

- Confirmed decisions.

- Recommendations awaiting approval.

- Assumptions awaiting validation.

- Rejected alternatives.

Do not silently reverse an established decision. Propose a new decision that references the previous one.

### 6. CONTINUOUS DOCUMENTATION

Update the project memory throughout the work, not only at the end.

At minimum:

- Before implementation: record the approved scope and expected outcome.

- During implementation: record meaningful progress, changes and blockers.

- After implementation: record actual outcomes and affected files.

- After testing: record verification evidence and outstanding defects.

- After user review: record approval, rejection or requested revisions.

Avoid documenting every trivial keystroke or insignificant code edit. Focus on changes that affect project understanding, functionality, architecture, scope, requirements or decisions.

Keep historical records intact.

### 7. SESSION END AND AGENT HANDOFF

Before ending a session, changing agents, switching platforms or reaching a usage limit, update `HANDOFF.md`.

It must contain:

**PROJECT**

- Project name and objective.

**CURRENT POSITION**

- What has been completed.

- What is currently in progress.

- What has not started.

**LATEST DECISIONS**

- Important confirmed decisions.

- Outstanding decisions awaiting approval.

**WORK PERFORMED**

- Files created, modified or deleted.

- Important implementation details.

- Tests performed and results.

**OUTSTANDING ITEMS**

- Next tasks in priority order.

- Known bugs and blockers.

- Unresolved questions.

- Dependencies.

**IMPORTANT CONSTRAINTS**

- Technical limitations.

- Business rules.

- User preferences.

- Security and access restrictions.

- Approvals required before proceeding.

**NEXT ACTION**

- The exact next recommended action.

- The expected outcome.

- How to verify completion.

Include relevant Git branch, commit hash and uncommitted changes where applicable.

Do not claim a commit exists unless it has actually been created.

### 8. INSTRUCTIONS TO THE NEXT AGENT

When taking over an existing project:

1. Read `PROJECT.md`.

2. Read `.project-memory/CURRENT_STATE.md`.

3. Read `.project-memory/HANDOFF.md`.

4. Read relevant entries in `DECISIONS.md` and `TASKS.md`.

5. Inspect the actual repository state.

6. Compare the documentation with the implementation.

7. Identify inconsistencies, missing information and uncommitted work.

8. Summarise your understanding before making significant changes.

Do not restart completed work without a reason.

Do not assume that a task marked completed was verified or approved.

Do not introduce changes that conflict with established decisions without first identifying the conflict.

If documentation and actual implementation disagree, report the discrepancy and establish the correct state before proceeding.

### 9. DOCUMENTATION QUALITY

Documentation must be:

- Concise but sufficiently detailed.

- Written in clear, understandable language.

- Structured and easy for another agent to navigate.

- Updated when the underlying project changes.

- Free from invented facts or unsupported completion claims.

- Independent of any particular AI provider or platform.

Use Markdown wherever possible.

Use stable IDs for decisions, tasks and change records.

Maintain dates in ISO format: YYYY-MM-DD.

Keep sensitive credentials, API keys, passwords and private user data out of project memory.

### 10. FINAL OPERATING PRINCIPLE

You are not merely completing a task in a conversation.

You are contributing to a persistent project that another human or AI agent must be able to understand and continue without requiring the original conversation.

**Never allow important project knowledge to exist only in your conversational context.**

When in doubt, preserve the information, record the uncertainty and prepare a clear handoff.
