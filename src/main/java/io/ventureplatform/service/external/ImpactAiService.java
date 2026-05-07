package io.ventureplatform.service.external;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.extraction.prompt.PromptLoader;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ImpactAiService {

  private final ObjectMapper objectMapper;
  private final OpenAiClient openAiClient;
  private final PromptLoader promptLoader;

  private static final String TOC_DIRECT_PROMPT_PATH =
      "prompts/theory_of_change_direct.md";
  private static final String TOC_INTERACTIVE_PROMPT_PATH =
      "prompts/theory_of_change_interactive.md";

  private static final String VENTURE_DESCRIPTION_SYSTEM = "You are and AI assistant that helps writing a short "
    + "summary text for a pitch deck. This pitch deck describes the sustainability impact potential of startups. The "
    + "pitch deck will be shared with investors who care about sustainability impact.\n"
    + "The summary  text you write will represent a welcome text from the founder of the startup. The founder asks you "
    + "to summarize information that the user provides to you. The user will provide one or several impact areas. The "
    + "impact areas are titled as IMPACT AREA 1, IMPACT AREA 2 etc., each consists of a short title, then status quo "
    + "solution, our innovation, who we affect and what we improve. The impact areas higher up in the list are a little"
    + " more important.\n"
    + "- Start the text with \"Welcome to {venture name}!\n"
    + "- The summary text should be not longer than 500 characters with spaces.\n"
    + "- The text has to be shorter than 500 characters with spaces. If necessary, omit some information in your "
    + "summary.\n"
    + "- Please focus on what the venture will improve, who are the beneficiaries and what changes for these "
    + "beneficiaries.\n"
    + "- End the summary with \"Join us on our impact mission\"";
  private static final String IMPACT_DESCRIPTION_SYSTEM = "You are and AI assistant that writes short descriptions of "
    + "sustainability impact areas that startups address according to the pieces of data that user will send to you. "
    + "These descriptions of impact areas will be published in an online pitch deck, that will be shared with "
    + "investors. The length of the text you generate should be maximum 386 characters with spaces. The text should "
    + "describe what the startup does differently, compared to the status quo solution, what positive change is "
    + "generated for stakeholders and why this is important. Note that \"why this is important\" is not provided to "
    + "you. You need to write this part based on your AI knowledge. "
    + "Some further instructions: \n"
    + "1) Good impact measurement has as a rule \"do not overclaim\". Consider this in the words you choose. As an "
    + "example, instead of writing \"we revolutionize\" use \"we change\" or \"we improve\" or any other synonym that "
    + "you find appropriate. \n"
    + "2) When the stakeholder has the name \"global community / the planet\", please do not use the word \"global "
    + "community\". Rather use words such as \"we\".\n"
    + "3) Exclude the terms \"changing the game\"\n"
    + "4) Do not use a bulleted list or numbered list in your results.\n";
  private static final String INSPIRATIONAL_MESSAGE_SYSTEM = "You are and AI assistant that helps writing a pitch "
    + "deck that describes the sustainability impact potential of startups. The pitch deck will be shared with "
    + "investors who care about sustainability impact.\n"
    + "Your instructions:\n"
    + "1) You should write a short inspirational  phrase with a maximum 100 characters with spaces.\n"
    + "2) The maximum length of 100 characters with spaces is a firm requirement. Please rather make the phrase "
    + "incomplete instead of going beyond the character limit.\n"
    + "3) The inspirational sentence should end with three dots ...\n"
    + "4) The inspirational sentence should explain why \"what we improve for our beneficiaries\" is important "
    + "for those who we affect (beneficiaries).\n"
    + "Please note that we do not provide information why this change is important. You should use your AI knowledge "
    + "to write this.";
  private static final String FIND_ADDRESS_SYSTEM = "You are an assistant trained to extract physical address of the "
    + "company from HTML content of it's website. Focus on addresses located in a separate tag, and avoid extracting "
    + "addresses from articles or unrelated text. Return the address in JSON format, with fields for country, region, "
    + "city, address, and zip code. If a complete or partial address is found, fill in the corresponding fields. If no "
    + "address is found, return an empty string. The field `fullAddress` shall contain the full address string as it "
    + "appears on the website. If country is present, it's name should be provided only in ISO-2 format. "
    + "Example of expected format: "
    + "{ \\\\\\\"fullAddress\\\\\\\": \\\\\\\"\\\\\\\", \\\"country\\\": \\\"\\\", "
    + "\\\"region\\\": \\\"\\\", \\\"city\\\": \\\"\\\", \\\"address\\\": \\\"\\\", \\\"zipCode\\\": \\\"\\\" }.";
  private static final String FIND_COMPANY_NAME_SYSTEM = "You are an assistant trained to extract name of the "
    + "company from HTML content of it's website. You will receive part of the content that represents header of the "
    + "company's website. Your task is to locate and return only the name of the company, without any other words or "
    + "explanations.";
  private static final String FIND_LOGO_SYSTEM = "As an expert in HTML content analysis, you are tasked with "
    + "identifying the logo from a company's website header. When provided with the HTML content of the header, locate "
    + "the logo. If the logo is represented as an image, extract and return the URL from the 'src' attribute of the "
    + "<img> tag. The response should be the URL alone, in plain text, without any additional text or quotes. If the "
    + "logo is not an image or the URL cannot be extracted, return 'null'. Focus on delivering an exact, unembellished "
    + "URL or 'null', as applicable.";
  private static final String FIND_DESCRIPTION_SYSTEM = "You are an assistant trained to provide description of the "
    + " company's activities based on HTML content of it's website. You will receive main part of the content "
    + "of the website. Your task is to provide a short summary in one paragraph (up to 3-4 sentences) about what "
    + "this company is doing. The text should be not longer than 250 characters with spaces.";
  private static final String FIND_MISSION_SYSTEM = "You are an assistant trained to extract mission of the "
    + " company from HTML content of it's website. You will receive main part of the content "
    + "of the website. Your task is to formulate in one sentence mission of the company. The text should be not longer "
    + "than 250 characters with spaces.";
  private static final String FIND_SOCIAL_MEDIA_SYSTEM = "You are an assistant trained to extract company's social "
    + "media links from HTML content of it's website. You will receive part of the content that represents footer of "
    + "the company's website. Your task is to locate and extract links to social media channels of the company, "
    + "specifically: YouTube, Facebook, LinkedIn, Twitter, and Instagram. Return the result in JSON format. If some "
    + "data is not present, exclude it from the response. If no social media links found, return an empty JSON object. "
    + "Example of expected format: "
    + "{ \\\\\\\"youtube\\\\\\\": \\\\\\\"\\\\\\\", \\\"facebook\\\": \\\"\\\", "
    + "\\\"linkedin\\\": \\\"\\\", \\\"twitter\\\": \\\"\\\", \\\"instagram\\\": \\\"\\\" }.";
  private static final String ABC_CLASSIFICATION_PROMPT_PATH = "prompts/abc_classification.md";
  private static final String STAKEHOLDER_GEOGRAPHY_SUMMARY_PROMPT_PATH =
      "prompts/stakeholder_geography_summary.md";

  public String generateVentureDescription(final Venture venture) {
    return generateText(VENTURE_DESCRIPTION_SYSTEM, getVentureDescriptionPrompt(venture));
  }

  public String generateImpactDescription(final Impact impact) {
    return generateText(IMPACT_DESCRIPTION_SYSTEM, getImpactDescriptionPrompt(impact));
  }

  public String generateImpactInspiration(final Impact impact) {
    return generateText(INSPIRATIONAL_MESSAGE_SYSTEM, getImpactDescriptionPrompt(impact));
  }

  /**
   * Generate ABC classification for a single impact chain using IMP norms.
   */
  public String generateAbcClassification(final String impactChainContext) {
    try {
      List<Map<String, String>> messages = new ArrayList<>();

      Map<String, String> systemMessage = new HashMap<>();
      systemMessage.put("role", "system");
      systemMessage.put("content", promptLoader.loadPrompt(ABC_CLASSIFICATION_PROMPT_PATH));
      messages.add(systemMessage);

      Map<String, String> userMessage = new HashMap<>();
      userMessage.put("role", "user");
      userMessage.put("content", impactChainContext);
      messages.add(userMessage);

      return openAiClient.makeChatCompletion(messages);
    } catch (Exception ex) {
      throw new RuntimeException("Cannot generate ABC classification", ex);
    }
  }

  /**
   * Generate stakeholder geography summary claims for map view.
   *
   * @param geographyContext JSON context with ToC, scoring, and geography data
   * @return JSON response with 3 claims about where/who/what
   */
  public String generateStakeholderGeographySummary(final String geographyContext) {
    try {
      List<Map<String, String>> messages = new ArrayList<>();

      Map<String, String> systemMessage = new HashMap<>();
      systemMessage.put("role", "system");
      systemMessage.put("content",
          promptLoader.loadPrompt(STAKEHOLDER_GEOGRAPHY_SUMMARY_PROMPT_PATH));
      messages.add(systemMessage);

      Map<String, String> userMessage = new HashMap<>();
      userMessage.put("role", "user");
      userMessage.put("content", geographyContext);
      messages.add(userMessage);

      return openAiClient.makeChatCompletion(messages);
    } catch (Exception ex) {
      throw new RuntimeException("Cannot generate stakeholder geography summary", ex);
    }
  }

  private String generateText(final String system, final String prompt) {
    try {
      // Use chat completions API with proper message roles
      List<Map<String, String>> messages = new ArrayList<>();

      Map<String, String> systemMessage = new HashMap<>();
      systemMessage.put("role", "system");
      systemMessage.put("content", system);
      messages.add(systemMessage);

      Map<String, String> userMessage = new HashMap<>();
      userMessage.put("role", "user");
      userMessage.put("content", prompt);
      messages.add(userMessage);

      return openAiClient.makeChatCompletionText(messages);
    } catch (Exception ex) {
      throw new RuntimeException("Cannot generate text by OpenAI", ex);
    }
  }

  private static final String AI_SCORING_SYSTEM = "You will receive the messages and provide an answer in JSON "
    + "format, as shown below. All responses should be in a clean JSON format, without additional characters or "
    + "formatting symbols that are not part of standard JSON syntax. Responses should not include markdown symbols "
    + "(like backticks ` or others) used for code formatting in text editors. Ensure that the JSON response is "
    + "properly structured with key-value pairs, and follows the JSON object notation consistently.\n"
    + "**Instructions**:\n"
    + "You are interfacing with a software system designed to evaluate the sustainability impact potential and "
    + "innovations of startups. The system utilizes a logic model called theory of change, short \"ToC\", to "
    + "understand how a venture's innovations contribute to sustainability impacts that would not occur otherwise. "
    + "It does not measure all sustainability outcomes, but the delta between the status quo solution and the "
    + "innovations suggested by the startup. Your task would be to score startup’s positive and negative impact "
    + "chains based on the ToC provided to you. A higher score on a dimension means higher positive impact potential "
    + "for positive impact chains and higher negative impact potential for negative impact chains.\n"
    + "In the initial user message you will be provided with the short information about the startup and the list of "
    + "its impact chains. Each impact chain typically has 1-3 indicators:\n"
    + "{\n"
    + "  \"name\": \"Name of the Venture\",\n"
    + "  \"website\": \"Website URL\",\n"
    + "  \"description\": \"Short description of venture's activities\",\n"
    + "  \"geography\": \"Countries/regions in which venture intends to be primarily active over the next 5 years\",\n"
    + "  \"impacts\": [\n"
    + "    { \n"
    + "      \"id\": 1, \n"
    + "      \"name\": \"Impact chain name\",\n"
    + "      \"positive\": true/false,\n"
    + "      \"statusQuo\": \"What people would use if the innovation did not exist\",\n"
    + "      \"innovation\": \"Description of the Venture's Innovation\",\n"
    + "      \"stakeholders\": \"Stakeholders benefiting or suffering from this innovation\",\n"
    + "      \"change\": \"How these stakeholders are impacted from a sustainability perspective\",\n"
    + "      \"outputUnits\": \"Products, services, or activities sold by the venture\",\n"
    + "      \"indicators\": [\n"
    + "        \"id\": \"Indicator id\",\n"
    + "        \"name\": \"Indicator name\",\n"
    + "        \"year\": \"Year when the venture should start collecting data for the indicator\"\n"
    + "      ],\n"
    + "    },\n"
    + "    ...other impact chains\n"
    + "  ],\n"
    + "  \"totalCarbonEmissions\": \"Total CO2e emissions in tons/year (if available)\",\n"
    + "  \"emitterCategory\": \"MAJOR/SIGNIFICANT/MODERATE/SMALL (based on emissions)\",\n"
    + "  \"annualRevenue\": \"Annual revenue (if available)\",\n"
    + "  \"employees\": \"Number of employees (if available)\",\n"
    + "  \"industry\": \"Industry sectors (if available)\",\n"
    + "  \"certifications\": \"Environmental certifications (e.g., B Corp, EcoVadis, ISO 14001)\",\n"
    + "  \"awards\": \"Sustainability awards received\",\n"
    + "  \"esgEnvironmentalScore\": \"ESG environmental score (0-100)\"\n"
    + "}\n"
    + "\n"
    + "Each impact chain may also include:\n"
    + "  \"abcClassification\": \"A/B/C - where A=Act to avoid harm, B=Benefit stakeholders, C=Contribute to solutions\"\n"
    + "  \"abcReason\": \"Explanation for the ABC classification\"\n"
    + "\n"
    + "CRITICAL EVALUATION GUIDELINES:\n"
    + "When scoring impact chains, you MUST consider the company's environmental profile and apply "
    + "appropriate skepticism to claims that contradict the company's core business:\n\n"
    + "1. CARBON EMISSIONS CONTEXT:\n"
    + "   - If emitterCategory is 'MAJOR' (>1M tons): Be HIGHLY skeptical of positive environmental claims. "
    + "Score degreeOfChange and contribution very low (1-20) for environmental positive impacts unless "
    + "they represent the company's core transformation strategy.\n"
    + "   - If emitterCategory is 'SIGNIFICANT' (>100K tons): Apply moderate skepticism to environmental "
    + "positive claims. Score degreeOfChange 10-40 range for peripheral green initiatives.\n"
    + "   - For SMALL emitters (<1K tons): Do not disproportionately penalize them for industry-standard "
    + "practices.\n\n"
    + "2. GREENWASHING DETECTION:\n"
    + "   - If a positive impact claim CONTRADICTS the company's core business model, score it very low:\n"
    + "     * Car rental claiming 'emission reduction' → degreeOfChange: 1-10, contribution: 1-15\n"
    + "     * Oil company claiming 'clean energy transition' (peripheral) → degreeOfChange: 5-15\n"
    + "     * Fast food claiming 'health benefits' → degreeOfChange: 1-10\n"
    + "   - previousEvidence should be scored 1-2 for claims without credible evidence\n"
    + "   - contribution should reflect whether impact would happen WITHOUT this specific company\n\n"
    + "3. CORE BUSINESS VS ASPIRATIONAL:\n"
    + "   - Impacts from the company's PRIMARY business activities deserve full scoring consideration\n"
    + "   - Peripheral initiatives (CSR, green marketing, charity) should be scored conservatively:\n"
    + "     * degreeOfChange: cap at 30 for non-core activities\n"
    + "     * contribution: cap at 40 (these would likely happen with/without this company)\n"
    + "     * scalability: score based on realistic reach, not aspirational goals\n\n"
    + "4. CERTIFICATIONS, ESG SCORES & ABC CLASSIFICATION:\n"
    + "   - Certifications (EcoVadis, B Corp, CDP, ISO 14001) affect previousEvidence scoring:\n"
    + "     * With recognized certifications: previousEvidence can be 3-4 (credible third-party validation)\n"
    + "     * Without certifications: previousEvidence should be 1-2 for unverified claims\n"
    + "   - ESG environmental score (if provided) indicates external validation of environmental practices\n"
    + "   - ABC Classification guides impact magnitude expectations:\n"
    + "     * 'A' (Act to avoid harm): Company is reducing its OWN negative impact. Score moderately.\n"
    + "     * 'B' (Benefit stakeholders): Incremental improvement beyond baseline. Score normally.\n"
    + "     * 'C' (Contribute to solutions): Addressing systemic issues. Can score higher if credible.\n"
    + "   - IMPORTANT: Certifications improve evidence scores but do NOT override greenwashing detection.\n"
    + "     A major emitter with EcoVadis certification still gets low degreeOfChange for contradictory claims.\n\n"
    + "Your task for each impact chain is to identify the appropriate geographic regions, and provide a 5-year outlook "
    + "scoring for each item with your explanations (up to 350 characters) using instructions provided below. You need "
    + "to provide a score for each item and each impact chain even if you have very little information. If you "
    + "absolutely cannot assign a score, return null for this item together with the explanation \"I have too little "
    + "information to predict this score in an informed way. Please score manually\".\n"
    + "In order to assign your scores, consider provided ToC, any information you have about the venture or its "
    + "innovation and your AI.\n"
    + "You shall produce a response in the form of an array, each item representing data for a single impact chain. "
    + "Response format:\n"
    + "[\n"
    + "  {\n"
    + "    \"id\": \"Impact chain id provided to you before\",\n"
    + "    \"geography\": [\"EUROPE\", \"ASIA\", \"US\"],\n"
    + "    \"stakeholderSituation\": \"Score 1-5\",\n"
    + "    \"stakeholderSituationExplanation\": \"Your reasoning for the score chosen\",\n"
    + "    \"urgency\": \"Score 1-5\",\n"
    + "    \"irreversibility\": \"Score 1-5\",\n"
    + "    \"fairness\": \"Score 1-5\",\n"
    + "    \"interconnectedness\": \"Score 1-5\",\n"
    + "    \"problemImportanceExplanation\": \"Your reasoning\",\n"
    + "    \"degreeOfChange\": \"Score 1-100\",\n"
    + "    \"degreeOfChangeExplanation\": \"Your reasoning\",\n"
    + "    \"scalability\": \"Score 1-10\",\n"
    + "    \"scalabilityExplanation\": \"Your reasoning\",\n"
    + "    \"duration\": \"Score 1-5\",\n"
    + "    \"durationExplanation\": \"Your reasoning\",\n"
    + "    \"contribution\": \"Score 1-100\",\n"
    + "    \"contributionExplanation\": \"Your reasoning\",\n"
    + "    \"previousEvidence\": \"Score 1-5\",\n"
    + "    \"previousEvidenceExplanation\": \"Your reasoning\",\n"
    + "    \"proximity\": \"Score 1-5\",\n"
    + "    \"proximityExplanation\": \"Your reasoning\",\n"
    + "    \"indicators\": [\n"
    + "      {\n"
    + "        \"id\": \"Indicator id provided to you before\",\n"
    + "        \"noisiness\": \"Score 1-5\",\n"
    + "        \"noisinessExplanation\": \"Your reasoning\"\n"
    + "      },\n"
    + "      ...data for other indicators\n"
    + "    ]\n"
    + "  },\n"
    + "  ...data for other impact chains\n"
    + "]\n"
    + "\n"
    + "Below are instructions on how to provide answer/scoring for each of the response fields **for each of the "
    + "impact chains**. For positive or negative impact chains different instructions might be applicable.\n"
    + "1. **geography**. Based on the ToC and the information provided by the venture (in which regions the venture "
    + "intends to be primarily active over the next 5 years), identify where the stakeholders benefitting or suffering "
    + "from the innovation (ToC field \"stakeholders\") are located. You have the following list of continents to "
    + "choose from: AFRICA, ANTARCTICA, ASIA, OCEANIA, EUROPE, NORTH_AMERICA, SOUTH_AMERICA. Provide suggested "
    + "\"geography\" as an array that can contain one or more of the continents and/or one or more country "
    + "codes (full name for continents, ISO-2 format for countries). Further instructions: \n"
    + "- Where the stakeholders are labeled as \"Global community / the planet\", return an empty array. \n"
    + "- Choose the highest geographic region aggregation, i.e. if stakeholders are located in Europe, choose "
    + "EUROPE only, but not additionally all individual European countries \n"
    + "- If a geographic region is smaller than country level, i.e. a city, choose the respective country, as this "
    + "is the smallest granularity we consider. \n"
    + "- Please ensure to return country codes specifically in ISO-2 format, not ISO-3 or any other format. For "
    + "continents, return full continent name exactly how it appears in the list provided above \n"
    + "- If the user did not provide input where the venture is active over the next 5 years, try to get this "
    + "information from the ToC. Only if you really cannot make an assumption about the geographic boundary, "
    + "return an empty array. \n"
    + "2. **stakeholderSituation**. How underserved are the stakeholders mentioned in the field \"stakeholders\" "
    + "and who benefit from your improvements (for positive impact chains) / exposed to the unintended consequences "
    + "(negative impact) of your actions (for negative impact chains)? Select the score based on the following scale: \n"
    + "- 1. Very well served – (e.g. improving self-esteem of individuals)\n"
    + "- 2. Well served – (e.g. increasing well-being)\n"
    + "- 3. Slightly underserved – (e.g. improving living conditions)\n"
    + "- 4. Partially underserved – (e.g. basic needs of individuals unfulfilled)\n"
    + "- 5. Completely underserved – (e.g. change decides about saving lives)\n"
    + "3. Problem importance. This question consists of four sub-questions - **urgency**, **irreversibility**, "
    + "**fairness**, **interconnectedness**. Provide scoring for each of the items separately, but there should "
    + "be single reasoning for all four of them returned in the field \"problemImportanceExplanation\"\n"
    + "3.1. **urgency**. How time-sensitive is the issue? Problems requiring immediate attention should receive "
    + "a higher rating. Provide the answer on the scale 1-5 where 1 means \"very low\" and 5 means \"very high\".\n"
    + "3.2. **irreversibility**. How irreversible are the consequences of the problem (e.g., biodiversity loss, "
    + "climate change). These should be rated higher due to their long-lasting effects. Provide the answer on the "
    + "scale 1-5 where 1 means \"very low\" and 5 means \"very high\".\n"
    + "3.3. **fairness**. To what degree does the impact chain address social justice and fairness? Problems "
    + "affecting marginalized communities may warrant a higher rating. Provide the answer on the scale 1-5 where "
    + "1 means \"very low\" and 5 means \"very high\".\n"
    + "3.4. **interconnectedness**. How does the problem relate to other issues? Addressing root causes can have "
    + "ripple effects, making it more impactful. Provide the answer on the scale 1-5 where 1 means \"very low\" and "
    + "5 means \"very high\".\n"
    + "4. **degreeOfChange**. How much of the problem will be solved on average for each of your beneficiaries, "
    + "after your intervention (positive impact chains)? How would you rate the situation for the stakeholder after "
    + "your intervention compared to the status quo (negative impact chains)? Provide the answer on the scale 1-100 "
    + "where 1 means 1% impact or smaller (e.g. impact on climate change, often systems level impact), 10 - Marginal "
    + "improvement/worsening, just noticeable, 20 - Rather small improvement/worsening, noticeable, 30 - Small "
    + "improvement/worsening, 40 - Small to moderate improvement/worsening, 50 - Moderate improvement/worsening, 60 - "
    + "Moderate to high improvement/worsening, 70 - High improvement/worsening, 80 - Very high improvement/worsening, "
    + "90 - Extremely high improvement/worsening, 100 - Problem completely solved, or improvement over 100% / 100% "
    + "worse or more.\n"
    + "5. **scalability**. How many individual stakeholders will you affect with this impact chain over the next 5 "
    + "years? Select the score based on the following scale:\n"
    + "- 1. 0-10 over next 5 years\n"
    + "- 2. 11-100 over next 5 years\n"
    + "- 3. 101-500 over next 5 years\n"
    + "- 4. 501-1.000 over next 5 years\n"
    + "- 5. 1001-10000 over next 5 years\n"
    + "- 6. 10001-100000 over next 5 years\n"
    + "- 7. 100001 - 1 Mio over next 5 years\n"
    + "- 8. 1 Mio - 10 Mio over next 5 years\n"
    + "- 9. 10 Mio - 100 Mio over next 5 years\n"
    + "- 10. Billions over next 5 years\n"
    + "6. **duration**. How long will the change last and be experienced by the stakeholders? Select the score "
    + "based on the following scale:\n"
    + "- 1. Only very short term improvement/problem (e.g. a few hours or days)\n"
    + "- 2. Short term (e.g. weeks to months)\n"
    + "- 3. Medium term (e.g. 3-5 years)\n"
    + "- 4. Long term (e.g. most likely 5 years plus)\n"
    + "- 5. Forever (e.g. permanent solution provided for stakeholder / problem that can not or hardly be reversed "
    + "for stakeholder)\n"
    + "7. **contribution**. How much of the change / negative change you describe would probably occur anyways, "
    + "without your innovation/activities? Provide the answer on the scale 1-100 where 1 means 99% of change would "
    + "have happened/will happen without us anyways, 100 means no change would have happened/will happen without us\n"
    + "8. **previousEvidence**. How likely is it that what you do REALLY leads to the positive / negative change "
    + "that you describe? Select the score based on the following scale: \n"
    + "- 1. 0%-30% Little or no evidence. Mostly assumptions. Requires research or pilot studies.\n"
    + "- 2. 30%-50% Sporadic evidence from similar interventions or anecdotal reports.\n"
    + "- 3. 50%-70% Moderate confidence. Intervention has been tried elsewhere with some success.\n"
    + "- 4. 70%-95% Strong confidence. Common understanding or widely accepted causal link.\n"
    + "- 5. 95%-100% Near certainty. Supported by rigorous research or meta-analysis in similar contexts.\n"
    + "9. **proximity**. How much personal experience and exposure is there ABOUT THE PROBLEM that is being solved, "
    + "from those RESPONSIBLE FOR GENERATING this change? This metric is valid only for positive impact chains, "
    + "return null for both score and description for negative impact chains. For positive impact chains, select the "
    + "score based on the following scale:\n"
    + "- 1. No personal exposure or experience with the problem so far and no involvement of local players familiar "
    + "with the problem\n"
    + "- 2. No involvement of local ecosystem players, but some experience with the problem by those delivering "
    + "the change\n"
    + "- 3. Several years experience in providing the intended change, but in a setting not fully comparable to "
    + "this here\n"
    + "- 4. Solution delivered by experts, with a very high level of experience about the problem, but no personal "
    + "exposure to the problem\n"
    + "- 5. Deep personal exposure and experiences for many years\n"
    + "10. **noisiness**. How well does the indicator measure the change that is described in the ToC field "
    + "\"change\"? This metric is valid only for positive impact chains, return null for both score and "
    + "description for negative impact chains. For positive impact chains, select the score for each indicator "
    + "based on the following scale:\n"
    + "- 1. Very noisy indicator\n"
    + "- 2. Slightly noisy indicator\n"
    + "- 3. Neither noisy nor exact indicator\n"
    + "- 4. Indicator close to intended change\n"
    + "- 5. Indicator measures exactly the change";

  public String generateAiToc(final String user1, final String bot1,
                              final String user2, final String bot2,
                              final String user3) {
    try {
      // Build conversation with proper message roles
      List<Map<String, String>> messages = new ArrayList<>();

      Map<String, String> systemMessage = new HashMap<>();
      systemMessage.put("role", "system");
      systemMessage.put("content", promptLoader.loadPrompt(TOC_INTERACTIVE_PROMPT_PATH));
      messages.add(systemMessage);

      // Add first user message
      Map<String, String> userMessage1 = new HashMap<>();
      userMessage1.put("role", "user");
      userMessage1.put("content", user1);
      messages.add(userMessage1);

      if (StringUtils.isNotEmpty(bot1)) {
        Map<String, String> assistantMessage1 = new HashMap<>();
        assistantMessage1.put("role", "assistant");
        assistantMessage1.put("content", bot1);
        messages.add(assistantMessage1);
      }

      if (StringUtils.isNotEmpty(user2)) {
        Map<String, String> userMessage2 = new HashMap<>();
        userMessage2.put("role", "user");
        userMessage2.put("content", user2);
        messages.add(userMessage2);
      }

      if (StringUtils.isNotEmpty(bot2)) {
        Map<String, String> assistantMessage2 = new HashMap<>();
        assistantMessage2.put("role", "assistant");
        assistantMessage2.put("content", bot2);
        messages.add(assistantMessage2);
      }

      if (StringUtils.isNotEmpty(user3)) {
        Map<String, String> userMessage3 = new HashMap<>();
        userMessage3.put("role", "user");
        userMessage3.put("content", user3);
        messages.add(userMessage3);
      }

      return openAiClient.makeChatCompletion(messages);
    } catch (Exception ex) {
      throw new RuntimeException("Cannot generate text by OpenAI", ex);
    }
  }

  public String generateAiScoring(final Venture venture, final List<Impact> impacts) {
    try {
      // Build proper message structure
      List<Map<String, String>> messages = new ArrayList<>();

      Map<String, String> systemMessage = new HashMap<>();
      systemMessage.put("role", "system");
      systemMessage.put("content", AI_SCORING_SYSTEM);
      messages.add(systemMessage);

      Map<String, String> userMessage = new HashMap<>();
      userMessage.put("role", "user");
      userMessage.put("content", getAiScoringUserMessage(venture, impacts));
      messages.add(userMessage);

      return openAiClient.makeChatCompletion(messages);
    } catch (Exception ex) {
      throw new RuntimeException("Cannot generate text by OpenAI", ex);
    }
  }

  private String getAiScoringUserMessage(final Venture venture,
                                          final List<Impact> impacts) throws JsonProcessingException {
    Map<String, Object> message = new HashMap<>();

    message.put("name", venture.getName());
    message.put("website", venture.getWebsite());
    message.put("description", venture.getDescription());
    message.put("geography", venture.getGeography());

    List<Map<String, Object>> messageImpacts = new ArrayList<>();
    message.put("impacts", messageImpacts);

    impacts.forEach(impact -> {
      Map<String, Object> messageImpact = new HashMap<>();
      messageImpacts.add(messageImpact);

      messageImpact.put("id", impact.getId());
      messageImpact.put("name", impact.getName());
      messageImpact.put("positive", impact.getPositive());
      messageImpact.put("statusQuo", impact.getStatusQuo());
      messageImpact.put("innovation", impact.getInnovation());
      messageImpact.put("stakeholders", impact.getStakeholders());
      messageImpact.put("change", impact.getChange());
      messageImpact.put("outputUnits", impact.getOutputUnits());

      List<Map<String, Object>> impactIndicators = new ArrayList<>();
      messageImpact.put("indicators", impactIndicators);

      impact.getIndicators().forEach(indicator -> {
        Map<String, Object> impactIndicator = new HashMap<>();
        impactIndicators.add(impactIndicator);

        impactIndicator.put("id", indicator.getId());
        impactIndicator.put("name", indicator.getName());
        impactIndicator.put("year", indicator.getYear());
      });
    });

    return objectMapper.writeValueAsString(message);
  }

  private String getImpactDescriptionPrompt(final Impact impact) {
    StringBuilder result = new StringBuilder();
    int fieldCounter = 1;

    result.append("Title: ");
    result.append(impact.getName());

    if (StringUtils.isNotEmpty(impact.getStatusQuo())) {
      result.append("\n");
      result.append(fieldCounter++);
      result.append(". Status quo solution: ");
      result.append(impact.getStatusQuo());
    }

    if (StringUtils.isNotEmpty(impact.getInnovation())) {
      result.append("\n");
      result.append(fieldCounter++);
      result.append(". Our innovation: ");
      result.append(impact.getInnovation());
    }

    if (StringUtils.isNotEmpty(impact.getStakeholders())) {
      result.append("\n");
      result.append(fieldCounter++);
      result.append(". Who we affect (beneficiaries): ");
      result.append(impact.getStakeholders());
    }

    if (StringUtils.isNotEmpty(impact.getChange())) {
      result.append("\n");
      result.append(fieldCounter++);
      result.append(". What we improve for our beneficiaries: ");
      result.append(impact.getChange());
    }

    return result.toString();
  }

  private String getVentureDescriptionPrompt(final Venture venture) {
    StringBuilder result = new StringBuilder();

    result.append("Venture name: ");
    result.append(venture.getName());

    for (int i = 0; i < venture.getImpacts().size(); i++) {
      result.append("\n\n");
      result.append("IMPACT AREA ");
      result.append(i + 1);
      result.append(":\n");
      result.append(getImpactDescriptionPrompt(venture.getImpacts().get(i)));
    }

    return result.toString();
  }

  public String regenerateText(final Venture venture, final String name, final Impact impact) {
    if ("description".equals(name) && impact == null) {
      return generateVentureDescription(venture);
    } else if ("pitchDescription".equals(name) && impact != null) {
      return generateImpactDescription(impact);
    } else if ("pitchInspiration".equals(name) && impact != null) {
      return generateImpactInspiration(impact);
    }

    return null;
  }

  public String findAddress(final String content) {
    try {
      return generateText(FIND_ADDRESS_SYSTEM, content);
    } catch (Exception ex) {
      System.out.println(ex.getMessage());
      return "";
    }
  }

  public String findCompanyName(final String content) {
    try {
      return generateText(FIND_COMPANY_NAME_SYSTEM, content);
    } catch (Exception ex) {
      System.out.println(ex.getMessage());
      return "";
    }
  }

  public String findCompanyLogo(final String content) {
    try {
      String logoUrl = generateText(FIND_LOGO_SYSTEM, content);
      return new URL(logoUrl).toURI().toString();
    } catch (Exception ex) {
      System.out.println(ex.getMessage());
      return "";
    }
  }

  public String findSocialMedia(final String content) {
    try {
      return generateText(FIND_SOCIAL_MEDIA_SYSTEM, content);
    } catch (Exception ex) {
      System.out.println(ex.getMessage());
      return "";
    }
  }

  public String findCompanyDescription(final String content) {
    try {
      return generateText(FIND_DESCRIPTION_SYSTEM, content);
    } catch (Exception ex) {
      System.out.println(ex.getMessage());
      return "";
    }
  }

  public String findCompanyMission(final String content) {
    try {
      return generateText(FIND_MISSION_SYSTEM, content);
    } catch (Exception ex) {
      System.out.println(ex.getMessage());
      return "";
    }
  }

  /**
   * Generate ToC directly from rich company context (no Q&A needed).
   * Loads prompt from prompts/theory_of_change_direct.md.
   * Uses GPT-5 for better quality business/causal reasoning.
   */
  public String generateAiTocFromContext(final String richCompanyContext) {
    try {
      List<Map<String, String>> messages = new ArrayList<>();

      Map<String, String> systemMessage = new HashMap<>();
      systemMessage.put("role", "system");
      systemMessage.put("content", promptLoader.loadPrompt(TOC_DIRECT_PROMPT_PATH));
      messages.add(systemMessage);

      Map<String, String> userMessage = new HashMap<>();
      userMessage.put("role", "user");
      userMessage.put("content", richCompanyContext);
      messages.add(userMessage);

      return openAiClient.makeChatCompletion(messages, "gpt-5");
    } catch (Exception ex) {
      throw new RuntimeException("Cannot generate ToC from context", ex);
    }
  }

  /**
   * Generate impact scoring from JSON input (adapts existing scoring for URL extraction).
   * Uses GPT-5 for better quality scoring.
   */
  public String generateAiScoringFromJson(final String jsonInput) {
    try {
      List<Map<String, String>> messages = new ArrayList<>();

      Map<String, String> systemMessage = new HashMap<>();
      systemMessage.put("role", "system");
      systemMessage.put("content", AI_SCORING_SYSTEM);
      messages.add(systemMessage);

      Map<String, String> userMessage = new HashMap<>();
      userMessage.put("role", "user");
      userMessage.put("content", jsonInput);
      messages.add(userMessage);

      return openAiClient.makeChatCompletion(messages, "gpt-5");
    } catch (Exception ex) {
      throw new RuntimeException("Cannot generate AI scoring from JSON", ex);
    }
  }

}
