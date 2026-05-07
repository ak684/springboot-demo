#!/bin/bash
# demo/reset.sh
#
# Cleans up after a demo run: closes the demo PR and deletes the demo branch.
# Use this between rehearsals so seed-pr.sh starts from a clean slate.
#
# Usage:
#   ./demo/reset.sh

set -euo pipefail

REPO="ak684/springboot-demo"
BRANCH="feat/investment-rollup-demo"

echo "==> closing any open demo PR on $BRANCH"
gh pr list --repo "$REPO" --head "$BRANCH" --json number --jq '.[].number' \
  | while read -r pr; do
      gh pr close "$pr" --repo "$REPO" --delete-branch || true
    done

echo "==> deleting local branch if present"
git branch -D "$BRANCH" 2>/dev/null || true

echo "==> deleting remote branch if still present"
git push origin --delete "$BRANCH" 2>/dev/null || true

echo "==> done. Run ./demo/seed-pr.sh to stage a fresh demo PR."
