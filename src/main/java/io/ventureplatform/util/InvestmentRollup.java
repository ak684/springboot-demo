package io.ventureplatform.util;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
   * A parameterized SQL clause with placeholder markers and
   * the corresponding bind values.
   *
   * @param clause the SQL fragment, e.g. {@code category IN (?, ?)}
   * @param params the values to bind to the placeholders
   */
  public record CategoryFilter(String clause, List<String> params) { }

  /**
   * Sum the total investment amount for portfolio companies matching the
   * given category. Returns 0 if no matches.
   *
   * @param companies portfolio company records, each a map with
   *                  "category" and "amount" keys
   * @param category  category to filter on
   */
  public static long totalInvestmentByCategory(
      final List<Map<String, Object>> companies,
      final String category) {
    long total = 0;
    for (Map<String, Object> company : companies) {
      if (category.equals(company.get("category"))) {
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
        .filter(c -> category.equals(c.get("category")))
        .sorted((a, b) -> Long.compare(
            ((Number) b.get("amount")).longValue(),
            ((Number) a.get("amount")).longValue()))
        .limit(limit)
        .toList();
  }

  /**
   * Build a parameterized SQL {@code IN (...)} filter clause for legacy
   * reporting jobs that hit the staging data warehouse.
   *
   * <p>Returns a {@link CategoryFilter} containing the clause with
   * {@code ?} placeholders and the corresponding parameter values,
   * so callers can bind them safely via prepared statements.
   *
   * <p>If the list is empty, returns the always-false clause
   * {@code 1=0} with no parameters.
   */
  public static CategoryFilter buildCategoryFilter(
      final List<String> categories) {
    if (categories == null || categories.isEmpty()) {
      return new CategoryFilter("1=0", Collections.emptyList());
    }
    String placeholders = categories.stream()
        .map(c -> "?")
        .collect(Collectors.joining(", "));
    return new CategoryFilter(
        "category IN (" + placeholders + ")",
        List.copyOf(categories));
  }
}
