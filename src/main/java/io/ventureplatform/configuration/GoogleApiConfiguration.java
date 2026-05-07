package io.ventureplatform.configuration;

import com.google.api.client.auth.oauth2.AuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.util.Arrays;

@Configuration
public class GoogleApiConfiguration {
  @Value("${google.api.clientId}")
  private String clientId;
  @Value("${google.api.clientSecret}")
  private String clientSecret;
  private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

  private GoogleClientSecrets getClientSecrets() {
    return new GoogleClientSecrets()
      .setInstalled(new GoogleClientSecrets.Details()
        .setClientId(clientId)
        .setClientSecret(clientSecret));
  }

  @Bean
  public AuthorizationCodeFlow authorizationCodeFlow() throws IOException {
    return new GoogleAuthorizationCodeFlow.Builder(
      new NetHttpTransport(), JSON_FACTORY, getClientSecrets(),
      Arrays.asList(
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/presentations",
        "https://www.googleapis.com/auth/drive"
      ))
      .setAccessType("offline")
      .build();
  }
}
