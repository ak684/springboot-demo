package io.ventureplatform.controller;

import io.ventureplatform.configuration.BrandingProperties;
import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.entity.AiTocFeedback;
import io.ventureplatform.entity.Feedback;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.BrandResolver;
import io.ventureplatform.service.BrandingService;
import io.ventureplatform.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Renders email templates as HTML so engineers can verify branding without sending mail.
 * Sysadmin / superadmin only. Read-only.
 */
@RestController
@RequestMapping(AppConstants.API_PREFIX + AppConstants.API_VERSION + "/admin/email-preview")
@RequiredArgsConstructor
@PreAuthorize("isSysAdminOrSuperAdmin()")
public class EmailPreviewController {
  private final EmailService emailService;
  private final BrandingService brandingService;
  private final BrandResolver brandResolver;

  @GetMapping("/whoami")
  public ResponseEntity<Map<String, String>> whoami() {
    Map<String, String> result = new HashMap<>();
    String brandKey = brandResolver.getKeyForCurrentRequest();
    BrandingProperties brand = brandResolver.forCurrentRequest();
    result.put("brandKey", brandKey);
    result.put("companyName", brand.getCompanyName());
    result.put("appBaseUrl", brand.getAppBaseUrl());
    result.put("noReply", brand.getEmails().getNoReply());
    return ResponseEntity.ok(result);
  }

  @GetMapping(value = "/{template}", produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> preview(
    @PathVariable final String template,
    @RequestParam(name = "brand", defaultValue = BrandingService.DEFAULT_BRAND) final String brand
  ) {
    BrandingProperties props = brandingService.getBrandingPropertiesForKey(brand);
    Map<String, Object> variables = sampleVariables(template);
    String subject = String.format("[Preview] %s — %s", template, props.getCompanyName());
    String html = emailService.renderTemplate(subject, template, variables, props);
    return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
  }

  private Map<String, Object> sampleVariables(final String template) {
    Map<String, Object> variables = new HashMap<>();
    User user = sampleUser();
    User owner = sampleOwner();
    User member = sampleMember();
    Venture venture = sampleVenture();
    Portfolio portfolio = samplePortfolio();
    List<Venture> ventures = new ArrayList<>();
    ventures.add(venture);
    List<Portfolio> portfolios = new ArrayList<>();
    portfolios.add(portfolio);

    switch (template) {
      case "welcome":
      case "password_reset":
      case "account_deactivated":
        variables.put("user", user);
        break;
      case "invite":
        variables.put("user", user);
        variables.put("owner", "Jane Doe");
        variables.put("ventures", ventures);
        variables.put("portfolios", portfolios);
        variables.put("message", "Looking forward to collaborating!");
        variables.put("newAccount", true);
        break;
      case "invite_from_portfolio":
        variables.put("portfolio", portfolio);
        variables.put("message", "We'd love to feature your venture.");
        variables.put("promo", "WELCOME50");
        variables.put("link", "https://app.example.com/ventures?invite=demo");
        break;
      case "owner_notification":
        variables.put("owner", owner);
        variables.put("user", sampleInviter());
        variables.put("member", member);
        variables.put("ventures", ventures);
        variables.put("added", true);
        break;
      case "owner_notification_portfolio":
        variables.put("owner", owner);
        variables.put("user", sampleInviter());
        variables.put("member", member);
        variables.put("portfolios", portfolios);
        variables.put("added", true);
        break;
      case "revoke":
        variables.put("user", user);
        variables.put("ventures", ventures);
        variables.put("portfolios", portfolios);
        break;
      case "feedback":
        Feedback feedback = new Feedback();
        feedback.setEntry(buildFeedbackEntry());
        variables.put("feedback", feedback);
        variables.put("user", user);
        break;
      case "ai_toc_feedback":
        AiTocFeedback aiFeedback = new AiTocFeedback();
        aiFeedback.setRating(4);
        aiFeedback.setComment("Helpful suggestions, but the language was a bit formal.");
        aiFeedback.setContact(true);
        aiFeedback.setName("Sample Reviewer");
        aiFeedback.setEmail("reviewer@example.com");
        variables.put("feedback", aiFeedback);
        break;
      case "certification_request":
        variables.put("venture", venture);
        variables.put("level", 2);
        variables.put("user", user);
        break;
      case "pitch_deck_access_request":
        variables.put("owner", owner);
        variables.put("venture", venture);
        variables.put("name", "Sample");
        variables.put("lastName", "Investor");
        variables.put("organization", "Acme Capital");
        variables.put("email", "investor@example.com");
        variables.put("message", "Interested in your seed round.");
        break;
      case "student_access_request":
        variables.put("studentEmail", "student@example.edu");
        variables.put("requestTime", new java.util.Date());
        break;
      default:
        variables.put("user", user);
        break;
    }
    return variables;
  }

  private Map<String, Object> buildFeedbackEntry() {
    Map<String, Object> entry = new HashMap<>();
    entry.put("category", "Bug");
    entry.put("description", "The export button on the dashboard does not respond.");
    return entry;
  }

  private User sampleUser() {
    User user = new User();
    user.setId(1001L);
    user.setName("Helge");
    user.setLastName("Schmitz");
    user.setEmail("helge@example.com");
    user.setPasswordResetToken("preview-reset-token");
    return user;
  }

  private User sampleOwner() {
    User user = new User();
    user.setId(1002L);
    user.setName("Ingo");
    user.setLastName("Michelfelder");
    user.setEmail("owner@example.com");
    return user;
  }

  private User sampleMember() {
    User user = new User();
    user.setId(1003L);
    user.setName("Daniel");
    user.setLastName("Weber");
    user.setEmail("daniel@example.com");
    return user;
  }

  private User sampleInviter() {
    User user = new User();
    user.setId(1004L);
    user.setName("Rawad");
    user.setLastName("Ali");
    user.setEmail("rawad@example.com");
    return user;
  }

  private Venture sampleVenture() {
    Venture venture = new Venture();
    venture.setName("Sample Venture");
    return venture;
  }

  private Portfolio samplePortfolio() {
    Portfolio portfolio = new Portfolio();
    portfolio.setName("Sample Portfolio");
    portfolio.setInvitationCode("preview-invite-code");
    return portfolio;
  }
}
