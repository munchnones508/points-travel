You are running a 30-second daily standup ritual for this project. Be concise and actionable.

## Step 1: Git Status Check
Run `git status` and `git diff --stat` to see uncommitted changes. Summarize what's dirty, staged, or untracked in 1-2 bullet points. If the working tree is clean, say so.

## Step 2: Project State
Read `PROJECT_STATE.md` from the repo root. Pull out:
- **Current phase** and status (one line)
- **What's been built** (brief list — no more than 4 bullets)
- **Open questions** (if any)

## Step 3: What Changed Since Last Session
Run `git log --oneline -10` and `git diff HEAD~3 --stat` to understand recent activity. Summarize what changed in 2-3 bullets. Focus on *what matters*, not every file touched.

## Step 4: Propose the #1 Next Task
Based on the project state, uncommitted work, and next steps listed in PROJECT_STATE.md, propose the single most impactful thing to work on right now. Frame it as:

> **Recommended next task:** [one sentence description]
> **Why this one:** [one sentence justification]
> **Estimated scope:** [small / medium / large]

## Output Format
Present everything as a single, scannable standup summary:

```
--- Daily Review: points-travel ---

Git: [clean / dirty summary]

Project Status: [phase + one-liner]

Recent Changes:
- ...
- ...

Recommended Next Task: ...
Why: ...
Scope: ...
```

Keep the entire output under 20 lines. No filler. No preamble. Just the standup.
