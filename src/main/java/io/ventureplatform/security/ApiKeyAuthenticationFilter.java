package io.ventureplatform.security;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String uri = request.getRequestURI();
    
    // Skip filter for counter endpoints (they are truly public)
    if (uri.startsWith("/api/v1/public/counters/")) {
      return true;  // Skip this filter for counter endpoints
    }
    
    // Skip filter for public profile endpoints (they are truly public)
    // BUT NOT for the indicators endpoint which requires API key
    if (uri.matches("/api/v1/public/portfolios/\\d+/indicators")) {
      return false;  // DO apply filter for indicators endpoint - it needs API key
    }
    
    if (uri.startsWith("/api/v1/public/branding")
        || uri.startsWith("/api/v1/public/portfolios/")
        || uri.startsWith("/api/v1/public/ventures")
        || uri.startsWith("/api/v1/public/companies/")) {
      return true;  // Skip this filter for public profile endpoints
    }
    
    // Only filter public API endpoints that need API key
    return !request.getRequestURI().startsWith("/api/v1/public/");
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {

    String apiKey = request.getHeader("X-API-Key");

    // Check if API key exists and matches pattern
    if (apiKey == null || !apiKey.matches("vip-api-\\d+-defaultkey")) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      response.getWriter().write("{\"error\": \"Invalid or missing API key\"}");
      return;
    }

    // Extract portfolio ID from API key
    String[] parts = apiKey.split("-");
    Long portfolioId = Long.parseLong(parts[2]);

    // Add portfolio ID to request for validation in controller
    request.setAttribute("api_portfolio_id", portfolioId);

    filterChain.doFilter(request, response);
  }
}
