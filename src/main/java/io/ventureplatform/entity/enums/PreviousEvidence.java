package io.ventureplatform.entity.enums;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
@Getter
public enum PreviousEvidence implements ScoringIndicator, DeserializableEnum {
  ZERO_THIRTY("0%-30% We will first need to study this link and there is little evidence/research from "
    + "others using this type of intervention", "Likelihood 0%-30% [1/5]", 1d),
  THIRTY_FIFTY("30%-50% Some evidence from other organizations or existing research, but evidence is "
    + "sporadic and/or in a slightly different setting than ours", "Likelihood 30%-50% [2/5]", 2d),
  FIFTY_SEVENTY("50%-70% We are somewhat sure (e.g. intervention has been done by others or science/"
    + "research suggests that our actions might lead to our positive change)", "Likelihood 50%-70% [3/5]", 3d),
  SEVENTY_NINETY_FIVE("70%-95% Quite likely (e.g. there is a common understanding or existing research that "
    + "our interventions most likely lead to the positive change)", "Likelihood 70%-95% [4/5]", 4d),
  NINETY_FIVE_HUNDRED("95%-100% Certain. Our actions will lead to intended change. If relevant, existing "
    + "research has confirmed this link in very similar settings.", "Likelihood >95% [5/5]", 5d);

  private final String name;
  private final String type;
  private final String description;
  private final String shortName;
  private final Double score;

  PreviousEvidence(String description, String shortName, Double score) {
    this.name = this.name();
    this.type = this.getClass().getSimpleName();
    this.description = description;
    this.shortName = shortName;
    this.score = score;
  }
}
