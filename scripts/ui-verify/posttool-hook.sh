#!/bin/bash
# PostToolUse Bash hook: nudges Claude to run the UI verification harness +
# publish.ts when a `git push` from a non-main branch included changes under
# frontend/**, and the proof for the current HEAD SHA hasn't been published yet.
#
# The hook is ADVISORY — it prints to stdout (which gets shown to Claude as
# extra context) and exits 0. It never blocks the push. If proof is already
# up to date for the current commit (verified via the local marker or the PR
# body's <!-- ui-verify:sha=... --> marker), the hook exits silently.
#
# Wired up in .claude/settings.json under PostToolUse / matcher: "Bash".
set -eu

# Read the tool-use payload that Claude Code pipes to the hook on stdin.
INPUT="$(cat)"

# Only act on git push commands. Use jq for robust JSON parsing.
CMD="$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")"
case "$CMD" in
  *"git push"*|*"git "*"push"*) ;;
  *) exit 0 ;;
esac

# Always run from the repo root.
REPO_ROOT="$(git -C "$(pwd)" rev-parse --show-toplevel 2>/dev/null || echo "")"
if [ -z "$REPO_ROOT" ]; then exit 0; fi
cd "$REPO_ROOT"

BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
case "$BRANCH" in
  ""|main|master|HEAD) exit 0 ;;
esac

SHA="$(git rev-parse HEAD 2>/dev/null || echo "")"
SHORT="$(printf '%s' "$SHA" | cut -c1-7)"
if [ -z "$SHA" ]; then exit 0; fi

GIT_DIR="$(git rev-parse --git-dir 2>/dev/null || echo .git)"
MARKER="${GIT_DIR}/ui-verify-last-published"

# Did the most recent commit touch frontend/**?
FE_TOUCHED="$(git diff --name-only HEAD~1..HEAD 2>/dev/null | grep -c '^frontend/' || true)"
if [ "${FE_TOUCHED:-0}" = "0" ]; then exit 0; fi

# Is proof already published for this exact commit?
if [ -f "$MARKER" ]; then
  PUBLISHED_SHA="$(jq -r '.sha // ""' < "$MARKER" 2>/dev/null || echo "")"
  PUBLISHED_BRANCH="$(jq -r '.branch // ""' < "$MARKER" 2>/dev/null || echo "")"
  if [ "$PUBLISHED_SHA" = "$SHA" ] && [ "$PUBLISHED_BRANCH" = "$BRANCH" ]; then
    exit 0
  fi
fi

# In Claude Code Web, artifact commits may go through sysadmin instead of the
# sandbox git checkout. In that case the local marker can be stale even though
# the PR description already points at proof for the current SHA.
PR_JSON=""
if command -v gh >/dev/null 2>&1; then
  PR_JSON="$(gh pr view --json number,body 2>/dev/null || true)"
  if [ -n "$PR_JSON" ]; then
    PR_SHA="$(printf '%s' "$PR_JSON" | jq -r 'try (.body | capture("<!-- ui-verify:sha=(?<sha>[0-9a-f]{40}) -->").sha) catch ""' 2>/dev/null || echo "")"
    if [ "$PR_SHA" = "$SHA" ]; then
      PR_NUMBER="$(printf '%s' "$PR_JSON" | jq -r '.number // empty' 2>/dev/null || echo "")"
      cat > "$MARKER" <<EOF
{
  "sha": "$SHA",
  "branch": "$BRANCH",
  "pr": ${PR_NUMBER:-null},
  "source": "pr-body",
  "at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
      exit 0
    fi
  fi
fi

# Stale proof (or none yet) → nudge Claude.
if [ -n "$PR_JSON" ]; then
cat <<EOF
⚠️ ui-verify: you just pushed frontend changes (commit ${SHORT}) to branch '${BRANCH}'. The PR's UI verification proof is not yet up to date for this commit.

Before declaring this task complete:
  1. Run the harness against the change you made:
       bun scripts/ui-verify/verify.ts --scenario <your-scenario>
     (write a new scenario at scripts/ui-verify/scenarios/<name>.ts if your change needs one)
  2. Publish the artifacts + emit the PR-description markdown block:
       bun scripts/ui-verify/publish.ts --pr <N> --dir <out-dir>
     (the out-dir is printed by step 1; on the PR branch, get N with: gh pr view --json number --jq .number)
  3. Splice the printed <!-- ui-verify:start --> ... <!-- ui-verify:end --> block into the PR description with gh pr edit. Replace any existing block; leave the rest of the description alone.

See scripts/ui-verify/README.md for the full workflow.
EOF
else
cat <<EOF
⚠️ ui-verify: you just pushed frontend changes (commit ${SHORT}) to branch '${BRANCH}', but there is no open PR for this branch yet.

Before declaring this task complete:
  1. Run the harness against the change you made:
       bun scripts/ui-verify/verify.ts --scenario <your-scenario>
     (write a new scenario at scripts/ui-verify/scenarios/<name>.ts if your change needs one)
  2. Check the artifacts and make sure the UI change actually works locally.
  3. After you open a PR for this branch, run publish.ts and splice the ui-verify block into the PR description.

See scripts/ui-verify/README.md for the full workflow.
EOF
fi
exit 0
