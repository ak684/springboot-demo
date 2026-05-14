package io.ventureplatform.util;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
   * Sum the total investment amount for portfolio companies matching the
   * given category. Companies whose {@code amount} is missing or null are
   * treated as 0. Returns 0 if no matches.
   */
  public static long totalInvestmentByCategory(
      final List<Map<String, Object>> companies, final String category) {
    long total = 0;
    for (Map<String, Object> company : companies) {
      if (Objects.equals(company.get("category"), category)) {
        total += amountOrZero(company);
      }
    }
    return total;
  }

  /**
   * Find the top {@code topN} companies by investment amount in the given
   * category, sorted descending. Companies with a missing or null amount are
   * treated as 0.
   *
   * @throws IllegalArgumentException if {@code topN} is not positive
   */
  public static List<Map<String, Object>> topByInvestment(
      final List<Map<String, Object>> companies,
      final String category,
      final int topN) {
    if (topN <= 0) {
      throw new IllegalArgumentException("topN must be positive, got " + topN);
    }
    return companies.stream()
        .filter(c -> Objects.equals(c.get("category"), category))
        .sorted(Comparator.comparingLong(InvestmentRollup::amountOrZero).reversed())
        .limit(topN)
        .toList();
  }

  /**
   * Build a parameterized SQL filter clause of the form
   * {@code category IN (?, ?, ?)} along with the bind values to pass to the
   * driver. Callers must bind {@link CategoryFilter#params()} positionally;
   * raw category strings are never inlined into the clause.
   *
   * @throws IllegalArgumentException if {@code categories} is null or empty
   */
  public static CategoryFilter buildCategoryFilter(final List<String> categories) {
    if (categories == null || categories.isEmpty()) {
      throw new IllegalArgumentException("categories must not be null or empty");
    }
    String placeholders = categories.stream().map(c -> "?").collect(Collectors.joining(", "));
    return new CategoryFilter("category IN (" + placeholders + ")", List.copyOf(categories));
  }

  private static long amountOrZero(final Map<String, Object> company) {
    Object amount = company.get("amount");
    return amount instanceof Number n ? n.longValue() : 0L;
  }

  /**
   * Parameterized SQL fragment paired with the bind values it expects.
   *
   * @param clause SQL fragment with {@code ?} placeholders
   * @param params bind values, in the same order as the placeholders
   */
  public record CategoryFilter(String clause, List<String> params) { }
}
