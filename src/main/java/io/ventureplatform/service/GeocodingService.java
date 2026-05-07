package io.ventureplatform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@Slf4j
public class GeocodingService {

  private static final String GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";
  
  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;
  
  @Value("${google.api.mapsKey}")
  private String googleMapsApiKey;

  public GeocodingService(RestTemplate restTemplate, ObjectMapper objectMapper) {
    this.restTemplate = restTemplate;
    this.objectMapper = objectMapper;
  }

  public static class Coordinates {
    public final Double latitude;
    public final Double longitude;

    public Coordinates(Double latitude, Double longitude) {
      this.latitude = latitude;
      this.longitude = longitude;
    }
  }

  /**
   * Geocode an address to get latitude and longitude
   * @param address The address to geocode
   * @return Coordinates or null if geocoding fails
   */
  public Coordinates geocodeAddress(String address) {
    if (address == null || address.trim().isEmpty()) {
      return null;
    }

    try {
      String url = UriComponentsBuilder.fromHttpUrl(GEOCODING_API_URL)
          .queryParam("address", address)
          .queryParam("key", googleMapsApiKey)
          .build()
          .toUriString();

      String response = restTemplate.getForObject(url, String.class);
      JsonNode root = objectMapper.readTree(response);
      
      String status = root.path("status").asText();
      if (!"OK".equals(status)) {
        log.warn("Geocoding failed for address '{}': {}", address, status);
        return null;
      }

      JsonNode results = root.path("results");
      if (results.isArray() && results.size() > 0) {
        JsonNode location = results.get(0).path("geometry").path("location");
        Double lat = location.path("lat").asDouble();
        Double lng = location.path("lng").asDouble();
        
        log.debug("Geocoded '{}' to lat: {}, lng: {}", address, lat, lng);
        return new Coordinates(lat, lng);
      }

      return null;
    } catch (Exception e) {
      log.error("Error geocoding address '{}': {}", address, e.getMessage());
      return null;
    }
  }
}
