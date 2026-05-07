package io.ventureplatform.facade;

import io.ventureplatform.dto.request.AiTocFeedbackRequest;
import io.ventureplatform.dto.response.BaseResponse;
import io.ventureplatform.entity.AiTocFeedback;
import io.ventureplatform.service.AiTocService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AiTocFacade extends AbstractDtoFacade<AiTocFeedbackRequest, BaseResponse, AiTocFeedback> {
  private final AiTocService aiTocService;

  public void saveFeedback(AiTocFeedbackRequest feedback) {
    aiTocService.saveFeedback(dtoToEntity(feedback));
  }
}
