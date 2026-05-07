package io.ventureplatform.controller;

import com.google.api.client.auth.oauth2.AuthorizationCodeFlow;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeRequestUrl;
import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.UserService;
import io.ventureplatform.service.external.FacebookService;
import io.ventureplatform.service.external.LinkedinService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.util.List;

@Controller
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/oauth")
@RequiredArgsConstructor
public class OAuthController {
  @Value("${application.backend.url}")
  private String serverUrl;
  @Value("${google.api.clientId}")
  private String googleClientId;

  private final AuthorizationCodeFlow authorizationCodeFlow;
  private final UserService userService;
  private final LinkedinService linkedinService;
  private final FacebookService facebookService;

  @GetMapping("google")
  @PreAuthorize("isAuthenticated()")
  @ResponseBody
  public ResponseEntity<String> googleOauth(@CurrentUser User user) {
    String redirectUri = serverUrl + "api/v1/oauth/google/callback";
    List<String> scopes = List.of(
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/presentations",
      "https://www.googleapis.com/auth/drive"
    );
    String url = new GoogleAuthorizationCodeRequestUrl(googleClientId, redirectUri, scopes)
      .setState(user.getId().toString())
      .setAccessType("offline")
      .build();
    return ResponseEntity.ok(url);
  }

  @GetMapping("google/callback")
  @ResponseBody
  public ResponseEntity<String> googleOauthCallback(
    @RequestParam("code") String code,
    @RequestParam("state") String userId
  ) throws IOException {
    User user = userService.findById(Long.parseLong(userId));
    TokenResponse tokenResponse = authorizationCodeFlow.newTokenRequest(code)
      .setRedirectUri(serverUrl + "api/v1/oauth/google/callback")
      .execute();

    String accessToken = tokenResponse.getAccessToken();
    String refreshToken = tokenResponse.getRefreshToken();

    user.setGoogleToken(accessToken).setGoogleRefreshToken(refreshToken);
    userService.update(user.getId(), user);

    String body = "<script>window.opener.postAuth();window.close();</script>";
    return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(body);
  }

  // Use manually on localhost
  @GetMapping("linkedin/callback")
  @ResponseBody
  public void linkedinOauthCallback(@RequestParam("code") String code) {
    linkedinService.getTokensByCode(code);
  }

  @GetMapping("facebook/{ventureId}")
  @ResponseBody
  public String connectFacebook(@PathVariable(name = "ventureId") Venture venture) {
    return facebookService.getAuthUrl(venture);
  }

  @GetMapping("facebook/callback")
  public String facebookOauthCallback(@RequestParam String code, @RequestParam(name = "state") Venture venture) {
    facebookService.getTokenByCode(code, venture);
    return "view/facebook_login_success";
  }
}
