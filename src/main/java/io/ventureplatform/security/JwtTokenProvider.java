package io.ventureplatform.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtTokenProvider {
  @Value("${token.secret}")
  private String secret;
  @Value("${token.expiration.short}")
  private Long tokenLifeShort;
  @Value("${token.expiration.long}")
  private Long tokenLifeLong;

  public String createToken(String username, boolean rememberMe) {
    Date now = new Date();
    long duration = now.getTime();

    if (rememberMe) {
      duration += tokenLifeLong;
    } else {
      duration += tokenLifeShort;
    }
    Date expiryDate = new Date(now.getTime() + duration);

    return Jwts.builder()
      .setSubject(username)
      .setIssuedAt(new Date())
      .setExpiration(expiryDate)
      .signWith(SignatureAlgorithm.HS512, secret)
      .compact();
  }

  public String getUsernameFromToken(String token) {
    Claims claims = Jwts.parser()
      .setSigningKey(secret)
      .parseClaimsJws(token)
      .getBody();

    return claims.getSubject();
  }

  public boolean validateToken(String authToken) {
    try {
      Jwts.parser().setSigningKey(secret).parseClaimsJws(authToken);
      return true;
    } catch (SignatureException ex) {
      throw new SignatureException("Invalid JWT signature");
    } catch (MalformedJwtException ex) {
      throw new MalformedJwtException("Invalid JWT token");
    } catch (ExpiredJwtException ex) {
      throw new ExpiredJwtException(ex.getHeader(), ex.getClaims(), "Expired JWT token");
    } catch (UnsupportedJwtException ex) {
      throw new UnsupportedJwtException("Unsupported JWT token");
    } catch (IllegalArgumentException ex) {
      throw new IllegalArgumentException("JWT claims string is empty.");
    }
  }
}
