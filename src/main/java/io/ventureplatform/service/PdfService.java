package io.ventureplatform.service;

import com.lowagie.text.DocumentException;
import io.ventureplatform.dto.request.ImpactExportRequest;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactScore;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.enums.ImpactFilter;
import io.ventureplatform.entity.enums.ImpactSort;
import io.ventureplatform.exception.custom.PdfGenerationFailedException;
import io.ventureplatform.exception.custom.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring5.SpringTemplateEngine;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfService {
  private final SpringTemplateEngine templateEngine;
  private final FileDownloadService downloadService;
  private final CalculationService calculationService;

  private ResponseEntity<InputStreamResource> generatePdf(String template, Context context) {
    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

    ITextRenderer renderer = new ITextRenderer();
    String html = templateEngine.process("pdf/" + template, context);
    renderer.setDocumentFromString(html);
    renderer.layout();
    try {
      renderer.createPDF(outputStream);
    } catch (DocumentException e) {
      throw new PdfGenerationFailedException(e);
    }

    InputStream inputStream = new ByteArrayInputStream(outputStream.toByteArray());
    return downloadService.getDownloadPdfResponse(inputStream);
  }

  public ResponseEntity<InputStreamResource> generateImpactsExport(Venture venture, ImpactExportRequest request) {
    Context context = new Context();

    List<Impact> impactsToShow = venture.getImpacts().stream()
      .filter(i -> request.getFilter().contains(ImpactFilter.DRAFT) || !i.getDraft())
      .filter(i -> request.getFilter().contains(ImpactFilter.NOT_DRAFT) || i.getDraft())
      .filter(i -> request.getFilter().contains(ImpactFilter.POSITIVE) || !i.getPositive())
      .filter(i -> request.getFilter().contains(ImpactFilter.NEGATIVE) || i.getPositive())
      .sorted((i1, i2) -> {
        // This logic is duplicated on frontend in impactSort (impact.js)
        if (request.getSort() == ImpactSort.CUSTOM) {
          return i1.getSortOrder() - i2.getSortOrder();
        }

        if (!i1.getDraft().equals(i2.getDraft())) {
          return i1.getDraft().compareTo(false) - i2.getDraft().compareTo(false);
        }

        Double i1Val = null;
        Double i2Val = null;
        ImpactScore i1Score = getLastScoring(i1);
        ImpactScore i2Score = getLastScoring(i2);

        if (i1Score != null) {
          i1Val = calculationService.getParam(i1Score, request.getSort(), i1);
        }

        if (i2Score != null) {
          i2Val = calculationService.getParam(i2Score, request.getSort(), i2);
        }

        if (i1Val == null && i2Val == null) {
          return i1.getCreatedAt().after(i2.getCreatedAt()) ? 1 : -1;
        } else {
          return Optional.ofNullable(i2Val).orElse(0D).intValue()
            - Optional.ofNullable(i1Val).orElse(0D).intValue();
        }
      })
      .peek(i -> {
        Double value = calculationService.getParam(getLastScoring(i), request.getSort(), i);
        i.getAux().put(
          "paramValue",
          value == null ? null : Math.round(value)
        );
        i.getAux().put(
          "paramName",
          request.getSort() == ImpactSort.CUSTOM ? ImpactSort.BY_SCORE.getLabel() : request.getSort().getLabel()
        );
      })
      .collect(Collectors.toList());

    if (impactsToShow.isEmpty()) {
      throw new ValidationException("There are no impacts to show");
    }

    context.setVariable("impacts", impactsToShow);
    context.setVariable("hasNegativeImpact", venture.getImpacts().stream().anyMatch(i -> !i.getPositive()));
    context.setVariable("hide", request.getHide());
    return generatePdf("impacts", context);
  }

  private ImpactScore getLastScoring(Impact impact) {
    if (impact.getScoring().isEmpty()) {
      return null;
    } else {
      return impact.getScoring().get(impact.getScoring().size() - 1);
    }
  }
}
