package io.ventureplatform.util;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Aggregates investment data across portfolio companies for dashboard rollups.
 *
 * <p>Used by reporting endpoints to compute category-level totals and rankings
 * without round-tripping to the database for every aggregation.
 */
public final class InvestmentRollup {

  /**
   * Typed input for rollup calculations. Callers map their domain data
   * (entities, DTOs, query rows) to this record at the boundary.
   */
  public record PortfolioInvestment(String category, long amount) { }

  /**
   * Result of {@link #buildCategoryFilter(List)}: a parameterised SQL fragment
   * and the bound parameter values, ready to be passed to a
   * {@code PreparedStatement} or {@code JdbcTemplate}.
   */
  public record CategoryFilter(String sql, List<String> params) { }

  private InvestmentRollup() {
    // utility class
  }

  /**
   * Sum the total investment amount for portfolio companies matching the
   * given category. Returns 0 if no matches.
   */
  public static long totalInvestmentByCategory(
      final List<PortfolioInvestment> companies, final String category) {
    long total = 0;
    for (PortfolioInvestment company : companies) {
      if (Objects.equals(company.category(), category)) {
        total += company.amount();
      }
    }
    return total;
  }

  /**
   * Find the top N companies by investment amount in the given category,
   * sorted descending by amount.
   *
   * @throws IllegalArgumentException if {@code topN} is not positive
   */
  public static List<PortfolioInvestment> topByInvestment(
      final List<PortfolioInvestment> companies,
      final String category,
      final int topN) {
    if (topN <= 0) {
      throw new IllegalArgumentException("topN must be positive, was " + topN);
    }
    return companies.stream()
        .filter(c -> Objects.equals(c.category(), category))
        .sorted((a, b) -> Long.compare(b.amount(), a.amount()))
        .limit(topN)
        .toList();
  }

  /**
   * Build a parameterised SQL filter for the given categories. The returned
   * fragment uses {@code ?} placeholders so callers can bind values through a
   * prepared statement and avoid SQL injection.
   *
   * <p>If {@code categories} is null or empty, returns a clause that matches
   * nothing ({@code 1=0}) with no parameters, so callers can compose it
   * unconditionally without producing invalid SQL.
   */
  public static CategoryFilter buildCategoryFilter(final List<String> categories) {
    if (categories == null || categories.isEmpty()) {
      return new CategoryFilter("1=0", List.of());
    }
    String placeholders = String.join(", ",
        Collections.nCopies(categories.size(), "?"));
    return new CategoryFilter(
        "category IN (" + placeholders + ")",
        List.copyOf(categories));
  }
}
