package io.ventureplatform.constant;

import java.util.Arrays;
import java.util.List;

/**
 * Constants for ESG standardized topics based on SASB framework.
 * These are used for mapping personalized ESG topics to standard categories.
 */
public final class EsgStandardizedTopics {

  private EsgStandardizedTopics() {
    // Prevent instantiation
  }

  /**
   * Environmental standardized topics.
   */
  public static final List<String> ENVIRONMENTAL_TOPICS = Arrays.asList(
      "GHG Emissions",
      "Energy Management",
      "Water & Wastewater Management",
      "Waste & Hazardous Materials Management",
      "Ecological Impacts",
      "Air Quality",
      "Physical Impacts of Climate Change"
  );

  /**
   * Social standardized topics.
   */
  public static final List<String> SOCIAL_TOPICS = Arrays.asList(
      "Employee Health & Safety",
      "Employee Engagement, Diversity & Inclusion",
      "Labor Practices",
      "Human Rights & Community Relations",
      "Customer Privacy",
      "Customer Welfare",
      "Product Quality & Safety",
      "Selling Practices & Product Labeling",
      "Access & Affordability",
      "Data Security"
  );

  /**
   * Governance standardized topics.
   */
  public static final List<String> GOVERNANCE_TOPICS = Arrays.asList(
      "Business Ethics",
      "Competitive Behavior",
      "Management of the Legal & Regulatory Environment",
      "Critical Incident Risk Management",
      "Systemic Risk Management",
      "Supply Chain Management",
      "Materials Sourcing & Efficiency",
      "Product Design & Lifecycle Management",
      "Business Model Resilience"
  );

  /**
   * Get formatted string for prompt inclusion.
   * @return Formatted string with all standardized ESG topics
   */
  public static String getFormattedTopicsForPrompt() {
    StringBuilder sb = new StringBuilder();
    sb.append("STANDARDIZED ESG TOPICS (for mapping):\n");
    sb.append("Environmental Topics:\n");
    for (String topic : ENVIRONMENTAL_TOPICS) {
      sb.append("- ").append(topic).append("\n");
    }
    sb.append("\n");

    sb.append("Social Topics:\n");
    for (String topic : SOCIAL_TOPICS) {
      sb.append("- ").append(topic).append("\n");
    }
    sb.append("\n");

    sb.append("Governance Topics:\n");
    for (String topic : GOVERNANCE_TOPICS) {
      sb.append("- ").append(topic).append("\n");
    }
    sb.append("\n");

    return sb.toString();
  }
}
