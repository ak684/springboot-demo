package io.ventureplatform.constant;

public final class AppConstants {
  public static final String API_VERSION = "v1";
  public static final String API_PREFIX = "/api/";

  public static final String PROFILE_PROD = "prod";
  public static final String PROFILE_LOCAL = "local";
  public static final String PROFILE_EMBEDDED_POSTGRES = "embedded-postgres";

  public static final String SUBSCRIPTION_STATUS_ACTIVE = "active";
  public static final String GLOBAL_COMMUNITY_INPUT = "Global community / the planet";

  public static final Long ONE_DAY_MILLIS = 24 * 60 * 60 * 1000L;

  private AppConstants() {
  }
}
