package io.ventureplatform.service.translation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.entity.CompanyExtractionData;
import io.ventureplatform.repository.CompanyExtractionDataRepository;
import io.ventureplatform.service.external.OpenAiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Async translator for the bilingual public profile editor (issues
 * #517, #518, #524).
 *
 * <p>Listens for {@link PublicProfileTranslationEvent} after the
 * profile save transaction commits, calls OpenAI ({@code gpt-4o-mini})
 * once per save to translate every edited source-language field
 * (company description plus product item titles/descriptions),
 * and writes each translation back in a fresh transaction with a
 * snapshot compare-and-set check so a stale result can never
 * overwrite a newer user save.
 *
 * <p>Lives in a separate bean from
 * {@code CompanyExtractionDataService} on purpose — Spring's
 * {@code @Async} proxy is bypassed when called from the same bean,
 * so the worker entry point must be invoked across a bean boundary.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PublicProfileTranslationService {

  private static final String MODEL = "gpt-4o-mini";

  private static final String SYSTEM_PROMPT =
      "You translate marketing/business copy between English and"
          + " German. Preserve formatting (line breaks, lists,"
          + " punctuation) exactly. Do NOT add commentary,"
          + " quotation marks around the output, or prefixes."
          + " Return only the translated text.";

  private static final String BATCH_SYSTEM_PROMPT =
      "You translate marketing/business copy between English and"
          + " German. Preserve formatting (line breaks, lists,"
          + " punctuation) exactly. Do NOT add commentary,"
          + " quotation marks around values, or prefixes."
          + " Return ONLY a single JSON object whose keys match"
          + " the input keys exactly and whose values are the"
          + " translations. Do not include markdown code fences.";

  private static final String COMPANY_DESCRIPTION_KEY =
      "company_description";

  private final CompanyExtractionDataRepository repository;
  private final OpenAiClient openAiClient;
  private final ObjectMapper objectMapper = new ObjectMapper();

  /**
   * AFTER_COMMIT entry point. Receives the event posted by
   * {@code updatePublicProfile} once the save is durable, and
   * dispatches the translation work to the bounded executor so
   * the user's request thread isn't blocked on OpenAI.
   *
   * @param event the post-commit translation request
   */
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onProfileSaved(
      final PublicProfileTranslationEvent event) {
    translateAsync(event);
  }

  /**
   * Bounded-executor async worker. Public so the manual
   * "Translate from " endpoint can call it directly when the
   * user clicks the recovery button (synchronous variant lives
   * in {@link #translateNow}).
   *
   * @param event the translation request
   */
  @Async("publicProfileTranslationExecutor")
  public void translateAsync(
      final PublicProfileTranslationEvent event) {
    try {
      runTranslation(event);
    } catch (Exception e) {
      log.error(
          "Public profile translation failed for company {}: {}",
          event.getCompanyId(), e.getMessage(), e);
    }
  }

  /**
   * Synchronous variant for the manual "Translate from "
   * button — the user clicked it and is waiting on a spinner,
   * so we want to surface success/failure inline instead of
   * fire-and-forget. Translates company_description plus every
   * product item where the source has content and the target
   * is empty/auto.
   *
   * @param companyId   target company id
   * @param sourceLang  language the user wants to translate FROM
   * @return true when at least one translation was written,
   *         false when nothing translatable was found
   */
  @Transactional
  public boolean translateNow(
      final Long companyId,
      final PublicProfileLanguage sourceLang) {
    CompanyExtractionData entity =
        repository.findById(companyId).orElse(null);
    if (entity == null) {
      log.warn(
          "translateNow: company {} not found", companyId);
      return false;
    }
    PublicProfileLanguage targetLang = sourceLang.other();

    Map<String, String> sourceTexts = new LinkedHashMap<>();
    String descSource = readDescription(entity, sourceLang);
    if (descSource != null && !descSource.isBlank()) {
      sourceTexts.put(COMPANY_DESCRIPTION_KEY, descSource);
    }
    for (Map<String, Object> item : readProductItems(entity)) {
      Object idObj = item.get("id");
      if (idObj == null) {
        continue;
      }
      String itemId = String.valueOf(idObj);
      String title = readItemField(item, "title", sourceLang);
      if (title != null && !title.isBlank()) {
        sourceTexts.put("item:" + itemId + ".title", title);
      }
      String desc = readItemField(item, "description", sourceLang);
      if (desc != null && !desc.isBlank()) {
        sourceTexts.put("item:" + itemId + ".description", desc);
      }
    }

    if (sourceTexts.isEmpty()) {
      log.info(
          "translateNow: no translatable source ({}) for"
              + " company {}",
          sourceLang.getCode(), companyId);
      return false;
    }

    Map<String, String> translations =
        callOpenAiBatch(sourceTexts, sourceLang, targetLang);
    if (translations.isEmpty()) {
      log.warn(
          "translateNow: OpenAI returned no translations"
              + " for company {} ({} -> {})",
          companyId, sourceLang.getCode(),
          targetLang.getCode());
      return false;
    }

    boolean wrote = applyTranslationsInPlace(
        entity, sourceLang, targetLang, sourceTexts, translations);
    if (wrote) {
      repository.save(entity);
      log.info(
          "translateNow: wrote {} translations for company {}",
          translations.size(), companyId);
    }
    return wrote;
  }

  private void runTranslation(
      final PublicProfileTranslationEvent event) {
    Long companyId = event.getCompanyId();
    PublicProfileLanguage sourceLang = event.getSourceLanguage();
    PublicProfileLanguage targetLang = sourceLang.other();

    Map<String, String> sourceTexts =
        collectSourceTexts(event);
    if (sourceTexts.isEmpty()) {
      log.info(
          "Skipping translation for company {}: no edited"
              + " source ({}) fields",
          companyId, sourceLang.getCode());
      return;
    }

    CompanyExtractionData preCheck =
        repository.findById(companyId).orElse(null);
    if (preCheck == null) {
      log.warn(
          "Skipping translation for company {}: not found",
          companyId);
      return;
    }

    Map<String, String> translatable = filterTranslatable(
        preCheck, sourceLang, sourceTexts);
    if (translatable.isEmpty()) {
      return;
    }

    Map<String, String> translations =
        callOpenAiBatch(translatable, sourceLang, targetLang);
    if (translations.isEmpty()) {
      log.warn(
          "OpenAI returned no translations for company {}"
              + " ({} -> {})",
          companyId, sourceLang.getCode(),
          targetLang.getCode());
      return;
    }

    persistWithCas(companyId, sourceLang, targetLang,
        translatable, translations);
  }

  private Map<String, String> collectSourceTexts(
      final PublicProfileTranslationEvent event) {
    Map<String, String> result = new LinkedHashMap<>();
    String descSnap = event.getCompanyDescriptionSnapshot();
    if (descSnap != null && !descSnap.isBlank()) {
      result.put(COMPANY_DESCRIPTION_KEY, descSnap);
    }
    List<PublicProfileTranslationEvent.ProductItemSnapshot>
        snaps = event.getProductSnapshots();
    if (snaps != null) {
      for (PublicProfileTranslationEvent.ProductItemSnapshot snap
          : snaps) {
        String idKey = "item:" + snap.getItemId();
        if (snap.getTitleSnapshot() != null
            && !snap.getTitleSnapshot().isBlank()) {
          result.put(idKey + ".title", snap.getTitleSnapshot());
        }
        if (snap.getDescriptionSnapshot() != null
            && !snap.getDescriptionSnapshot().isBlank()) {
          result.put(idKey + ".description",
              snap.getDescriptionSnapshot());
        }
      }
    }
    return result;
  }

  private Map<String, String> filterTranslatable(
      final CompanyExtractionData entity,
      final PublicProfileLanguage sourceLang,
      final Map<String, String> sourceTexts) {
    Map<String, String> translatable = new LinkedHashMap<>();
    for (Map.Entry<String, String> e : sourceTexts.entrySet()) {
      if (shouldTranslateField(
          entity, sourceLang, e.getKey(), e.getValue())) {
        translatable.put(e.getKey(), e.getValue());
      }
    }
    return translatable;
  }

  /**
   * Compare-and-set persistence: re-read the entity in a fresh
   * transaction, re-validate every per-field source snapshot and
   * target ownership, and write only the fields that still pass.
   * This catches the "user saved EN twice quickly, first
   * translation tries to land on top of the second EN" race
   * without needing explicit source hashes.
   *
   * @param companyId target company id
   * @param sourceLang language the translation came FROM
   * @param targetLang language the translation goes INTO
   * @param sourceSnapshots per-field source snapshots for CAS
   * @param translations per-field translated text from OpenAI
   */
  @Transactional
  protected void persistWithCas(
      final Long companyId,
      final PublicProfileLanguage sourceLang,
      final PublicProfileLanguage targetLang,
      final Map<String, String> sourceSnapshots,
      final Map<String, String> translations) {
    CompanyExtractionData entity =
        repository.findById(companyId).orElse(null);
    if (entity == null) {
      log.warn(
          "CAS: company {} disappeared before translation"
              + " could land",
          companyId);
      return;
    }
    boolean anyWritten = false;
    for (Map.Entry<String, String> e : translations.entrySet()) {
      String key = e.getKey();
      String translated = e.getValue();
      if (translated == null || translated.isBlank()) {
        continue;
      }
      String snapshot = sourceSnapshots.get(key);
      if (snapshot == null) {
        continue;
      }
      if (!shouldTranslateField(
          entity, sourceLang, key, snapshot)) {
        continue;
      }
      writeTranslation(entity, targetLang, key, translated);
      anyWritten = true;
      log.info(
          "Auto-translated company {} field {} {} -> {}",
          companyId, key, sourceLang.getCode(),
          targetLang.getCode());
    }
    if (anyWritten) {
      repository.save(entity);
    }
  }

  /**
   * Apply translations to an in-memory entity (no fresh fetch),
   * used by the synchronous {@link #translateNow} path which
   * already holds the entity inside a transaction.
   */
  private boolean applyTranslationsInPlace(
      final CompanyExtractionData entity,
      final PublicProfileLanguage sourceLang,
      final PublicProfileLanguage targetLang,
      final Map<String, String> sourceSnapshots,
      final Map<String, String> translations) {
    boolean wrote = false;
    for (Map.Entry<String, String> e : translations.entrySet()) {
      String key = e.getKey();
      String translated = e.getValue();
      if (translated == null || translated.isBlank()) {
        continue;
      }
      String snapshot = sourceSnapshots.get(key);
      if (snapshot == null) {
        continue;
      }
      if (!shouldTranslateField(
          entity, sourceLang, key, snapshot)) {
        continue;
      }
      writeTranslation(entity, targetLang, key, translated);
      wrote = true;
    }
    return wrote;
  }

  private boolean shouldTranslateField(
      final CompanyExtractionData entity,
      final PublicProfileLanguage sourceLang,
      final String key,
      final String sourceSnapshot) {
    String currentSource =
        readField(entity, sourceLang, key);
    if (!Objects.equals(currentSource, sourceSnapshot)) {
      log.info(
          "Skipping translation for company {} field {}:"
              + " source ({}) changed since save (CAS miss)",
          entity.getId(), key, sourceLang.getCode());
      return false;
    }
    PublicProfileLanguage targetLang = sourceLang.other();
    String currentTarget =
        readField(entity, targetLang, key);
    boolean targetIsAuto =
        readAutoFlag(entity, targetLang, key);
    boolean targetEmpty =
        currentTarget == null || currentTarget.isBlank();
    if (!targetEmpty && !targetIsAuto) {
      log.info(
          "Skipping translation for company {} field {}:"
              + " target ({}) is user-owned",
          entity.getId(), key, targetLang.getCode());
      return false;
    }
    return true;
  }

  private Map<String, String> callOpenAiBatch(
      final Map<String, String> sourceTexts,
      final PublicProfileLanguage sourceLang,
      final PublicProfileLanguage targetLang) {
    if (sourceTexts.size() == 1
        && sourceTexts.containsKey(COMPANY_DESCRIPTION_KEY)) {
      String single = callOpenAi(
          sourceTexts.get(COMPANY_DESCRIPTION_KEY),
          sourceLang, targetLang);
      if (single == null || single.isBlank()) {
        return Collections.emptyMap();
      }
      Map<String, String> out = new LinkedHashMap<>();
      out.put(COMPANY_DESCRIPTION_KEY, single);
      return out;
    }

    String inputJson;
    try {
      inputJson = objectMapper.writeValueAsString(sourceTexts);
    } catch (JsonProcessingException e) {
      log.error(
          "Failed to encode batch translation payload: {}",
          e.getMessage());
      return Collections.emptyMap();
    }

    List<Map<String, String>> messages = new ArrayList<>();
    Map<String, String> system = new HashMap<>();
    system.put("role", "system");
    system.put("content", BATCH_SYSTEM_PROMPT);
    messages.add(system);

    Map<String, String> user = new HashMap<>();
    user.put("role", "user");
    user.put("content",
        "Translate the values in the following JSON object"
            + " from " + languageName(sourceLang) + " into "
            + languageName(targetLang) + ". Keep the same"
            + " keys. Return ONLY the translated JSON object,"
            + " no other text and no markdown.\n\n"
            + inputJson);
    messages.add(user);

    String result =
        openAiClient.makeChatCompletionText(messages, MODEL);
    if (result == null) {
      return Collections.emptyMap();
    }
    return parseBatchResponse(result, sourceTexts.keySet());
  }

  private Map<String, String> parseBatchResponse(
      final String raw,
      final java.util.Set<String> expectedKeys) {
    String cleaned = stripCodeFences(raw).trim();
    try {
      Map<?, ?> parsed =
          objectMapper.readValue(cleaned, Map.class);
      Map<String, String> out = new LinkedHashMap<>();
      for (String key : expectedKeys) {
        Object value = parsed.get(key);
        if (value instanceof String
            && !((String) value).isBlank()) {
          out.put(key, (String) value);
        }
      }
      return out;
    } catch (JsonProcessingException e) {
      log.warn(
          "Failed to parse batch translation response as"
              + " JSON: {}",
          e.getMessage());
      return Collections.emptyMap();
    }
  }

  private static String stripCodeFences(final String input) {
    String s = input.trim();
    if (s.startsWith("```")) {
      int firstNl = s.indexOf('\n');
      if (firstNl >= 0) {
        s = s.substring(firstNl + 1);
      }
      int closing = s.lastIndexOf("```");
      if (closing >= 0) {
        s = s.substring(0, closing);
      }
    }
    return s;
  }

  private String callOpenAi(
      final String source,
      final PublicProfileLanguage sourceLang,
      final PublicProfileLanguage targetLang) {
    List<Map<String, String>> messages = new ArrayList<>();
    Map<String, String> system = new HashMap<>();
    system.put("role", "system");
    system.put("content", SYSTEM_PROMPT);
    messages.add(system);

    Map<String, String> user = new HashMap<>();
    user.put("role", "user");
    user.put("content",
        "Translate the following "
            + languageName(sourceLang)
            + " text into "
            + languageName(targetLang)
            + ". Output the translated text only.\n\n"
            + source);
    messages.add(user);

    String result = openAiClient.makeChatCompletionText(
        messages, MODEL);
    if (result == null) {
      return null;
    }
    return result.trim();
  }

  private static String languageName(
      final PublicProfileLanguage lang) {
    return lang == PublicProfileLanguage.EN ? "English" : "German";
  }

  private static String readDescription(
      final CompanyExtractionData entity,
      final PublicProfileLanguage lang) {
    return lang == PublicProfileLanguage.EN
        ? entity.getCompanyDescriptionEn()
        : entity.getCompanyDescriptionDe();
  }

  /**
   * Read the live value of a translatable field, addressed by
   * the same key the event used. Keys are either
   * {@code "company_description"} or {@code "item:<id>.<field>"}
   * where {@code <field>} is "title" or "description".
   */
  private String readField(
      final CompanyExtractionData entity,
      final PublicProfileLanguage lang,
      final String key) {
    if (COMPANY_DESCRIPTION_KEY.equals(key)) {
      return readDescription(entity, lang);
    }
    Map<String, Object> item = findItemByKey(entity, key);
    if (item == null) {
      return null;
    }
    String fieldName = fieldNameFromKey(key);
    return readItemField(item, fieldName, lang);
  }

  private boolean readAutoFlag(
      final CompanyExtractionData entity,
      final PublicProfileLanguage lang,
      final String key) {
    if (COMPANY_DESCRIPTION_KEY.equals(key)) {
      return Boolean.TRUE.equals(lang == PublicProfileLanguage.EN
          ? entity.getCompanyDescriptionEnAutoTranslated()
          : entity.getCompanyDescriptionDeAutoTranslated());
    }
    Map<String, Object> item = findItemByKey(entity, key);
    if (item == null) {
      return false;
    }
    String fieldName = fieldNameFromKey(key);
    Object flag = item.get(
        fieldName + "_" + lang.getCode() + "_auto_translated");
    return Boolean.TRUE.equals(flag);
  }

  private void writeTranslation(
      final CompanyExtractionData entity,
      final PublicProfileLanguage targetLang,
      final String key,
      final String translated) {
    if (COMPANY_DESCRIPTION_KEY.equals(key)) {
      if (targetLang == PublicProfileLanguage.EN) {
        entity.setCompanyDescriptionEn(translated);
        entity.setCompanyDescriptionEnAutoTranslated(true);
      } else {
        entity.setCompanyDescriptionDe(translated);
        entity.setCompanyDescriptionDeAutoTranslated(true);
      }
      return;
    }
    Map<String, Object> item = findItemByKey(entity, key);
    if (item == null) {
      return;
    }
    String fieldName = fieldNameFromKey(key);
    item.put(fieldName + "_" + targetLang.getCode(), translated);
    item.put(
        fieldName + "_" + targetLang.getCode()
            + "_auto_translated",
        true);
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> readProductItems(
      final CompanyExtractionData entity) {
    Map<String, Object> raw = entity.getRawExtractionData();
    if (raw == null) {
      return Collections.emptyList();
    }
    Object cps = raw.get("core_products_services");
    if (!(cps instanceof Map)) {
      return Collections.emptyList();
    }
    Object items = ((Map<String, Object>) cps).get("items");
    if (!(items instanceof List)) {
      return Collections.emptyList();
    }
    List<Map<String, Object>> out = new ArrayList<>();
    for (Object o : (List<Object>) items) {
      if (o instanceof Map) {
        out.add((Map<String, Object>) o);
      }
    }
    return out;
  }

  private Map<String, Object> findItemByKey(
      final CompanyExtractionData entity,
      final String key) {
    String itemId = itemIdFromKey(key);
    if (itemId == null) {
      return null;
    }
    for (Map<String, Object> item : readProductItems(entity)) {
      Object id = item.get("id");
      if (id != null && itemId.equals(String.valueOf(id))) {
        return item;
      }
    }
    return null;
  }

  private static String readItemField(
      final Map<String, Object> item,
      final String fieldName,
      final PublicProfileLanguage lang) {
    Object langValue =
        item.get(fieldName + "_" + lang.getCode());
    if (langValue instanceof String) {
      return (String) langValue;
    }
    return null;
  }

  private static String itemIdFromKey(final String key) {
    if (!key.startsWith("item:")) {
      return null;
    }
    int dot = key.lastIndexOf('.');
    if (dot <= "item:".length()) {
      return null;
    }
    return key.substring("item:".length(), dot);
  }

  private static String fieldNameFromKey(final String key) {
    int dot = key.lastIndexOf('.');
    if (dot < 0 || dot == key.length() - 1) {
      return "";
    }
    return key.substring(dot + 1);
  }
}
