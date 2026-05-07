package io.ventureplatform.service.translation;

import lombok.AllArgsConstructor;
import lombok.Value;

import java.util.Collections;
import java.util.List;

/**
 * Application event published from
 * {@code CompanyExtractionDataService.updatePublicProfile} after the
 * save transaction commits. The translation worker listens for this
 * via {@code @TransactionalEventListener(AFTER_COMMIT)} so we never
 * fire OpenAI calls for saves that get rolled back.
 *
 * <p>Carries snapshots of every translatable source-language value
 * at save time so the worker can perform a compare-and-set check
 * before writing each translation back. If any source has changed
 * (a newer save landed), the stale translation for that field is
 * dropped without affecting the others.
 *
 * <p>The {@code companyDescriptionSnapshot} is null when the save
 * did not edit {@code company_description}; the worker then skips
 * that field entirely. The {@code productSnapshots} list is empty
 * when the save didn't touch any product item title/description in
 * the active language.
 */
@Value
@AllArgsConstructor
public class PublicProfileTranslationEvent {
  Long companyId;
  PublicProfileLanguage sourceLanguage;
  String companyDescriptionSnapshot;
  List<ProductItemSnapshot> productSnapshots;

  /**
   * Convenience constructor for the company-description-only case
   * (preserves backward-compatibility with the original #517/#518
   * call sites that don't carry product snapshots).
   *
   * @param id          target company id
   * @param sourceLang  active editor language at save time
   * @param descSnap    snapshot of the active-language description
   */
  public PublicProfileTranslationEvent(
      final Long id,
      final PublicProfileLanguage sourceLang,
      final String descSnap) {
    this(id, sourceLang, descSnap, Collections.emptyList());
  }

  /**
   * Snapshot of one product item's translatable fields at save
   * time. The worker pairs each snapshot with the freshly-read
   * entity to enforce the same compare-and-set rule the company
   * description uses: never overwrite a target the user just
   * edited, never write a translation derived from a stale source.
   */
  @Value
  public static class ProductItemSnapshot {
    String itemId;
    String titleSnapshot;
    String descriptionSnapshot;
  }
}
