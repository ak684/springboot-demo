package io.ventureplatform.dto.response;

import io.ventureplatform.configuration.BrandingProperties;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

@Getter
@Setter
@Accessors(chain = true)
public class BrandingResponse {
  private String companyName;
  private String companyShortName;
  private String domainDisplay;
  private String appBaseUrl;
  private String appHostname;
  private String mapBaseUrl;
  private String mapHostname;
  private String marketingSiteUrl;
  private String pricingUrl;
  private String aiTocShareUrl;
  private String stripeCheckoutUrl;
  private String supportEmail;
  private SocialLinks social = new SocialLinks();
  private ShareImages shareImages = new ShareImages();
  private LogoParts logo = new LogoParts();
  private WhiteLabelConfig whiteLabel = new WhiteLabelConfig();

  @Getter
  @Setter
  @Accessors(chain = true)
  public static class SocialLinks {
    private String twitter;
    private String linkedin;
    private String facebook;
    private String calendly;
  }

  @Getter
  @Setter
  @Accessors(chain = true)
  public static class ShareImages {
    private String defaultImageUrl;
    private String aiTocImageUrl;
  }

  @Getter
  @Setter
  @Accessors(chain = true)
  public static class LogoParts {
    private String primaryText;
    private String secondaryText;
    private String imageUrl;
    private String imageAlt;
    private Integer imageHeight;
  }

  @Getter
  @Setter
  @Accessors(chain = true)
  public static class WhiteLabelConfig {
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

  public static BrandingResponse fromProperties(BrandingProperties properties) {
    BrandingResponse response = new BrandingResponse()
      .setCompanyName(properties.getCompanyName())
      .setCompanyShortName(properties.getCompanyShortName())
      .setDomainDisplay(properties.getDomainDisplay())
      .setAppBaseUrl(properties.getAppBaseUrl())
      .setAppHostname(properties.getAppHostname())
      .setMapBaseUrl(properties.getMapBaseUrl())
      .setMapHostname(properties.getMapHostname())
      .setMarketingSiteUrl(properties.getMarketingSiteUrl())
      .setPricingUrl(properties.getPricingUrl())
      .setAiTocShareUrl(properties.getAiTocShareUrl())
      .setStripeCheckoutUrl(properties.getStripeCheckoutUrl());

    if (properties.getEmails() != null) {
      response.setSupportEmail(properties.getEmails().getSupport());
    }
    if (properties.getSocial() != null) {
      response.getSocial()
        .setTwitter(properties.getSocial().getTwitter())
        .setLinkedin(properties.getSocial().getLinkedin())
        .setFacebook(properties.getSocial().getFacebook())
        .setCalendly(properties.getSocial().getCalendly());
    }
    if (properties.getShareImages() != null) {
      response.getShareImages()
        .setDefaultImageUrl(properties.getShareImages().getDefaultImageUrl())
        .setAiTocImageUrl(properties.getShareImages().getAiTocImageUrl());
    }
    if (properties.getLogo() != null) {
      response.getLogo()
        .setPrimaryText(properties.getLogo().getPrimaryText())
        .setSecondaryText(properties.getLogo().getSecondaryText())
        .setImageUrl(properties.getLogo().getImageUrl())
        .setImageAlt(properties.getLogo().getImageAlt())
        .setImageHeight(properties.getLogo().getImageHeight());
    }
    if (properties.getWhiteLabel() != null) {
      response.getWhiteLabel()
        .setEnabled(properties.getWhiteLabel().isEnabled())
        .setAuthBackgroundColor(properties.getWhiteLabel().getAuthBackgroundColor())
        .setAuthBackgroundGradientEnd(properties.getWhiteLabel().getAuthBackgroundGradientEnd())
        .setAuthShowBackLink(properties.getWhiteLabel().isAuthShowBackLink())
        .setAuthBackLinkUrl(properties.getWhiteLabel().getAuthBackLinkUrl())
        .setAuthQuote(properties.getWhiteLabel().getAuthQuote())
        .setAuthQuoteAttribution(properties.getWhiteLabel().getAuthQuoteAttribution())
        .setAuthForgotPasswordDescription(properties.getWhiteLabel().getAuthForgotPasswordDescription())
        .setAuthLoginSubmitLabel(properties.getWhiteLabel().getAuthLoginSubmitLabel())
        .setAuthForgotSubmitLabel(properties.getWhiteLabel().getAuthForgotSubmitLabel())
        .setAuthResetSubmitLabel(properties.getWhiteLabel().getAuthResetSubmitLabel())
        .setAuthResetTitle(properties.getWhiteLabel().getAuthResetTitle())
        .setAuthResetPasswordPlaceholder(properties.getWhiteLabel().getAuthResetPasswordPlaceholder())
        .setAuthResetConfirmPlaceholder(properties.getWhiteLabel().getAuthResetConfirmPlaceholder())
        .setWelcomeHeadline(properties.getWhiteLabel().getWelcomeHeadline())
        .setWelcomeSubtext(properties.getWhiteLabel().getWelcomeSubtext())
        .setWelcomeButtonLabel(properties.getWhiteLabel().getWelcomeButtonLabel())
        .setAuthMessage1(properties.getWhiteLabel().getAuthMessage1())
        .setAuthMessage2(properties.getWhiteLabel().getAuthMessage2())
        .setAuthMessage3(properties.getWhiteLabel().getAuthMessage3())
        .setDefaultPostLoginRoute(properties.getWhiteLabel().getDefaultPostLoginRoute())
        .setCompanyDashboardRouteTemplate(properties.getWhiteLabel().getCompanyDashboardRouteTemplate())
        .setHideMyVentures(properties.getWhiteLabel().isHideMyVentures())
        .setHideStripeSignup(properties.getWhiteLabel().isHideStripeSignup())
        .setMyVenturesLabel(properties.getWhiteLabel().getMyVenturesLabel());
    }
    return response;
  }
}
