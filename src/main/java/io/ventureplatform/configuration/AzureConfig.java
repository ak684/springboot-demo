package io.ventureplatform.configuration;

import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AzureConfig {
  @Value("${azure.storage.sas-url}")
  private String sasUrl;

  @Bean
  public BlobServiceClient blobServiceClient() {
    return new BlobServiceClientBuilder()
      .endpoint(sasUrl)
      .buildClient();
  }
}
