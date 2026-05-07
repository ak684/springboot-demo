package io.ventureplatform.service.translation;

/**
 * Whitelist of supported languages for the bilingual public
 * profile editor and auto-translation pipeline. Codes match
 * BCP 47 short forms accepted on the API surface ("en", "de").
 */
public enum PublicProfileLanguage {
  EN("en"),
  DE("de");

  private final String code;

  PublicProfileLanguage(final String code) {
    this.code = code;
  }

  /**
   * @return the lowercase BCP 47 code used over the wire.
   */
  public String getCode() {
    return code;
  }

  /**
   * The opposite language. Used to figure out which target
   * column to translate into when the user saves in this
   * language.
   *
   * @return the other language in the bilingual pair
   */
  public PublicProfileLanguage other() {
    return this == EN ? DE : EN;
  }

  /**
   * Strict whitelist parser. Accepts "en"/"de" (any case),
   * defaults to EN when the input is null or blank, and
   * throws for anything else so callers can never inject
   * unexpected language codes (e.g. into column names).
   *
   * @param raw caller-supplied language code
   * @return parsed language enum value, never null
   */
  public static PublicProfileLanguage parse(final String raw) {
    if (raw == null || raw.isBlank()) {
      return EN;
    }
    String trimmed = raw.trim().toLowerCase();
    switch (trimmed) {
      case "en":
        return EN;
      case "de":
        return DE;
      default:
        throw new IllegalArgumentException(
            "Unsupported language: " + raw);
    }
  }
}
