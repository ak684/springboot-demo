package io.ventureplatform.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.entity.CompanyPatent;
import io.ventureplatform.repository.CompanyPatentRepository;
import io.ventureplatform.service.external.OpenAiClient;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for grouping patents into families using AI.
 * Patents in the same family represent the same invention filed
 * in different jurisdictions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PatentFamilyGroupingService {

  private static final String MODEL = "gpt-5";
  private static final int MAX_PATENTS_PER_BATCH = 2000;

  private final OpenAiClient openAiClient;
  private final ObjectMapper objectMapper;
  private final CompanyPatentRepository companyPatentRepository;

  /**
   * Groups patents for a company into families and saves the family IDs.
   *
   * @param companyExtractionDataId the company extraction data ID
   * @return number of families created
   */
  @Transactional
  public int groupPatentsForCompany(final Long companyExtractionDataId) {
    List<CompanyPatent> patents = companyPatentRepository
        .findByCompanyExtractionDataId(companyExtractionDataId);

    if (patents.isEmpty()) {
      log.info("No patents found for company {}", companyExtractionDataId);
      return 0;
    }

    log.info("Grouping {} patents into families for company {}",
        patents.size(), companyExtractionDataId);

    Map<String, String> patentToFamilyMap = groupPatentsIntoFamilies(patents);

    int updatedCount = 0;
    for (CompanyPatent patent : patents) {
      String familyId = patentToFamilyMap.get(patent.getPatentNumber());
      if (familyId != null) {
        patent.setPatentFamilyId(familyId);
        updatedCount++;
      }
    }

    companyPatentRepository.saveAll(patents);

    long familyCount = patentToFamilyMap.values().stream().distinct().count();
    log.info("Grouped {} patents into {} families for company {}",
        updatedCount, familyCount, companyExtractionDataId);

    return (int) familyCount;
  }

  /**
   * Groups a list of patents into families using GPT-5.
   *
   * @param patents list of patents to group
   * @return map of patent number to family ID
   */
  public Map<String, String> groupPatentsIntoFamilies(
      final List<CompanyPatent> patents) {

    if (patents.isEmpty()) {
      return new HashMap<>();
    }

    if (patents.size() <= MAX_PATENTS_PER_BATCH) {
      return groupPatentBatch(patents);
    }

    Map<String, String> result = new HashMap<>();
    for (int i = 0; i < patents.size(); i += MAX_PATENTS_PER_BATCH) {
      int end = Math.min(i + MAX_PATENTS_PER_BATCH, patents.size());
      List<CompanyPatent> batch = patents.subList(i, end);
      Map<String, String> batchResult = groupPatentBatch(batch);
      result.putAll(batchResult);
    }

    return result;
  }

  private Map<String, String> groupPatentBatch(final List<CompanyPatent> patents) {
    String prompt = buildGroupingPrompt(patents);

    try {
      List<Map<String, String>> messages = new ArrayList<>();
      messages.add(Map.of(
          "role", "system",
          "content", "You are an expert patent analyst specializing in patent "
              + "family identification. Group patents by the underlying invention "
              + "they protect, NOT by exact title or date match. Patents filed in "
              + "different jurisdictions (EP, DE, US, WO, etc.) for the same "
              + "invention belong to the same family. Respond with valid JSON only."
      ));
      messages.add(Map.of("role", "user", "content", prompt));

      String response = openAiClient.makeChatCompletion(messages, MODEL);

      return parseGroupingResponse(response, patents);

    } catch (Exception e) {
      log.error("Failed to group patents via AI, falling back to priority date: {}",
          e.getMessage());
      return fallbackGrouping(patents);
    }
  }

  private String buildGroupingPrompt(final List<CompanyPatent> patents) {
    StringBuilder sb = new StringBuilder();
    sb.append("Group these patents into patent families based on the underlying ");
    sb.append("invention they protect. Patents in the same family protect the ");
    sb.append("same core invention, even if filed in different countries with ");
    sb.append("slightly different titles or wording.\n\n");
    sb.append("Use ALL the provided data to make your decision. Look for:\n");
    sb.append("- Similar technical subject matter in titles and abstracts\n");
    sb.append("- Same invention filed in different jurisdictions (e.g., ");
    sb.append("EP/DE/US/WO/CN/JP variants)\n");
    sb.append("- Same or similar priority dates (indicating related filings)\n");
    sb.append("- Same inventors working on the same invention\n");
    sb.append("- Similar CPC classification codes\n\n");
    sb.append("Patents:\n\n");

    for (int i = 0; i < patents.size(); i++) {
      CompanyPatent p = patents.get(i);
      sb.append(String.format("--- Patent %d ---\n", i + 1));
      sb.append(String.format("Number: %s\n", p.getPatentNumber()));
      sb.append(String.format("Title: %s\n",
          p.getTitle() != null ? p.getTitle() : "N/A"));
      if (p.getPriorityDate() != null) {
        sb.append(String.format("Priority Date: %s\n", p.getPriorityDate()));
      }
      if (p.getInventor() != null && !p.getInventor().isBlank()) {
        sb.append(String.format("Inventor: %s\n", p.getInventor()));
      }
      if (p.getPrimaryCpcCode() != null && !p.getPrimaryCpcCode().isBlank()) {
        sb.append(String.format("CPC Code: %s\n", p.getPrimaryCpcCode()));
      }
      if (p.getAbstractText() != null && !p.getAbstractText().isBlank()) {
        String abstractText = p.getAbstractText();
        if (abstractText.length() > 500) {
          abstractText = abstractText.substring(0, 500) + "...";
        }
        sb.append(String.format("Abstract: %s\n", abstractText));
      }
      sb.append("\n");
    }

    sb.append("Return JSON in this exact format:\n");
    sb.append("{\"groups\": [[1,2,3], [4,5], [6]]}\n");
    sb.append("Where each inner array contains patent numbers (1-indexed) ");
    sb.append("that belong to the same family.");

    return sb.toString();
  }

  private Map<String, String> parseGroupingResponse(
      final String response,
      final List<CompanyPatent> patents) {

    Map<String, String> result = new HashMap<>();

    try {
      JsonNode root = objectMapper.readTree(response);
      JsonNode groupsNode = root.get("groups");

      if (groupsNode == null || !groupsNode.isArray()) {
        log.warn("Invalid AI response format, using fallback");
        return fallbackGrouping(patents);
      }

      int familyIndex = 0;
      for (JsonNode group : groupsNode) {
        String familyId = generateFamilyId(familyIndex++);

        for (JsonNode indexNode : group) {
          int idx = indexNode.asInt() - 1;
          if (idx >= 0 && idx < patents.size()) {
            String patentNumber = patents.get(idx).getPatentNumber();
            result.put(patentNumber, familyId);
          }
        }
      }

      for (CompanyPatent p : patents) {
        if (!result.containsKey(p.getPatentNumber())) {
          result.put(p.getPatentNumber(), generateFamilyId(familyIndex++));
        }
      }

    } catch (Exception e) {
      log.error("Failed to parse AI grouping response: {}", e.getMessage());
      return fallbackGrouping(patents);
    }

    return result;
  }

  /**
   * Fallback grouping based on priority date + normalized title.
   */
  private Map<String, String> fallbackGrouping(final List<CompanyPatent> patents) {
    Map<String, String> result = new HashMap<>();
    Map<String, String> keyToFamilyId = new HashMap<>();
    int familyIndex = 0;

    for (CompanyPatent p : patents) {
      String key = buildFallbackKey(p);
      String familyId = keyToFamilyId.get(key);

      if (familyId == null) {
        familyId = generateFamilyId(familyIndex++);
        keyToFamilyId.put(key, familyId);
      }

      result.put(p.getPatentNumber(), familyId);
    }

    return result;
  }

  private String buildFallbackKey(final CompanyPatent patent) {
    String date = patent.getPriorityDate() != null
        ? patent.getPriorityDate() : "unknown";
    String title = patent.getTitle() != null
        ? patent.getTitle().toLowerCase().trim().replaceAll("[.,:;!?]+$", "")
        : "";
    return date + "_" + title;
  }

  private String generateFamilyId(final int index) {
    return "FAM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
  }
}
