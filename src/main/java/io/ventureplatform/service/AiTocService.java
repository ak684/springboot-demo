package io.ventureplatform.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.entity.AiScoringUsage;
import io.ventureplatform.entity.AiTocFeedback;
import io.ventureplatform.entity.AiTocUsage;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactScore;
import io.ventureplatform.entity.IndicatorScore;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.enums.Duration;
import io.ventureplatform.entity.enums.DurationNegative;
import io.ventureplatform.entity.enums.Geography;
import io.ventureplatform.entity.enums.IndicatorNoisiness;
import io.ventureplatform.entity.enums.IndicatorValidation;
import io.ventureplatform.entity.enums.PreviousEvidence;
import io.ventureplatform.entity.enums.PreviousEvidenceNegative;
import io.ventureplatform.entity.enums.ProblemImportance;
import io.ventureplatform.entity.enums.ProblemImportanceNegative;
import io.ventureplatform.entity.enums.Proximity;
import io.ventureplatform.entity.enums.SizeOfStakeholders;
import io.ventureplatform.entity.enums.SizeOfStakeholdersNegative;
import io.ventureplatform.entity.enums.StakeholderSituation;
import io.ventureplatform.entity.enums.StakeholderSituationNegative;
import io.ventureplatform.repository.AiScoringUsageRepository;
import io.ventureplatform.repository.AiTocFeedbackRepository;
import io.ventureplatform.repository.AiTocUsageRepository;
import io.ventureplatform.repository.ImpactRepository;
import io.ventureplatform.repository.ImpactScoreRepository;
import io.ventureplatform.service.external.ImpactAiService;
import io.ventureplatform.service.external.IpApiService;
import io.sentry.Sentry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.SortedMap;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiTocService extends AbstractBaseEntityService<AiTocFeedback> {
  private final AiTocFeedbackRepository feedbackRepository;
  private final AiTocUsageRepository usageRepository;
  private final IpApiService ipApiService;
  private final EmailService emailService;
  private final BrandResolver brandResolver;
  private final ImpactAiService impactAiService;
  private final ObjectMapper objectMapper;
  private final ImpactRepository impactRepository;
  private final ImpactScoreRepository impactScoreRepository;
  private final AiScoringUsageRepository aiScoringUsageRepository;
  @Value("${aitoc.stats.since:2024-06-01}")
  private String since;

  public void saveFeedback(AiTocFeedback feedback) {
    feedbackRepository.save(feedback);
    emailService.sendAiTocFeedbackEmail(feedback, brandResolver.forCurrentRequest());
  }

  public void saveUsage(HttpServletRequest request, String type, String result) {
    AiTocUsage usage = new AiTocUsage();
    usage
      .setIpAddress(getIpAddress(request))
      .setType(type)
      .setResult(result);
    try {
      ipApiService.populateAiTocUsage(usage);
    } catch (Exception ex) {
      log.error(ex.getMessage(), ex);
      Sentry.captureException(ex);
      // ignore exception
    }

    usageRepository.save(usage);
  }

  private String getIpAddress(HttpServletRequest request) {
    String result = null;

    if (request != null) {
      result = request.getHeader("X-FORWARDED-FOR");
      if (StringUtils.isEmpty(result)) {
        result = request.getRemoteAddr();
      }
    }

    return result;
  }

  private Date startOfDay() {
    Calendar calendar = Calendar.getInstance();
    calendar.set(Calendar.HOUR_OF_DAY, 0);
    calendar.set(Calendar.MINUTE, 0);
    calendar.set(Calendar.SECOND, 0);
    calendar.set(Calendar.MILLISECOND, 0);
    return calendar.getTime();
  }

  public Map<String, Object> getTocStats() {
    Map<String, Object> result = new HashMap<>();
    Date since = getSinceDate();
    result.put("today", usageRepository.countToday());
    result.put("all", usageRepository.countSince(since));
    result.put("rating", feedbackRepository.findAverageRating());
    result.put("ratingTotal", feedbackRepository.countAllByRatingIsNotNull());
    LocalDate now = since.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    result.put("since", formatLocalDateWithOrdinal(now));
    return result;
  }

  public Map<Long, String> getTocCountryStats() {
    List<Object[]> results = usageRepository.countRecordsByCountry();
    SortedMap<Long, String> countryCounts = new TreeMap<>();
    for (Object[] result : results) {
      String country = (String) result[0];
      Long count = (Long) result[1];
      countryCounts.put(count, country);
    }
    return countryCounts;
  }

  public String getTocData1(HashMap<String, String> data) throws IOException {
    String user1 = objectMapper.writeValueAsString(data);
    return impactAiService.generateAiToc(user1, null, null, null, null);
  }

  private String getAnswerOrDefaultMessage(HashMap<String, Object> data, String answerKey) {
    String answer = data.get(answerKey).toString();
    if (StringUtils.isBlank(answer)) {
      return "Please use all information you have and your AI to answer this question";
    } else {
      return answer;
    }
  }

  public String getTocData2(HashMap<String, Object> data) throws IOException {
    Map<String, Object> user1 = new HashMap<>() {
      {
        put("name", data.get("name"));
        put("website", data.get("website"));
        put("activities", data.get("activities"));
      }
    };
    String user1Text = objectMapper.writeValueAsString(user1);

    String bot1 = objectMapper.writeValueAsString(data.get("questions"));

    Map<String, Object> user2 = new HashMap<>() {
      {
        put("answer1", getAnswerOrDefaultMessage(data, "answer1"));
        put("answer2", getAnswerOrDefaultMessage(data, "answer2"));
        put("answer3", getAnswerOrDefaultMessage(data, "answer3"));
      }
    };
    String user2Text = objectMapper.writeValueAsString(user2);

    return impactAiService.generateAiToc(user1Text, bot1, user2Text, null, null);
  }

  // toDO: Move common logic from methods 2 and 3 to a separate method
  public String getTocData3(HashMap<String, Object> data) throws IOException {
    Map<String, Object> user1 = new HashMap<>() {
      {
        put("name", data.get("name"));
        put("website", data.get("website"));
        put("activities", data.get("activities"));
      }
    };
    String user1Text = objectMapper.writeValueAsString(user1);

    String bot1 = objectMapper.writeValueAsString(data.get("questions"));

    Map<String, Object> user2 = new HashMap<>() {
      {
        put("answer1", getAnswerOrDefaultMessage(data, "answer1"));
        put("answer2", getAnswerOrDefaultMessage(data, "answer2"));
        put("answer3", getAnswerOrDefaultMessage(data, "answer3"));
      }
    };
    String user2Text = objectMapper.writeValueAsString(user2);

    String bot2 = objectMapper.writeValueAsString(data.get("toc"));

    Map<String, Object> user3 = new HashMap<>() {
      {
        put("instructions", data.get("instructions"));
      }
    };
    String user3Text = objectMapper.writeValueAsString(user3);

    return impactAiService.generateAiToc(user1Text, bot1, user2Text, bot2, user3Text);
  }

  @Transactional
  public void aiScoreImpacts(Venture venture, Set<Impact> impacts) {
    List<Impact> ventureImpacts = venture.getImpacts().stream()
      .filter(impact -> impacts.stream().anyMatch(i -> i.getId().equals(impact.getId())))
      .toList();

    String aiScoringResponse = impactAiService.generateAiScoring(venture, ventureImpacts);
    aiScoringUsageRepository.save(new AiScoringUsage().setResult(aiScoringResponse));

    try {
      List<Map<String, Object>> result = objectMapper.readValue(
        aiScoringResponse,
        new TypeReference<>() {
        }
      );
      result.forEach(scoredImpact -> {
        ventureImpacts.stream()
          .filter(vi -> scoredImpact.get("id").equals(vi.getId().intValue()))
          .findFirst()
          .ifPresent(impact -> {
            ImpactScore score = new ImpactScore().setImpact(impact);

            try {
              if (scoredImpact.get("geography") instanceof List) {
                List<String> geographyList = (ArrayList) scoredImpact.get("geography");
                if (!geographyList.isEmpty()) {
                  impact.getGeography().clear();
                  geographyList.forEach(g -> {
                    if (getGeographyValue(g) != null) {
                      impact.getGeography().add(Geography.valueOf(g));
                    } else {
                      Arrays.stream(Geography.values())
                        .filter(r -> r.getCode() != null && r.getCode().equals(g))
                        .findFirst()
                        .ifPresent(impact.getGeography()::add);
                    }
                  });
                  if (!impact.getGeography().isEmpty()) {
                    impactRepository.save(impact);
                  }
                }
              }
            } catch (Exception ex) {
              // ignore exception if only geography attribution failed
            }

            Object stakeholderSituation = scoredImpact.get("stakeholderSituation");
            Object stakeholderSituationExplanation = scoredImpact.get("stakeholderSituationExplanation");

            if (stakeholderSituation instanceof Integer && getInteger(stakeholderSituation) >= 1) {
              if (impact.getPositive()) {
                score.setStakeholderSituation(StakeholderSituation.values()[getInteger(stakeholderSituation) - 1]);
              } else {
                score.setStakeholderSituationNegative(
                  StakeholderSituationNegative.values()[getInteger(stakeholderSituation) - 1]
                );
              }
              score.setStakeholderSituationExplanation(getString(stakeholderSituationExplanation));
            }

            Object urgency = scoredImpact.get("urgency");
            Object irreversibility = scoredImpact.get("irreversibility");
            Object fairness = scoredImpact.get("fairness");
            Object interconnectedness = scoredImpact.get("interconnectedness");
            Object problemImportanceExplanation = scoredImpact.get("problemImportanceExplanation");

            if (
              urgency instanceof Integer && getInteger(urgency) >= 1
                && irreversibility instanceof Integer && getInteger(irreversibility) >= 1
                && fairness instanceof Integer && getInteger(fairness) >= 1
                && interconnectedness instanceof Integer && getInteger(interconnectedness) >= 1
            ) {
              int averageScore = (int) Math.round(
                (
                  getInteger(urgency)
                    + getInteger(irreversibility)
                    + getInteger(fairness)
                    + getInteger(interconnectedness)
                ) * 1.0d / 4
              );

              if (impact.getPositive()) {
                score.setProblemImportance(ProblemImportance.values()[averageScore - 1]);
              } else {
                score.setProblemImportanceNegative(
                  ProblemImportanceNegative.values()[averageScore - 1]
                );
              }
              score.setProblemImportanceExplanation(getString(problemImportanceExplanation));
            }


            Object degreeOfChange = scoredImpact.get("degreeOfChange");
            Object degreeOfChangeExplanation = scoredImpact.get("degreeOfChangeExplanation");

            if (degreeOfChange instanceof Integer && getInteger(degreeOfChange) >= 1) {
              score.setDegreeOfChange(getInteger(degreeOfChange));
              score.setDegreeOfChangeExplanation(getString(degreeOfChangeExplanation));
            }

            Object scalability = scoredImpact.get("scalability");
            Object scalabilityExplanation = scoredImpact.get("scalabilityExplanation");

            if (scalability instanceof Integer && getInteger(scalability) >= 1) {
              if (impact.getPositive()) {
                score.setSizeOfStakeholders(SizeOfStakeholders.values()[getInteger(scalability) - 1]);
              } else {
                score.setSizeOfStakeholdersNegative(SizeOfStakeholdersNegative.values()[getInteger(scalability) - 1]);
              }
              score.setSizeOfStakeholdersExplanation(getString(scalabilityExplanation));
            }

            Object duration = scoredImpact.get("duration");
            Object durationExplanation = scoredImpact.get("durationExplanation");

            if (duration instanceof Integer && getInteger(duration) >= 1) {
              if (impact.getPositive()) {
                score.setDuration(Duration.values()[getInteger(duration) - 1]);
              } else {
                score.setDurationNegative(DurationNegative.values()[getInteger(duration) - 1]);
              }
              score.setDurationExplanation(getString(durationExplanation));
            }

            Object contribution = scoredImpact.get("contribution");
            Object contributionExplanation = scoredImpact.get("contributionExplanation");

            if (contribution instanceof Integer && getInteger(contribution) >= 1) {
              score.setContribution(getInteger(contribution));
              score.setContributionExplanation(getString(contributionExplanation));
            }

            Object previousEvidence = scoredImpact.get("previousEvidence");
            Object previousEvidenceExplanation = scoredImpact.get("previousEvidenceExplanation");

            if (previousEvidence instanceof Integer && getInteger(previousEvidence) >= 1) {
              if (impact.getPositive()) {
                score.setPreviousEvidence(PreviousEvidence.values()[getInteger(previousEvidence) - 1]);
              } else {
                score.setPreviousEvidenceNegative(PreviousEvidenceNegative.values()[getInteger(previousEvidence) - 1]);
              }
              score.setPreviousEvidenceExplanation(getString(previousEvidenceExplanation));
            }

            Object proximity = scoredImpact.get("proximity");
            Object proximityExplanation = scoredImpact.get("proximityExplanation");

            if (proximity instanceof Integer && getInteger(proximity) >= 1) {
              score.setProximity(Proximity.values()[getInteger(proximity) - 1]);
              score.setProximityExplanation(getString(proximityExplanation));
            }

            try {
              if (scoredImpact.get("indicators") instanceof List) {
                List<Map<String, Object>> scoredIndicators = (ArrayList) scoredImpact.get("indicators");
                scoredIndicators.forEach(scoredIndicator -> {
                  Object indicatorId = scoredIndicator.get("id");
                  impact.getIndicators().stream()
                    .filter(i -> indicatorId.equals(i.getId().intValue()))
                    .findFirst()
                    .ifPresent(indicator -> {
                      IndicatorScore indicatorScore = new IndicatorScore()
                        .setImpactScore(score)
                        .setIndicator(indicator);

                      Object noisiness = scoredIndicator.get("noisiness");
                      Object noisinessExplanation = scoredIndicator.get("noisinessExplanation");

                      if (noisiness instanceof Integer && getInteger(noisiness) >= 1) {
                        indicatorScore.setNoisiness(IndicatorNoisiness.values()[getInteger(noisiness) - 1]);
                        indicatorScore.setNoisinessExplanation(getString(noisinessExplanation));
                      }

                      indicatorScore.setValidation(IndicatorValidation.values()[0]);
                      indicatorScore.setValidationExplanation(
                        "I do not yet have knowledge about the quality of your measurement and therefore rate it "
                          + "as 1. Please increase this score when appropriate manually to the correct score"
                      );

                      score.getIndicatorScores().add(indicatorScore);
                    });
                });
              }
            } catch (Exception ex) {
              // ignore exception if only indicators scoring failed
            }

            impactScoreRepository.save(score);
          });
      });
    } catch (Exception ex) {
      throw new RuntimeException("Something went wrong during the AI scoring process", ex);
    }
  }

  private Integer getInteger(Object value) {
    if (value instanceof Integer) {
      return (int) value;
    } else {
      return null;
    }
  }

  private String getString(Object value) {
    if (value instanceof String) {
      return (String) value;
    } else {
      return null;
    }
  }

  private Geography getGeographyValue(String value) {
    for (Geography geography : Geography.values()) {
      if (value.equals(geography.getName())) {
        return geography;
      }
    }
    return null;
  }


  public Map<String, Object> getDailyStats() {
    Map<String, Object> response = new HashMap<>();
    Date since = getSinceDate();
    LocalDate now = since.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    response.put("since", formatLocalDateWithOrdinal(now));
    log.info("Generating Daily stats since {} ",since);

    List<Object[]> dailyUsageCount = usageRepository.getDailyUsageCount(since);

    log.info("returned {} entries", dailyUsageCount.size());
    Map<String, Long> data = new TreeMap<>();
    dailyUsageCount.stream().forEach(us -> {
      data.put((String) us[0], (Long) us[1]);
    });
    response.put("data", data);
    return response;
  }

  public static String formatLocalDateWithOrdinal(LocalDate date) {
    // Format the month
    DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMMM", Locale.ENGLISH);
    String month = date.format(monthFormatter);

    // Get the day of the month with the appropriate ordinal suffix
    int dayOfMonth = date.getDayOfMonth();
    String dayWithSuffix = dayOfMonth + getOrdinalSuffix(dayOfMonth);

    // Combine month and day
    return month + " " + dayWithSuffix;
  }

  private static String getOrdinalSuffix(int day) {
    if (day >= 11 && day <= 13) {
      return "th";
    }
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  public Map<String, Object> getDailyRaceStats() {
    Map<String, Object> response = new HashMap<>();

    Date since = getSinceDate();
    LocalDate now = since.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    response.put("since", formatLocalDateWithOrdinal(now));
    log.info("Generating daily race stats since {} ",since);

    List<Object[]> dailyRaceUsageCount = usageRepository.getDailyRaceUsageCount(since);
    Map<String, Map<String, Long>> accumulator = new HashMap<>();
    dailyRaceUsageCount.stream().forEach(el -> {
      String date = (String) el[0];
      if (!accumulator.containsKey(date)) {
        accumulator.put(date, new HashMap<>());
      }
      if (el[2] != null && el[1] != null) {
        accumulator.get(date).put((String) el[2], (Long) el[1]);
      }
    });
    Collection<Map<String, Long>> data = accumulator.values();
    response.put("data", data);

    return response;
  }

  public Date getSinceDate() {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
    try {
      return sdf.parse(since);
    } catch (ParseException e) {
      log.error("Impossible to parse ${}, using defaults.", since);
      try {
        return sdf.parse("2024-06-01");
      } catch (ParseException ex) {
        log.error("Impossible to parse!!!, ");
      }
    }
    return null;
  }
}
