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
