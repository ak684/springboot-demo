package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum IndustryGroup {
  ADMINISTRATIVE_SERVICES("Administrative Services"),
  ADVERTISING("Advertising"),
  AGRICULTURE_AND_FARMING("Agriculture and Farming"),
  APPS("Apps"),
  ARTIFICIAL_INTELLIGENCE("Artificial Intelligence"),
  BIOTECHNOLOGY("Biotechnology"),
  CLOTHING_AND_APPAREL("Clothing and Apparel"),
  COMMERCE_AND_SHOPPING("Commerce and Shopping"),
  COMMUNITY_AND_LIFESTYLE("Community and Lifestyle"),
  CONSUMER_ELECTRONICS("Consumer Electronics"),
  CONSUMER_GOODS("Consumer Goods"),
  CONTENT_AND_PUBLISHING("Content and Publishing"),
  DATA_AND_ANALYTICS("Data and Analytics"),
  DESIGN("Design"),
  EDUCATION("Education"),
  ENERGY("Energy"),
  EVENTS("Events"),
  FINANCIAL_SERVICES("Financial Services"),
  FOOD_AND_BEVERAGE("Food and Beverage"),
  GAMING("Gaming"),
  GOVERNMENT_AND_MILITARY("Government and Military"),
  HARDWARE("Hardware"),
  HEALTH_CARE("Health Care"),
  INFORMATION_TECHNOLOGY("Information Technology"),
  INTERNET_SERVICES("Internet Services"),
  LENDING_AND_INVESTMENTS("Lending and Investments"),
  MANUFACTURING("Manufacturing"),
  MEDIA_AND_ENTERTAINMENT("Media and Entertainment"),
  MESSAGING_AND_TELECOMMUNICATIONS("Messaging and Telecommunications"),
  MOBILE("Mobile"),
  MUSIC_AND_AUDIO("Music and Audio"),
  NATURAL_RESOURCES("Natural Resources"),
  NAVIGATION_AND_MAPPING("Navigation and Mapping"),
  OTHER("Other"),
  PAYMENTS("Payments"),
  PLATFORMS("Platforms"),
  PRIVACY_AND_SECURITY("Privacy and Security"),
  PROFESSIONAL_SERVICES("Professional Services"),
  REAL_ESTATE("Real Estate"),
  SALES_AND_MARKETING("Sales and Marketing"),
  SCIENCE_AND_ENGINEERING("Science and Engineering"),
  SOFTWARE("Software"),
  SPORTS("Sports"),
  SUSTAINABILITY("Sustainability"),
  TRANSPORTATION("Transportation"),
  TRAVEL_AND_TOURISM("Travel and Tourism"),
  VIDEO("Video");

  private final String name;
  private final String title;

  IndustryGroup(String title) {
    this.name = this.name();
    this.title = title;
  }
}
