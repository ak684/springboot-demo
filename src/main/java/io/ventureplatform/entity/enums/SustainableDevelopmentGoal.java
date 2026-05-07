package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.ventureplatform.util.EnumDeserializer;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@JsonDeserialize(using = EnumDeserializer.class)
@Getter
public enum SustainableDevelopmentGoal implements DeserializableEnum {
  POVERTY(
    "No Poverty",
    "Goal 1. End poverty in all its forms everywhere",
    "/images/sdg/1.svg",
    "Society",
    "#E5243B",
    1),
  HUNGER(
    "Zero Hunger",
    "Goal 2. End hunger, achieve food security and improved nutrition and promote sustainable agriculture",
    "/images/sdg/2.svg",
    "Society",
    "#DDA63A",
    2),
  HEALTH(
    "Good Health and Well-Being",
    "Goal 3. Ensure healthy lives and promote well-being for all at all ages",
    "/images/sdg/3.svg",
    "Society",
    "#4C9F38",
    3),
  EDUCATION(
    "Quality Education",
    "Goal 4. Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all",
    "/images/sdg/4.svg",
    "Society",
    "#C5192D",
    4),
  GENDER(
    "Gender Equality",
    "Goal 5. Achieve gender equality and empower all women and girls",
    "/images/sdg/5.svg",
    "Society",
    "#FF3A21",
    5),
  SANITATION(
    "Clean Water and Sanitation",
    "Goal 6. Ensure availability and sustainable management of water and sanitation for all",
    "/images/sdg/6.svg",
    "Biosphere",
    "#26BDE2",
    6),
  ENERGY(
    "Affordable and Clean Energy",
    "Goal 7. Ensure access to affordable, reliable, sustainable and modern energy for all",
    "/images/sdg/7.svg",
    "Society",
    "#FCC30B",
    7),
  GROWTH(
    "Decent Work and Economic Growth",
    "Goal 8. Promote sustained, inclusive and sustainable economic growth, full and productive employment "
      + "and decent work for all",
    "/images/sdg/8.svg",
    "Economy",
    "#A21942",
    8),
  INNOVATION(
    "Industry, Innovation and Infrastructure",
    "Goal 9. Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation",
    "/images/sdg/9.svg",
    "Economy",
    "#FD6925",
    9),
  INEQUALITY(
    "Reduced Inequalities",
    "Goal 10. Reduce inequality within and among countries",
    "/images/sdg/10.svg",
    "Economy",
    "#DD1367",
    10),
  CITIES(
    "Sustainable Cities and Communities",
    "Goal 11. Make cities and human settlements inclusive, safe, resilient and sustainable",
    "/images/sdg/11.svg",
    "Society",
    "#FD9D24",
    11),
  SUSTAINABILITY(
    "Responsible Consumption and Production",
    "Goal 12. Ensure sustainable consumption and production patterns",
    "/images/sdg/12.svg",
    "Economy",
    "#BF8B2E",
    12),
  CLIMATE(
    "Climate Action",
    "Goal 13. Take urgent action to combat climate change and its impacts",
    "/images/sdg/13.svg",
    "Biosphere",
    "#3F7E44",
    13),
  OCEANS(
    "Life below Water",
    "Goal 14. Conserve and sustainably use the oceans, seas and marine resources for sustainable development",
    "/images/sdg/14.svg",
    "Biosphere",
    "#0A97D9",
    14),
  BIODIVERSITY(
    "Life on Land",
    "Goal 15. Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage "
      + "forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss",
    "/images/sdg/15.svg",
    "Biosphere",
    "#56C02B",
    15),
  INSTITUTIONS(
    "Peace, Justice and Strong Institutions",
    "Goal 16. Promote peaceful and inclusive societies for sustainable development, provide access to "
      + "justice for all and build effective, accountable and inclusive institutions at all levels",
    "/images/sdg/16.svg",
    "Society",
    "#00689D",
    16),
  PARTNERSHIPS(
    "Partnerships for the Goals",
    "Goal 17. Strengthen the means of implementation and revitalize the Global Partnership for "
      + "Sustainable Development",
    "/images/sdg/17.svg",
    "Society",
    "#19486A",
    17);

  private final String name;
  private final String shortName;
  private final String description;
  private final String image;
  private final String category;
  private final String color;
  private final Integer number;
  private final String type;

  SustainableDevelopmentGoal(
    String shortName, String description, String image, String category, String color, Integer number
  ) {
    this.name = this.name();
    this.shortName = shortName;
    this.description = description;
    this.image = image;
    this.category = category;
    this.color = color;
    this.number = number;
    this.type = this.getClass().getSimpleName();
  }
}
