package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum Proximity implements ScoringIndicator, DeserializableEnum {
  NO_PERSONAL_EXPOSURE("No personal exposure or experience with the problem so far and no involvement of "
    + "local players familiar with the problem", "No exposure or experience [1/5]", 1d),
  NO_INVOLVEMENT_LOCAL_ECOSYSTEMS("No involvement of local ecosystem players, but some experience with "
    + "the problem by those delivering the change", "Some problem experience [2/5]", 2d),
  SEVERAL_YEARS_EXPERIENCE("Several years experience in providing the intended change, but in setting not "
    + "fully comparable to this here", "Problem experience, other context [3/5]", 3d),
  SOLUTION_EXPERTS("Solution delivered by experts, with a very high level of experience about the problem"
    + ", but no personal exposure to the problem", "High problem experience [4/5]", 4d),
  DEEP_PERSONAL_EXPOSURE(
    "Deep personal exposure and experiences for many years",
    "Very high exposure & experience [5/5]",
    5d
  );

  private final String name;
  private final String type;
  private final String description;
  private final String shortName;
  private final Double score;

  Proximity(String description, String shortName, Double score) {
    this.shortName = shortName;
    this.type = this.getClass().getSimpleName();
    this.name = this.name();
    this.description = description;
    this.score = score;
  }
}
