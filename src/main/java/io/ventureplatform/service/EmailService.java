package io.ventureplatform.service;

import io.ventureplatform.configuration.BrandingProperties;
import io.ventureplatform.configuration.SuperAdminConfiguration;
import io.ventureplatform.dto.request.GetPitchAccessRequest;
import io.ventureplatform.dto.request.InviteVentureRequest;
import io.ventureplatform.entity.AiTocFeedback;
import io.ventureplatform.entity.Feedback;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.exception.custom.EmailSendFailedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring5.SpringTemplateEngine;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static io.ventureplatform.constant.AppConstants.PROFILE_PROD;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
  private final JavaMailSender javaMailSender;
  private final SpringTemplateEngine templateEngine;
  private final SuperAdminConfiguration superAdminConfiguration;
  private final BrandResolver brandResolver;

  @Value("${spring.profiles.active}")
  private String profile;
  @Value("${application.backend.url}")
  private String serverUrl;

  public String renderTemplate(
    final String subject,
    final String template,
    final Map<String, Object> variables,
    final BrandingProperties brand
  ) {
    Context thymeleafContext = new Context();
    thymeleafContext.setVariables(variables);
    thymeleafContext.setVariable("subject", subject);
    thymeleafContext.setVariable("template", "email/" + template);
    thymeleafContext.setVariable("brand", brand);
    return templateEngine.process("fragments/main", thymeleafContext);
  }

  private void sendHtmlEmail(
    final String to,
    final String subject,
    final String content,
    final BrandingProperties brand
  ) {
    try {
      MimeMessage mimeMessage = javaMailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
      helper.setFrom(brand.getEmails().getNoReply(), brand.getCompanyName());
      helper.setTo(to);

      helper.setSubject(subject);
      helper.setText(content, true);

      if (PROFILE_PROD.equals(profile)) {
        javaMailSender.send(mimeMessage);
      }
    } catch (MessagingException | UnsupportedEncodingException e) {
      log.error(String.format("Failed to send email to user %s, subject '%s'", to, subject));
      throw new EmailSendFailedException(e);
    }
  }

  private void sendThymeleafTemplateEmail(
    final String to,
    final String subject,
    final Map<String, Object> variables,
    final String template,
    final BrandingProperties brand
  ) {
    String htmlBody = renderTemplate(subject, template, variables, brand);
    sendHtmlEmail(to, subject, htmlBody, brand);
  }

  @Async
  public void sendWelcomeEmail(final User user, final BrandingProperties brand) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("user", user);
    sendThymeleafTemplateEmail(
      user.getEmail(),
      String.format("Your %s account was created", brand.getCompanyName()),
      variables,
      "welcome",
      brand
    );
  }

  @Async
  public void sendForgotPasswordEmail(final User user, final BrandingProperties brand) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("user", user);
    sendThymeleafTemplateEmail(
      user.getEmail(),
      String.format("%s password change request", brand.getCompanyName()),
      variables,
      "password_reset",
      brand
    );
  }

  @Async
  public void sendFeedbackReceivedEmail(final Feedback feedback, final User user, final BrandingProperties brand) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("feedback", feedback);
    variables.put("user", user);
    sendThymeleafTemplateEmail(
      brand.getEmails().getFeedback(),
      String.format("%s - new feedback received", brand.getCompanyName()),
      variables,
      "feedback",
      brand
    );
  }

  @Async
  public void sendInvitedVentureOrPortfolioEmail(
    final User current,
    final User invited,
    final String message,
    final List<Venture> ventures,
    final List<Portfolio> portfolios,
    final boolean newAccount,
    final BrandingProperties brand
  ) {
    Map<String, Object> variables = new HashMap<>();
    String owner = current.getName();
    if (current.getLastName() != null) {
      owner += " " + current.getLastName();
    }
    variables.put("user", invited);
    variables.put("owner", owner);
    variables.put("ventures", ventures);
    variables.put("portfolios", portfolios);
    variables.put("message", message);
    variables.put("newAccount", newAccount);
    sendThymeleafTemplateEmail(
      invited.getEmail(),
      owner + " has invited you to collaborate on their " + brand.getCompanyName() + " project",
      variables,
      "invite",
      brand
    );
  }

  @Async
  public void sendRevokeAccessEmail(
    final List<Venture> ventures,
    final List<Portfolio> portfolios,
    final User user,
    final BrandingProperties brand
  ) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("user", user);
    variables.put("ventures", ventures);
    variables.put("portfolios", portfolios);
    sendThymeleafTemplateEmail(user.getEmail(), "Your access has been revoked", variables, "revoke", brand);
  }

  @Async
  public void sendOwnerNotificationTeamMembers(
    final User user,
    final User owner,
    final User member,
    final List<Venture> ventures,
    final boolean added,
    final BrandingProperties brand
  ) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("owner", owner);
    variables.put("user", user);
    variables.put("member", member);
    variables.put("ventures", ventures);
    variables.put("added", added);
    String title = added ? "A new member has been invited to your team" : "A member was removed from your team";
    sendThymeleafTemplateEmail(owner.getEmail(), title, variables, "owner_notification", brand);
  }

  @Async
  public void sendOwnerNotificationTeamMembersPortfolio(
    final User user,
    final User owner,
    final User member,
    final List<Portfolio> portfolios,
    final boolean added,
    final BrandingProperties brand
  ) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("owner", owner);
    variables.put("user", user);
    variables.put("member", member);
    variables.put("portfolios", portfolios);
    variables.put("added", added);
    String title = added ? "A new member has been invited to your team" : "A member was removed from your team";
    sendThymeleafTemplateEmail(owner.getEmail(), title, variables, "owner_notification_portfolio", brand);
  }

  @Async
  public void sendCertificationRequestEmail(
    final Venture venture,
    final Integer level,
    final User user,
    final BrandingProperties brand
  ) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("venture", venture);
    variables.put("level", level);
    variables.put("user", user);
    sendThymeleafTemplateEmail(
      brand.getEmails().getCertify(),
      "New certification request",
      variables,
      "certification_request",
      brand
    );
  }

  @Async
  public void sendRequestPitchAccessEmail(
    final GetPitchAccessRequest request,
    final Venture venture,
    final User owner,
    final BrandingProperties brand
  ) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("owner", owner);
    variables.put("venture", venture);
    variables.put("name", request.getName());
    variables.put("lastName", request.getLastName());
    variables.put("organization", request.getOrganization());
    variables.put("email", request.getEmail());
    variables.put("message", request.getMessage());
    sendThymeleafTemplateEmail(
      owner.getEmail(),
      "Impact pitch deck access request",
      variables,
      "pitch_deck_access_request",
      brand
    );
  }

  @Async
  public void sendInviteFromPortfolioEmail(
    final String email,
    final InviteVentureRequest request,
    final Portfolio portfolio,
    final BrandingProperties brand
  ) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("portfolio", portfolio);
    variables.put("message", request.getMessage());
    variables.put("promo", request.getPromo());
    variables.put("link", brand.getAppBaseUrl() + "/ventures?invite=" + portfolio.getInvitationCode());
    sendThymeleafTemplateEmail(
      email,
      portfolio.getName() + " invites you to join " + brand.getDomainDisplay(),
      variables,
      "invite_from_portfolio",
      brand
    );
  }

  @Async
  public void sendAiTocFeedbackEmail(final AiTocFeedback feedback, final BrandingProperties brand) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("feedback", feedback);
    sendThymeleafTemplateEmail(
      brand.getEmails().getFeedback(),
      String.format("%s - AI TOC feedback received", brand.getCompanyName()),
      variables,
      "ai_toc_feedback",
      brand
    );
  }

  @Async
  public void sendAccountDeactivatedEmail(final User user, final BrandingProperties brand) {
    Map<String, Object> variables = new HashMap<>();
    variables.put("user", user);
    sendThymeleafTemplateEmail(
      user.getEmail(),
      String.format("%s - Your account has been deactivated", brand.getCompanyName()),
      variables,
      "account_deactivated",
      brand
    );
  }

  @Async
  public void sendStudentAccessRequestEmail(final String studentEmail, final BrandingProperties brand) {
    String subject = "Student Access Request - Innovating for Impact Class";
    Map<String, Object> variables = new HashMap<>();
    variables.put("studentEmail", studentEmail);
    variables.put("requestTime", new java.util.Date());
    String content = renderTemplate(subject, "student_access_request", variables, brand);

    String notificationEmail = superAdminConfiguration.getNotificationEmail();
    sendHtmlEmail(notificationEmail, subject, content, brand);
    log.info("Student access request email sent to {} for student: {}", notificationEmail, studentEmail);
  }

  /**
   * Convenience accessor for callers that don't have a brand-bearing resource and want
   * to render with the brand of the current HTTP request. Returns the default brand if no
   * request is in scope (e.g. background jobs).
   */
  public BrandingProperties brandFromCurrentRequest() {
    return brandResolver.forCurrentRequest();
  }
}
