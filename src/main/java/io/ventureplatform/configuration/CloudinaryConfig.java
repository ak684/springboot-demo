package io.ventureplatform.configuration;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {
  @Value("${cloudinary.name}")
  private String cdName;
  @Value("${cloudinary.key}")
  private String cdKey;
  @Value("${cloudinary.secret}")
  private String cdSecret;

  @Bean
  public Cloudinary cloudinary() {
    return new Cloudinary(ObjectUtils.asMap(
      "cloud_name", cdName,
      "api_key", cdKey,
      "api_secret", cdSecret));
  }
}
