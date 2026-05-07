package io.ventureplatform.controller;


import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.FeedbackRequest;
import io.ventureplatform.entity.User;
import io.ventureplatform.facade.FeedbackFacade;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {
  private final FeedbackFacade feedbackFacade;

  @PostMapping
  public void createFeedback(@RequestBody FeedbackRequest request, @CurrentUser User user) {
    feedbackFacade.saveFeedback(request, user);
  }
}
