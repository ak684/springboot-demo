package io.ventureplatform.util;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;

/**
 * Utility for converting Spring Data JPA projections to Maps with snake_case keys.
 * This eliminates the need for manual field-by-field mapping in service classes.
 *
 * <p>When a new getter is added to a projection interface, it will automatically
 * be included in the Map output without any additional code changes.
 *
 * <p>Special transformations (truncation, formatting, defaults) should be applied
 * after calling toMap() by overwriting specific keys in the returned Map.
 */
@Slf4j
public final class ProjectionMapper {

  private ProjectionMapper() {
  }

  /**
   * Convert a projection to a Map with snake_case keys.
   * All getter methods from the projection's interfaces are automatically mapped.
   *
   * @param projection      The projection object to convert
   * @param requestedFields Set of field names to include (snake_case).
   *                        If null or empty, all fields are included.
   * @return Map with snake_case keys and projection values
   */
  public static Map<String, Object> toMap(final Object projection,
                                          final Set<String> requestedFields) {
    Map<String, Object> result = new HashMap<>();
    boolean includeAll = (requestedFields == null || requestedFields.isEmpty());

    if (projection == null) {
      return result;
    }

    Class<?>[] interfaces = projection.getClass().getInterfaces();
    if (interfaces.length == 0) {
      log.warn("Projection has no interfaces, cannot map fields");
      return result;
    }

    for (Class<?> iface : interfaces) {
      mapInterfaceMethods(projection, iface, result, requestedFields, includeAll);
    }

    return result;
  }

  /**
   * Check if a field should be included based on requested fields.
   *
   * @param fieldName       The snake_case field name
   * @param requestedFields Set of requested field names
   * @return true if field should be included
   */
  public static boolean shouldInclude(final String fieldName,
                                       final Set<String> requestedFields) {
    if (requestedFields == null || requestedFields.isEmpty()) {
      return true;
    }
    return requestedFields.contains(fieldName);
  }

  private static void mapInterfaceMethods(final Object projection,
                                          final Class<?> iface,
                                          final Map<String, Object> result,
                                          final Set<String> requestedFields,
                                          final boolean includeAll) {
    for (Method method : iface.getDeclaredMethods()) {
      String methodName = method.getName();

      if (!methodName.startsWith("get") || method.getParameterCount() > 0) {
        continue;
      }

      String fieldName = toSnakeCase(methodName.substring(3));

      if (!includeAll && !requestedFields.contains(fieldName)) {
        continue;
      }

      try {
        Object value = method.invoke(projection);
        result.put(fieldName, value);
      } catch (Exception e) {
        log.debug("Failed to invoke {} on projection: {}",
            methodName, e.getMessage());
      }
    }
  }

  /**
   * Convert camelCase to snake_case.
   * Examples:
   *   TrafficSep2025 -> traffic_sep_2025
   *   CompanyName -> company_name
   *   EsgScore -> esg_score
   *   Id -> id
   */
  public static String toSnakeCase(final String camelCase) {
    if (camelCase == null || camelCase.isEmpty()) {
      return camelCase;
    }

    StringBuilder result = new StringBuilder();
    boolean lastWasUpper = false;
    boolean lastWasDigit = false;

    for (int i = 0; i < camelCase.length(); i++) {
      char c = camelCase.charAt(i);
      boolean isUpper = Character.isUpperCase(c);
      boolean isDigit = Character.isDigit(c);

      if (i > 0) {
        boolean nextIsLower = (i + 1 < camelCase.length())
            && Character.isLowerCase(camelCase.charAt(i + 1));

        if ((isUpper && !lastWasUpper)
            || (isUpper && lastWasUpper && nextIsLower)
            || (isDigit && !lastWasDigit)) {
          result.append('_');
        }
      }

      result.append(Character.toLowerCase(c));
      lastWasUpper = isUpper;
      lastWasDigit = isDigit;
    }

    return result.toString();
  }
}
