package io.ventureplatform.service.external;

import io.ventureplatform.entity.AiTocUsage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class IpApiService {
  private final RestTemplate restTemplate;

  public AiTocUsage populateAiTocUsage(AiTocUsage usage) {
    try {
      if (StringUtils.isNotEmpty(usage.getIpAddress())) {
        ResponseEntity<HashMap> response = restTemplate.getForEntity(
          "https://freeipapi.com/api/json/" + usage.getIpAddress(),
          HashMap.class
        );
        HashMap<String, Object> body = response.getBody();
        usage
          .setLat(Double.parseDouble(body.get("latitude").toString()))
          .setLng(Double.parseDouble(body.get("longitude").toString()))
          .setCountry(body.get("countryCode").toString())
          .setCity(body.get("cityName").toString());
      }

      return usage;
    } catch (Exception ex) {
      log.error(ex.getMessage(), ex);
      return usage;
    }
  }
}
