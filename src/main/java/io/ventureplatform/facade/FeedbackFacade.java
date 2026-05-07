package io.ventureplatform.facade;

import io.ventureplatform.dto.request.FeedbackRequest;
import io.ventureplatform.dto.response.BaseResponse;
import io.ventureplatform.entity.Feedback;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FeedbackFacade extends AbstractDtoFacade<FeedbackRequest, BaseResponse, Feedback> {
  private final FeedbackService feedbackService;

  public void saveFeedback(FeedbackRequest request, User user) {
    feedbackService.saveFeedback(dtoToEntity(request), user);
  }
}
