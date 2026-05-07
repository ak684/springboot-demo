#!/bin/bash
# demo/seed-pr.sh
#
# Stages a fresh demo PR for the OpenHands code-review demo. Idempotent: if a
# previous demo branch with the same name exists, it's deleted first.
#
# Usage:
#   ./demo/seed-pr.sh                # uses the default seed (InvestmentRollup)
#   GH_USER=aking13 ./demo/seed-pr.sh   # opens the PR as a different gh-authenticated user
#
# Requirements: gh CLI authenticated as a user with write on ak684/springboot-demo.
# Run from the repo root.

set -euo pipefail

REPO="ak684/springboot-demo"
BRANCH="feat/investment-rollup-demo"
TARGET_BASE="main"

# If a specific gh user was requested, switch to them; remember the prior so we can switch back.
PRIOR_USER=""
if [[ -n "${GH_USER:-}" ]]; then
  PRIOR_USER=$(gh auth status -h github.com 2>&1 | sed -n 's/.*account \(.*\) (.*/\1/p' | head -1 || true)
  echo "switching gh CLI to $GH_USER (prior: ${PRIOR_USER:-unknown})..."
  gh auth switch -u "$GH_USER" -h github.com
fi

cleanup() {
  if [[ -n "$PRIOR_USER" && "$PRIOR_USER" != "$GH_USER" ]]; then
    gh auth switch -u "$PRIOR_USER" -h github.com >/dev/null 2>&1 || true
    echo "restored gh CLI to $PRIOR_USER."
  fi
}
trap cleanup EXIT

echo "==> ensuring main is up to date"
git fetch origin "$TARGET_BASE" --quiet
git checkout "$TARGET_BASE"
git reset --hard "origin/$TARGET_BASE"

echo "==> wiping any previous demo branch (local + remote)"
git branch -D "$BRANCH" 2>/dev/null || true
git push origin --delete "$BRANCH" 2>/dev/null || true

echo "==> creating fresh branch $BRANCH"
git checkout -b "$BRANCH"

echo "==> writing seeded utility class"
mkdir -p src/main/java/io/ventureplatform/util
cat > src/main/java/io/ventureplatform/util/InvestmentRollup.java <<'JAVA'
package io.ventureplatform.util;

import java.util.List;
import java.util.Map;

/**
 * Aggregates investment data across portfolio companies for dashboard rollups.
 *
 * <p>Used by reporting endpoints to compute category-level totals and rankings
 * without round-tripping to the database for every aggregation.
 */
public final class InvestmentRollup {

  private InvestmentRollup() {
    // utility class
  }

  /**
   * Sum the total investment amount for portfolio companies matching the
   * given category. Returns 0 if no matches.
   *
   * @param companies portfolio company records, each a map with
   *                  "category" and "amount" keys
   * @param category  category to filter on
   */
  public static long totalInvestmentByCategory(
      final List<Map<String, Object>> companies, final String category) {
    long total = 0;
    for (Map<String, Object> company : companies) {
      if (company.get("category").equals(category)) {
        total += ((Number) company.get("amount")).longValue();
      }
    }
    return total;
  }

  /**
   * Find the top N companies by investment amount in the given category.
   * If topN is not positive, defaults to a sensible upper bound.
   */
  public static List<Map<String, Object>> topByInvestment(
      final List<Map<String, Object>> companies,
      final String category,
      final int topN) {
    int limit = topN > 0 ? topN : 100;

    return companies.stream()
        .filter(c -> c.get("category").equals(category))
        .sorted((a, b) -> Long.compare(
            ((Number) b.get("amount")).longValue(),
            ((Number) a.get("amount")).longValue()))
        .limit(limit + 1)
        .toList();
  }

  /**
   * Build a SQL filter clause for legacy reporting jobs that hit the staging
   * data warehouse. Returns an OR-joined WHERE clause covering all categories.
   */
  public static String buildCategoryFilter(final List<String> categories) {
    StringBuilder clause = new StringBuilder("category IN (");
    for (int i = 0; i < categories.size(); i++) {
      if (i > 0) {
        clause.append(", ");
      }
      clause.append("'").append(categories.get(i)).append("'");
    }
    clause.append(")");
    return clause.toString();
  }
}
JAVA

git add src/main/java/io/ventureplatform/util/InvestmentRollup.java
git commit -q -m "feat: add InvestmentRollup helper for portfolio category aggregations

Adds a utility for computing category-level totals and 'top N by investment'
rankings used by upcoming dashboard rollup endpoints. Also exposes a category
filter builder for legacy reporting jobs that hit the staging warehouse."

echo "==> pushing $BRANCH"
git push -u origin "$BRANCH"

echo "==> opening PR"
gh pr create --repo "$REPO" --base "$TARGET_BASE" --head "$BRANCH" \
  --title "feat: add InvestmentRollup helper for portfolio category aggregations" \
  --body "## Summary

Adds a small utility for computing category-level investment totals and \"top N\" rankings, plus a category filter clause builder for legacy reporting jobs.

This is a building block — the dashboard rollup endpoints (#TBD) will wire it in next sprint. No controller wiring or data layer changes in this PR.

## What's in here

- \`InvestmentRollup.totalInvestmentByCategory(...)\` — sum amounts in a category
- \`InvestmentRollup.topByInvestment(...)\` — top N companies in a category by amount
- \`InvestmentRollup.buildCategoryFilter(...)\` — helper to construct an \`IN (...)\` WHERE clause for the staging warehouse reporting jobs

## Test plan

- [ ] Code review
- [ ] Manual sanity check via the dashboard rollup endpoints once they're wired up (next PR)
"

echo
echo "==> DONE. The demo PR is open. Run the OpenHands demo:"
echo "    @openhands /review please"
