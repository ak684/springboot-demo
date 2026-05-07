package io.ventureplatform.service.external;

import io.ventureplatform.exception.custom.LinkedinException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URL;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LinkedinService {
  @Value("${linkedin.clientId}")
  private String clientId;
  @Value("${linkedin.clientSecret}")
  private String clientSecret;
  @Value("${linkedin.refreshToken}")
  private String refreshToken;
  @Value("${application.backend.url}")
  private String serverUrl;

  private final RestTemplate restTemplate;

  private String accessToken = null;

  private static final String AUTHORIZATION_URL = "https://www.linkedin.com/oauth/v2/authorization";
  private static final String ACCESS_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
  private static final String FOLLOWERS_URL = "https://api.linkedin.com/v2/networkSizes/urn:li:organization:%d?edgeType=CompanyFollowedByMember";
  private static final String VANITY_NAME_URL = "https://api.linkedin.com/v2/organizations?q=vanityName&vanityName=";

  // Call this method locally when you need to replace a refresh token. After following the auth URL and giving your
  // consent, the access token and refresh token should be logged in console (see linkedinOauthCallback method)
  // Use clientId and clientSecret from server to perform these calls. Then put new refresh token in linkedin.refreshToken
  public String getAuthorizationUrl() {
    return AUTHORIZATION_URL + "?response_type=code&client_id=" + clientId
      + "&redirect_uri=" + serverUrl + "api/v1/oauth/linkedin/callback"
      + "&scope=r_organization_social%20r_organization_admin";
  }

  public void getTokensByCode(String authorizationCode) {
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Type", "application/x-www-form-urlencoded");

    MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
    params.add("grant_type", "authorization_code");
    params.add("code", authorizationCode);
    params.add("client_id", clientId);
    params.add("client_secret", clientSecret);
    params.add("redirect_uri", serverUrl + "api/v1/oauth/linkedin/callback");

    HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
    ResponseEntity<String> response = restTemplate.postForEntity(ACCESS_TOKEN_URL, request, String.class);
    System.out.println(response);
  }

  public void getAccessTokenFromRefreshToken() {
    MultiValueMap<String, String> parameters = new LinkedMultiValueMap<>();
    parameters.add("grant_type", "refresh_token");
    parameters.add("refresh_token", refreshToken);
    parameters.add("client_id", clientId);
    parameters.add("client_secret", clientSecret);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

    HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(parameters, headers);

    try {
      ResponseEntity<LinkedHashMap> response = restTemplate.postForEntity(ACCESS_TOKEN_URL, request, LinkedHashMap.class);
      this.accessToken = "Bearer " + response.getBody().get("access_token").toString();
    } catch (Exception ex) {
      throw new RuntimeException("Linkedin auth error", ex);
    }
  }

  public Long getNumberOfFollowers(String website) {
    getAccessTokenFromRefreshToken();
    Long id = getOrganizationId(website);
    return getFollowersByCompanyId(id);
  }

  private Long getFollowersByCompanyId(Long id) {
    HttpEntity<String> request = new HttpEntity<>("parameters", getLinkedinHeaders());
    String url = String.format(FOLLOWERS_URL, id);
    ResponseEntity<HashMap> response = restTemplate.exchange(url, HttpMethod.GET, request, HashMap.class);
    return Long.parseLong(response.getBody().get("firstDegreeSize").toString());
  }

  private Long getOrganizationId(String website) {
    try {
      URL url = new URL(website);

      String[] pathParts = url.getPath().split("/");
      if (pathParts.length > 2 && ("company".equals(pathParts[1]) || "school".equals(pathParts[1]))) {
        String company = pathParts[2];
        try {
          return Long.parseLong(company);
        } catch (NumberFormatException ex) {
          return getCompanyIdByVanityName(company);
        }
      } else {
        return null;
      }
    } catch (Exception ex) {
      System.out.println("Company ID fetch failed: " + ex.getMessage());
      throw new LinkedinException("Cannot get LinkedIn organization ID: " + website);
    }
  }

  private Long getCompanyIdByVanityName(String companyVanityName) {
    HttpEntity<String> request = new HttpEntity<>("parameters", getLinkedinHeaders());
    String url = VANITY_NAME_URL + companyVanityName;
    ResponseEntity<HashMap> response = restTemplate.exchange(url, HttpMethod.GET, request, HashMap.class);

    List<LinkedHashMap<String, Object>> elements = (List<LinkedHashMap<String, Object>>) response.getBody().get("elements");
    LinkedHashMap<String, Object> company = elements.stream()
      .filter(el -> companyVanityName.equals(el.get("vanityName")))
      .findFirst()
      .orElseThrow(() -> new LinkedinException("Cannot find LinkedIn company with vanity name: " + companyVanityName));

    return Long.parseLong(company.get("id").toString());
  }

  private HttpHeaders getLinkedinHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.add("Authorization", accessToken);
    headers.add("LinkedIn-Version", "202305");
    return headers;
  }
}
