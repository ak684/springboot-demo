package io.ventureplatform.service;

import io.ventureplatform.dto.request.ImpactIndicatorRequest;
import io.ventureplatform.dto.request.ImpactScoreRequest;
import io.ventureplatform.dto.request.UpdateImpactFieldRequest;
import io.ventureplatform.dto.response.ImpactAutofill;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactGoal;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.ImpactScore;
import io.ventureplatform.entity.IndicatorQuantificationData;
import io.ventureplatform.entity.QuantificationData;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.enums.Geography;
import io.ventureplatform.entity.enums.SustainableDevelopmentGoal;
import io.ventureplatform.repository.ImpactIndicatorRepository;
import io.ventureplatform.repository.IndicatorQuantificationDataRepository;
import io.ventureplatform.repository.IndicatorScoreRepository;
import io.ventureplatform.repository.NoteFileRepository;
import io.ventureplatform.repository.NoteLinkRepository;
import io.ventureplatform.repository.NoteRepository;
import io.ventureplatform.repository.QuantificationDataRepository;
import io.jsonwebtoken.lang.Collections;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.PropertyAccessorFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.util.StringUtils;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static io.ventureplatform.constant.AppConstants.GLOBAL_COMMUNITY_INPUT;

@Service
@RequiredArgsConstructor
public class ImpactService extends AbstractBaseEntityService<Impact> {
  private final ImpactIndicatorRepository indicatorRepository;
  private final ImpactScoreService impactScoreService;
  private final IndicatorScoreRepository indicatorScoreRepository;
  private final QuantificationDataRepository quantificationDataRepository;
  private final IndicatorQuantificationDataRepository indicatorQuantificationDataRepository;
  private final NoteRepository noteRepository;
  private final NoteLinkRepository noteLinkRepository;
  private final NoteFileRepository noteFileRepository;

  public Impact createImpact(Venture venture, Impact impact) {
    impact.setVenture(venture);
    impact.setSortOrder(venture.getImpacts().size());
    impact.setPitchOrder(venture.getImpacts().size());
    impact.setPublicOrder(venture.getImpacts().size() * 1.0);

    impact.getIndicators().forEach(i -> i.setImpact(impact));
    for (int i = 0; i < impact.getIndicators().size(); i++) {
      ImpactIndicator indicator = impact.getIndicators().get(i);
      indicator.setImpact(impact);
      indicator.setPitchOrder(i);
      indicator.setPublicOrder(i * 1.0);
    }
    impact.getIndicators().forEach(i -> i.setImpact(impact));

    return super.create(impact);
  }

  public void createBulkImpacts(Venture venture, List<Map<String, Object>> request) {
    for (int i = 0; i < request.size(); i++) {
      Map<String, Object> impactData = request.get(i);

      Impact impact = new Impact();
      impact.setVenture(venture);

      Object positiveValue = impactData.get("type");
      if (positiveValue instanceof String && positiveValue.toString().toLowerCase().contains("negative")) {
        impact.setPositive(false);
      } else {
        impact.setPositive(true);
      }

      impact.setName(getMaxString(impactData.get("title"), 60));
      impact.setStatusQuo(getMaxString(impactData.get("statusQuo"), 100));
      impact.setInnovation(getMaxString(impactData.get("innovation"), 100));
      impact.setStakeholders(getMaxString(impactData.get("stakeholders"), 100));
      impact.setChange(getMaxString(impactData.get("change"), 100));
      impact.setOutputUnits(getMaxString(impactData.get("outputUnits"), 100));

      Object indicatorsData = impactData.get("indicators");
      if (indicatorsData instanceof List) {
        List<Map<String, Object>> indicators = (ArrayList) (indicatorsData);
        for (int j = 0; j < indicators.size(); j++) {
          Map<String, Object> indicatorData = indicators.get(j);
          String name = indicatorData.get("name") != null ? indicatorData.get("name").toString() : null;
          if (!StringUtils.isEmpty(name)) {
            ImpactIndicator indicator = new ImpactIndicator();
            indicator.setImpact(impact);
            indicator.setPitchOrder(j);
            indicator.setPublicOrder(j * 1.0);
            indicator.setName(getMaxString(name, 100));

            String year = indicatorData.get("year") != null ? indicatorData.get("year").toString() : null;
            if (StringUtils.isEmpty(year)) {
              indicator.setYear(Calendar.getInstance().get(Calendar.YEAR));
            } else {
              indicator.setYear(Integer.parseInt(year));
            }

            impact.getIndicators().add(indicator);
          }
        }
      }

      try {
        Object sdgsData = impactData.get("sdgs");
        if (sdgsData instanceof List) {
          List<Map<String, Object>> goals = (ArrayList) (sdgsData);
          for (Map<String, Object> goalData : goals) {
            if (goalData.get("number") != null) {
              int number = Integer.parseInt(goalData.get("number").toString());
              SustainableDevelopmentGoal sdg = SustainableDevelopmentGoal.values()[number - 1];
              int rate = Integer.parseInt(goalData.get("percent").toString());
              ImpactGoal goal = new ImpactGoal()
                .setGoal(sdg)
                .setRate(rate)
                .setImpact(impact);
              impact.getGoals().add(goal);
            }
          }
        }
      } catch (Exception ex) {
        // continue import
      }

      impact.setSortOrder(venture.getImpacts().size() + i);
      impact.setPitchOrder(venture.getImpacts().size() + i);
      impact.setPublicOrder((venture.getImpacts().size() + i) * 1.0);

      super.create(impact);
    }
  }

  private String getMaxString(Object source, Integer max) {
    try {
      return source.toString().substring(0, Math.min(source.toString().length(), max));
    } catch (Exception ex) {
      return "";
    }
  }

  public Impact updateField(Impact impact, UpdateImpactFieldRequest request) {
    if ("indicators".equals(request.getField())) {
      Optional<ImpactIndicator> optIndicator = impact.getIndicators().stream()
        .filter(i -> i.getId().equals(request.getIndicatorId()))
        .findFirst();
      if (optIndicator.isPresent()) {
        ImpactIndicator indicator = optIndicator.get();
        indicator.setName(request.getValue());
      }
    } else {
      BeanWrapper wrapper = PropertyAccessorFactory.forBeanPropertyAccess(impact);
      wrapper.setPropertyValue(request.getField(), request.getValue());
    }
    return super.update(impact.getId(), impact);
  }

  public Impact toggleImpactDraft(Impact impact, Boolean draft) {
    impact.setDraft(draft);
    return super.update(impact.getId(), impact);
  }

  public Impact editImpact(Impact impact, Impact request) {
    impact
      .setName(request.getName())
      .setStatusQuo(request.getStatusQuo())
      .setInnovation(request.getInnovation())
      .setStakeholders(request.getStakeholders())
      .setChange(request.getChange())
      .setOutputUnits(request.getOutputUnits())
      .setPositive(request.getPositive());

    Set<ImpactIndicator> deletedIndicators = impact.getIndicators().stream()
      .filter(i -> request.getIndicators().stream().filter(ri -> i.getId().equals(ri.getId())).findFirst().isEmpty())
      .collect(Collectors.toSet());
    indicatorRepository.deleteAll(deletedIndicators);

    impact.setIndicators(request.getIndicators());
    impact.getIndicators().forEach(i -> i.setImpact(impact));

    if (GLOBAL_COMMUNITY_INPUT.equals(request.getStakeholders())) {
      impact.getGeography().clear();
      impact.getGeography().add(Geography.GLOBAL);
      impact.getGeographyCustom().clear();
    }

    return super.update(impact.getId(), impact);
  }

  @Transactional
  public Impact quantifyImpact(Impact impact, Impact request) {
    Set<QuantificationData> deletedProductsData = impact.getProductsData().stream()
      .filter(i -> request.getProductsData().stream().filter(ri -> i.getId().equals(ri.getId())).findFirst().isEmpty())
      .collect(Collectors.toSet());
    quantificationDataRepository.deleteAll(deletedProductsData);
    Set<QuantificationData> deletedProductsDataActual = impact.getProductsDataActual().stream()
      .filter(i -> request.getProductsDataActual().stream().filter(ri -> i.getId().equals(ri.getId())).findFirst().isEmpty())
      .collect(Collectors.toSet());
    quantificationDataRepository.deleteAll(deletedProductsDataActual);
    Set<QuantificationData> deletedStakeholdersData = impact.getStakeholdersData().stream()
      .filter(i -> request.getStakeholdersData().stream().filter(ri -> i.getId().equals(ri.getId())).findFirst().isEmpty())
      .collect(Collectors.toSet());
    quantificationDataRepository.deleteAll(deletedStakeholdersData);
    Set<QuantificationData> deletedStakeholdersDataActual = impact.getStakeholdersDataActual().stream()
      .filter(i -> request.getStakeholdersDataActual().stream()
        .filter(ri -> i.getId().equals(ri.getId())).findFirst().isEmpty())
      .collect(Collectors.toSet());
    quantificationDataRepository.deleteAll(deletedStakeholdersDataActual);

    impact.setProductsData(request.getProductsData());
    impact.setProductsDataActual(request.getProductsDataActual());
    impact.setStakeholdersData(request.getStakeholdersData());
    impact.setStakeholdersDataActual(request.getStakeholdersDataActual());
    impact.setImpactCalculationTotal(request.getImpactCalculationTotal());

    if (!impact.getProductsData().isEmpty()) {
      impact.getProductsData().forEach(data -> data.setImpact(impact));
      impact.setProductsData(quantificationDataRepository.saveAll(impact.getProductsData()));
    }

    if (!impact.getProductsDataActual().isEmpty()) {
      impact.getProductsDataActual().forEach(data -> data.setImpact(impact));
      impact.setProductsDataActual(quantificationDataRepository.saveAll(impact.getProductsDataActual()));
    }

    if (!impact.getStakeholdersData().isEmpty()) {
      impact.getStakeholdersData().forEach(data -> data.setImpact(impact));
      impact.setStakeholdersData(quantificationDataRepository.saveAll(impact.getStakeholdersData()));
    }

    if (!impact.getStakeholdersDataActual().isEmpty()) {
      impact.getStakeholdersDataActual().forEach(data -> data.setImpact(impact));
      impact.setStakeholdersDataActual(quantificationDataRepository.saveAll(impact.getStakeholdersDataActual()));
    }

    impact.getIndicators().forEach(indicator -> {
      request.getIndicators().stream().filter(ri -> ri.getId().equals(indicator.getId())).findFirst()
        .ifPresent(requestIndicator -> {
          Set<IndicatorQuantificationData> deletedPre = indicator.getPre().stream()
            .filter(pre -> requestIndicator.getPre().stream().filter(riPre -> pre.getId().equals(riPre.getId()))
              .findFirst().isEmpty())
            .collect(Collectors.toSet());
          indicatorQuantificationDataRepository.deleteAll(deletedPre);
          Set<IndicatorQuantificationData> deletedPost = indicator.getPost().stream()
            .filter(post -> requestIndicator.getPost().stream().filter(riPost -> post.getId().equals(riPost.getId()))
              .findFirst().isEmpty())
            .collect(Collectors.toSet());
          indicatorQuantificationDataRepository.deleteAll(deletedPost);
          Set<QuantificationData> deletedPreActual = indicator.getPreActual().stream()
            .filter(pre -> requestIndicator.getPreActual().stream().filter(riPre -> pre.getId().equals(riPre.getId()))
              .findFirst().isEmpty())
            .collect(Collectors.toSet());
          quantificationDataRepository.deleteAll(deletedPreActual);
          Set<QuantificationData> deletedPostActual = indicator.getPostActual().stream()
            .filter(post -> requestIndicator.getPostActual().stream().filter(riPost ->
              post.getId().equals(riPost.getId())).findFirst().isEmpty())
            .collect(Collectors.toSet());
          quantificationDataRepository.deleteAll(deletedPostActual);
        });
    });

    impact.setIndicators(request.getIndicators());
    impact.getIndicators().forEach(i -> i.setImpact(impact));

    impact.getIndicators().forEach(indicator -> {
      indicator.getPre().forEach(pre -> pre.setIndicator(indicator));
      indicator.getPreActual().forEach(pre -> pre.setIndicator(indicator));
      indicator.getPost().forEach(post -> post.setIndicator(indicator));
      indicator.getPostActual().forEach(post -> post.setIndicator(indicator));
      indicator.setPre(indicatorQuantificationDataRepository.saveAll(indicator.getPre()));
      indicator.setPost(indicatorQuantificationDataRepository.saveAll(indicator.getPost()));
      indicator.setPreActual(quantificationDataRepository.saveAll(indicator.getPreActual()));
      indicator.setPostActual(quantificationDataRepository.saveAll(indicator.getPostActual()));
    });

    return super.update(impact.getId(), impact);
  }

  public Impact addIndicator(Impact impact, ImpactIndicator indicator) {
    indicator.setImpact(impact);
    indicator.setPitchOrder(impact.getIndicators().size());
    indicator.setPublicOrder(impact.getIndicators().size() * 1.0);
    impact.getIndicators().add(indicator);
    return super.update(impact.getId(), impact);
  }

  public Impact scoreImpact(Impact impact, ImpactScore impactScore, ImpactScoreRequest request) {
    if (!Collections.isEmpty(impact.getScoring())
      && isLessThanOneDayOld(impact.getScoring().get(impact.getScoring().size() - 1).getCreatedAt())
    ) {
      ImpactScore existingScore = impact.getScoring().get(impact.getScoring().size() - 1);
      BeanUtils.copyProperties(impactScore, existingScore, "id", "impact", "indicatorScores");

      existingScore.getIndicatorScores().forEach(is -> is.setImpactScore(null));
      indicatorScoreRepository.deleteAll(existingScore.getIndicatorScores());
      existingScore.setIndicatorScores(impactScore.getIndicatorScores());
      existingScore.getIndicatorScores().forEach(is -> {
        is.setId(null);
        is.setImpactScore(existingScore);
      });

      impact.getGeography().clear();
      impact.getGeography().addAll(request.getGeography());
      impact.getGeographyCustom().clear();
      impact.getGeographyCustom().addAll(request.getGeographyCustom());

      impactScoreService.update(existingScore.getId(), existingScore);
    } else {
      impactScore.setImpact(impact);

      impactScore.getIndicatorScores().forEach(indicatorScore -> {
        indicatorScore.setId(null);
        indicatorScore.setImpactScore(impactScore);
      });

      impact.getGeography().clear();
      impact.getGeography().addAll(request.getGeography());
      impact.getGeographyCustom().clear();
      impact.getGeographyCustom().addAll(request.getGeographyCustom());

      impactScoreService.create(impactScore);
    }

    return super.update(impact.getId(), impact);
  }

  private boolean isLessThanOneDayOld(Date date) {
    Date now = new Date();
    Calendar calendar = Calendar.getInstance();
    calendar.setTime(now);
    calendar.add(Calendar.DAY_OF_YEAR, -1);
    Date oneDayAgo = calendar.getTime();
    return date.after(oneDayAgo);
  }

  public Impact editIndicator(ImpactIndicator indicator, ImpactIndicatorRequest request) {
    indicator
      .setName(request.getName())
      .setYear(request.getYear());

    return indicatorRepository.save(indicator).getImpact();
  }

  @Transactional
  public Impact deleteIndicator(ImpactIndicator indicator) {
    indicatorScoreRepository.deleteAllByIndicator(indicator);
    quantificationDataRepository.deleteAllByIndicator(indicator);
    indicatorQuantificationDataRepository.deleteAllByIndicator(indicator);
    Impact impact = indicator.getImpact();
    impact.getIndicators().remove(indicator);
    indicatorRepository.delete(indicator);
    return impact;
  }

  private void addIfNotEmpty(Collection<String> collection, String value) {
    if (!StringUtils.isEmpty(value)) {
      collection.add(value);
    }
  }

  public ImpactAutofill getImpactAutofillValues(Venture venture) {
    ImpactAutofill result = new ImpactAutofill();
    venture.getImpacts().forEach(impact -> {
      addIfNotEmpty(result.getStatusQuo(), impact.getStatusQuo());
      addIfNotEmpty(result.getInnovation(), impact.getInnovation());
      addIfNotEmpty(result.getStakeholders(), impact.getStakeholders());
      addIfNotEmpty(result.getChange(), impact.getChange());
      addIfNotEmpty(result.getOutputUnits(), impact.getOutputUnits());
    });
    return result;
  }

  public void deleteImpact(Impact impact) {
    impact.getIndicators().forEach(indicator -> {
      indicatorQuantificationDataRepository.deleteAll(indicator.getPre());
      indicatorQuantificationDataRepository.deleteAll(indicator.getPost());
      quantificationDataRepository.deleteAll(indicator.getPreActual());
      quantificationDataRepository.deleteAll(indicator.getPostActual());
      noteLinkRepository.deleteAllByNoteIndicator(indicator);
      noteFileRepository.deleteAllByNoteIndicator(indicator);
      noteRepository.deleteAllByIndicator(indicator);
    });

    indicatorRepository.deleteAll(impact.getIndicators());

    quantificationDataRepository.deleteAll(impact.getProductsData());
    quantificationDataRepository.deleteAll(impact.getStakeholdersData());
    quantificationDataRepository.deleteAll(impact.getProductsDataActual());
    quantificationDataRepository.deleteAll(impact.getStakeholdersDataActual());
    noteLinkRepository.deleteAllByNoteImpact(impact);
    noteFileRepository.deleteAllByNoteImpact(impact);
    noteRepository.deleteAllByImpact(impact);

    super.deleteById(impact.getId());
  }
}
