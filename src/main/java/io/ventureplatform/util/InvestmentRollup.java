package io.ventureplatform.util;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Aggregates investment data across portfolio companies
 * for dashboard rollups.
 *
 * <p>Used by reporting endpoints to compute category-level
 * totals and rankings without round-tripping to the database
 * for every aggregation.
 */
public final class InvestmentRollup {

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
        total += ((Number) company.get("amount")).longValue();
      }
    }
    return total;
  }

  /**
   * Find the top N companies by investment amount in
   * the given category. If topN is not positive, defaults
   * to a sensible upper bound.
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
   * A parameterized SQL fragment: the clause text contains
   * {@code ?} placeholders and {@code params} holds the
   * corresponding bind values.
   */
  public record CategoryFilter(
      String clause, List<String> params) { }

  /**
   * Build a {@code category IN (?, ?, …)} clause with
   * parameter placeholders for safe use with
   * {@code PreparedStatement}. Returns {@code "1=0"} with
   * an empty param list when categories is empty.
   */
  public static CategoryFilter buildCategoryFilter(
      final List<String> categories) {
    if (categories == null || categories.isEmpty()) {
      return new CategoryFilter(
          "1=0", Collections.emptyList());
    }
    String placeholders = categories.stream()
        .map(c -> "?")
        .collect(Collectors.joining(", "));
    String clause = "category IN (" + placeholders + ")";
    return new CategoryFilter(
        clause, List.copyOf(categories));
  }
}
