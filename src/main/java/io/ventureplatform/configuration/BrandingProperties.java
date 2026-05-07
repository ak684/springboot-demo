package io.ventureplatform.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import java.net.URI;

@Component
@ConfigurationProperties(prefix = "application.branding")
@Validated
@Getter
@Setter
public class BrandingProperties {
  @NotBlank
  private String companyName;
  @NotBlank
  private String companyShortName;
  @NotBlank
  private String domainDisplay;
  @NotBlank
  private String appBaseUrl;
  @NotBlank
  private String mapBaseUrl;
  @NotBlank
  private String marketingSiteUrl;
  @NotBlank
  private String pricingUrl;
  @NotBlank
  private String aiTocShareUrl;
  @NotBlank
  private String stripeCheckoutUrl;
  @NotBlank
  private String metaDescription;
  @Valid
  private Emails emails = new Emails();
  @Valid
  private ShareImages shareImages = new ShareImages();
  @Valid
  private Social social = new Social();
  @Valid
  private Logo logo = new Logo();
  @Valid
  private WhiteLabel whiteLabel = new WhiteLabel();

  public String getAppHostname() {
    try {
      return URI.create(appBaseUrl).getHost();
    } catch (IllegalArgumentException ex) {
      throw new IllegalStateException("Invalid branding appBaseUrl: " + appBaseUrl, ex);
    }
  }

  public String getMapHostname() {
    try {
      return URI.create(mapBaseUrl).getHost();
    } catch (IllegalArgumentException ex) {
      throw new IllegalStateException("Invalid branding mapBaseUrl: " + mapBaseUrl, ex);
    }
  }

  public String normalizeUrl(String url) {
    if (!StringUtils.hasText(url)) {
      throw new IllegalStateException("Branding URL cannot be blank");
    }
    return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
  }

  @Getter
  @Setter
  public static class Emails {
    @NotBlank
    private String noReply;
    @NotBlank
    private String feedback;
    @NotBlank
    private String certify;
    @NotBlank
    private String support;
  }

  @Getter
  @Setter
  public static class ShareImages {
    @NotBlank
    private String defaultImageUrl;
    @NotBlank
    private String aiTocImageUrl;
  }

  @Getter
  @Setter
  public static class Social {
    @NotBlank
    private String twitter;
    @NotBlank
    private String linkedin;
    @NotBlank
    private String facebook;
    @NotBlank
    private String calendly;
  }

  @Getter
  @Setter
  public static class Logo {
    private String primaryText;
    private String secondaryText;
    private String imageUrl;
    private String imageAlt;
    private Integer imageHeight;
    private String emailImageUrl;
  }

  @Getter
  @Setter
  public static class WhiteLabel {
    private boolean enabled;
    private String authBackgroundColor;
    private String authBackgroundGradientEnd;
    private boolean authShowBackLink;
    private String authBackLinkUrl;
    private String authQuote;
    private String authQuoteAttribution;
    private String authForgotPasswordDescription;
    private String authLoginSubmitLabel;
    private String authForgotSubmitLabel;
    private String authResetSubmitLabel;
    private String authResetTitle;
    private String authResetPasswordPlaceholder;
    private String authResetConfirmPlaceholder;
    private String welcomeHeadline;
    private String welcomeSubtext;
    private String welcomeButtonLabel;
    private String authMessage1;
    private String authMessage2;
    private String authMessage3;
    private String defaultPostLoginRoute;
    private String companyDashboardRouteTemplate;
    private boolean hideMyVentures;
    private boolean hideStripeSignup;
    private String myVenturesLabel;
  }
}
