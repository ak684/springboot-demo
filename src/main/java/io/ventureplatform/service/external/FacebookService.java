package io.ventureplatform.service.external;

import io.ventureplatform.entity.Followers;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.enums.FollowerType;
import io.ventureplatform.repository.FollowersRepository;
import io.ventureplatform.repository.VentureRepository;
import io.sentry.Sentry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacebookService {
  private final RestTemplate restTemplate;
  private final VentureRepository ventureRepository;
  private final FollowersRepository followersRepository;

  @Value("${facebook.clientId}")
  private String clientId;
  @Value("${facebook.clientSecret}")
  private String clientSecret;
  @Value("${facebook.appToken}")
  private String appAccessToken;
  @Value("${application.backend.url}")
  private String serverUrl;

  private static final String TOKEN_EXCHANGE_URL =
    "https://graph.facebook.com/oauth/access_token?"
      + "grant_type=fb_exchange_token&"
      + "client_id={clientId}&"
      + "client_secret={clientSecret}&"
      + "fb_exchange_token={token}";

  public String getAuthUrl(Venture venture) {
    String redirectUri = serverUrl + "api/v1/oauth/facebook/callback";
    return "https://www.facebook.com/v18.0/dialog/oauth?client_id=" + clientId
      + "&redirect_uri=" + redirectUri
      + "&scope=pages_show_list,instagram_basic"
      + "&state=" + venture.getId();
  }

  public void getTokenByCode(String code, Venture venture) {
    String redirectUri = serverUrl + "api/v1/oauth/facebook/callback";
    String tokenUri = "https://graph.facebook.com/oauth/access_token";
    UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(tokenUri)
      .queryParam("client_id", clientId)
      .queryParam("redirect_uri", redirectUri)
      .queryParam("client_secret", clientSecret)
      .queryParam("code", code);

    Map<String, Object> response = restTemplate.getForObject(builder.toUriString(), Map.class);
    String token = response.get("access_token").toString();
    venture.setFacebookToken(token);
    getFacebookCompanyId(venture);
    getInstagramCompanyId(venture);
    // Immediately fetch followers for venture after social media integration
    saveMetaFollowers(venture, FollowerType.FACEBOOK, venture.getFacebookCompanyId(), token);
    saveMetaFollowers(venture, FollowerType.INSTAGRAM, venture.getInstagramCompanyId(), token);

    ventureRepository.save(venture);
  }

  private void saveMetaFollowers(Venture venture, FollowerType type, String companyId, String token) {
    try {
      Long followers = getNumberOfFollowers(venture.getId(), companyId, token);
      if (followers != null && followers > 0) {
        Followers newRecord = new Followers().setType(type).setValue(followers).setVenture(venture);
        followersRepository.save(newRecord);
      }
    } catch (Exception ex) {
      // continue
    }
  }

  private void getFacebookCompanyId(Venture venture) {
    String url = "https://graph.facebook.com/me/accounts?access_token={token}&type=page";
    Map<String, Object> response = restTemplate.getForObject(url, Map.class, venture.getFacebookToken());
    List<Map<String, Object>> companies = (List<Map<String, Object>>) response.get("data");
    if (!companies.isEmpty()) {
      venture.setFacebookCompanyId(companies.get(0).get("id").toString());
    }
  }

  private void getInstagramCompanyId(Venture venture) {
    if (venture.getFacebookCompanyId() != null) {
      try {
        String url = "https://graph.facebook.com/v18.0/{companyId}?access_token={token}&fields=instagram_business_account";
        Map<String, Object> response = restTemplate.getForObject(
          url, Map.class, venture.getFacebookCompanyId(), venture.getFacebookToken()
        );

        if (response.get("instagram_business_account") != null) {
          String companyId = ((Map<String, Object>)response.get("instagram_business_account")).get("id").toString();
          venture.setInstagramCompanyId(companyId);
        }
      } catch (Exception ex) {
        return;
      }
    }
  }

  public Long getTokenExpiration(String token) {
    try {
      String url = "https://graph.facebook.com/debug_token?input_token={token}&access_token={appAccessToken}";
      Map response = restTemplate.getForObject(url, Map.class, token, appAccessToken);
      return Long.parseLong(((Map<String, Object>) response.get("data")).get("data_access_expires_at").toString());
    } catch (Exception ex) {
      log.error("Cannot get Facebook token expiration message");
      log.error(ex.getMessage(), ex);
      return Long.MAX_VALUE;
    }
  }

  public boolean isExpired(long expiresAt) {
    ZonedDateTime now = ZonedDateTime.now(ZoneId.of("UTC"));
    ZonedDateTime expirationTime = ZonedDateTime.ofInstant(Instant.ofEpochSecond(expiresAt), ZoneId.of("UTC"));
    return expirationTime.isBefore(now);
  }

  public boolean isExpiringWithinTenDays(long expiresAt) {
    ZonedDateTime now = ZonedDateTime.now(ZoneId.of("UTC"));
    ZonedDateTime expirationTime = ZonedDateTime.ofInstant(Instant.ofEpochSecond(expiresAt), ZoneId.of("UTC"));
    ZonedDateTime tenDaysFromNow = now.plusDays(10);
    return expirationTime.isBefore(tenDaysFromNow);
  }

  public String getNewToken(String token) {
    UriComponents uriComponents = UriComponentsBuilder.fromHttpUrl(TOKEN_EXCHANGE_URL)
      .buildAndExpand(clientId, clientSecret, token);
    Map<String, Object> response = restTemplate.getForObject(uriComponents.toUri(), Map.class);
    return response.get("access_token").toString();
  }

  public Long getNumberOfFollowers(Long id, String companyId, String facebookToken) {
    try {
      String url = "https://graph.facebook.com/v18.0/{companyId}?access_token={token}&fields=followers_count";
      Map<String, Object> response = restTemplate.getForObject(url, Map.class, companyId, facebookToken);
      return Long.valueOf(response.get("followers_count").toString());
    } catch (Exception ex) {
      Sentry.captureException(ex);
      log.error("Cannot get number of Facebook/Instagram followers for venture " + id
        + ", companyId: " + companyId, ex);
      return null;
    }
  }
}
