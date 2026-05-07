package io.ventureplatform.service;

import io.ventureplatform.dto.request.ImageUploadRequest;
import io.ventureplatform.entity.Feedback;
import io.ventureplatform.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FeedbackService extends AbstractBaseEntityService<Feedback> {
  private final EmailService emailService;
  private final BrandResolver brandResolver;
  private final UploadService uploadService;

  public void saveFeedback(Feedback feedback, User user) {
    if (feedback.getEntry().containsKey("screenshot")) {
      String base64screenshot = feedback.getEntry().remove("screenshot").toString();
      ImageUploadRequest request = new ImageUploadRequest();
      request.setContent(base64screenshot);
      String url = uploadService.uploadBase64Image(request, user);
      feedback.getEntry().put("screenshot", url);
    }

    super.create(feedback);
    emailService.sendFeedbackReceivedEmail(feedback, user, brandResolver.forCurrentRequest());
  }
}
