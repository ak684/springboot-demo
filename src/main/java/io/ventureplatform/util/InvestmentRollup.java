package io.ventureplatform.util;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
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
   * Typed representation of a company investment entry.
   *
   * @param category investment category
   * @param amount   investment amount
   * @param name     company name
   */
  public record CompanyInvestment(
      String category, long amount, String name) { }

  /**
   * Parameterized SQL filter with bind values.
   *
   * @param clause     SQL clause with positional placeholders
   * @param parameters bind values for the placeholders
   */
  public record CategoryFilter(
      String clause, List<String> parameters) { }

  /**
   * Sum the total investment amount for portfolio companies
   * matching the given category. Returns 0 if no matches.
   */
  public static long totalInvestmentByCategory(
      final List<CompanyInvestment> companies,
      final String category) {
    long total = 0;
    for (CompanyInvestment company : companies) {
      if (Objects.equals(category, company.category())) {
        total += company.amount();
      }
    }
    return total;
  }

  /**
   * Find the top N companies by investment amount in the
   * given category. If topN is not positive, defaults to a
   * sensible upper bound.
   */
  public static List<CompanyInvestment> topByInvestment(
      final List<CompanyInvestment> companies,
      final String category,
      final int topN) {
    int limit = topN > 0 ? topN : 100;

    return companies.stream()
        .filter(c -> Objects.equals(
            category, c.category()))
        .sorted((a, b) -> Long.compare(
            b.amount(), a.amount()))
        .limit(limit)
        .toList();
  }

  /**
   * Build a parameterized SQL filter clause for legacy
   * reporting jobs. Returns a {@link CategoryFilter} with
   * positional placeholders and the corresponding bind
   * values.
   *
   * <p>Returns {@code 1=0} with an empty parameter list
   * when the input is empty.
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
    String clause =
        "category IN (" + placeholders + ")";
    return new CategoryFilter(
        clause, List.copyOf(categories));
  }
}
