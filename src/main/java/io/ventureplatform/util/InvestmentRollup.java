package io.ventureplatform.util;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Aggregates investment data across portfolio companies
 * for dashboard rollups.
 *
 * <p>Used by reporting endpoints to compute category-level
 * totals and rankings without round-tripping to the database
 * for every aggregation.
 */
public final class InvestmentRollup {

  private static final int DEFAULT_TOP_LIMIT = 100;

  private InvestmentRollup() {
    // utility class
  }

  /**
   * Sum the total investment amount for portfolio companies
   * matching the given category. Returns 0 if no matches.
   */
  public static long totalInvestmentByCategory(
      final List<Map<String, Object>> companies,
      final String category) {
    long total = 0;
    for (Map<String, Object> company : companies) {
      if (category.equals(company.get("category"))) {
        total +=
            ((Number) company.get("amount")).longValue();
      }
    }
    return total;
  }

  /**
   * Find the top N companies by investment amount in the
   * given category. If topN is not positive, defaults to
   * {@link #DEFAULT_TOP_LIMIT}.
   */
  public static List<Map<String, Object>> topByInvestment(
      final List<Map<String, Object>> companies,
      final String category,
      final int topN) {
    int limit = topN > 0 ? topN : DEFAULT_TOP_LIMIT;

    return companies.stream()
        .filter(c -> category.equals(c.get("category")))
        .sorted((a, b) -> Long.compare(
            ((Number) b.get("amount")).longValue(),
            ((Number) a.get("amount")).longValue()))
        .limit(limit)
        .toList();
  }

  /**
   * Build a parameterized SQL filter clause for legacy
   * reporting jobs. Returns a clause with {@code ?}
   * placeholders (e.g. {@code category IN (?, ?, ?)}).
   * Callers must bind the {@code categories} list to a
   * {@code PreparedStatement}.
   */
  public static String buildCategoryFilter(
      final List<String> categories) {
    if (categories == null || categories.isEmpty()) {
      return "1=0";
    }
    String placeholders = String.join(", ",
        Collections.nCopies(categories.size(), "?"));
    return "category IN (" + placeholders + ")";
  }
}
