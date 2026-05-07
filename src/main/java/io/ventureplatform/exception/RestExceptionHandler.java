package io.ventureplatform.exception;

import io.ventureplatform.exception.custom.InvalidTokenException;
import io.ventureplatform.exception.custom.LinkedinException;
import io.ventureplatform.exception.custom.StripeDeserializationException;
import io.ventureplatform.exception.custom.StripeUnknownEventException;
import io.ventureplatform.exception.custom.TokenExpiredException;
import io.ventureplatform.exception.custom.UserInactiveException;
import io.ventureplatform.exception.custom.ValidationException;
import io.ventureplatform.exception.custom.WrongStripeSignatureException;
import io.jsonwebtoken.JwtException;
import io.sentry.Sentry;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.ClientAbortException;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.firewall.RequestRejectedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import javax.persistence.EntityNotFoundException;
import javax.servlet.http.HttpServletRequest;
import java.net.SocketTimeoutException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class RestExceptionHandler extends ResponseEntityExceptionHandler {
  private String getCurrentUser(HttpServletRequest request) {
    String user = null;
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && !String.class.isAssignableFrom(authentication.getPrincipal().getClass())) {
      user = authentication.getName();
    } else if (request != null) {
      user = request.getHeader("X-FORWARDED-FOR");
      if (StringUtils.isEmpty(user)) {
        user = request.getRemoteAddr();
      }
    }

    return StringUtils.isEmpty(user) ? "" : String.format("%s | ", user);
  }

  private String getRequestUrl(HttpServletRequest request) {
    String url = null;

    if (request != null && request.getRequestURL() != null) {
      url = request.getRequestURL().toString();
    }

    return StringUtils.isEmpty(url) ? "" : String.format("%s | ", url);
  }

  @ExceptionHandler({StripeDeserializationException.class, StripeUnknownEventException.class, ValidationException.class,
    RequestRejectedException.class, InvalidMediaTypeException.class, LinkedinException.class,
    MaxUploadSizeExceededException.class})
  protected ResponseEntity<ApiErrorResponse> handleBadRequestException(Exception ex, HttpServletRequest request) {
    log.warn(String.format("%s%s%s", getCurrentUser(request), getRequestUrl(request), ex.getMessage()));
    return ResponseEntity
      .status(HttpStatus.BAD_REQUEST)
      .body(new ApiErrorResponse(
        HttpStatus.BAD_REQUEST.value(),
        CustomExceptionUtils.getMessageForException(ex, "Bad request")
      ));
  }


  @ExceptionHandler({EmptyResultDataAccessException.class, EntityNotFoundException.class})
  protected ResponseEntity<ApiErrorResponse> handleNotFoundException(Exception ex, HttpServletRequest request) {
    log.warn(String.format("%s%s%s", getCurrentUser(request), getRequestUrl(request), ex.getMessage()));
    return ResponseEntity
      .status(HttpStatus.NOT_FOUND)
      .body(new ApiErrorResponse(
        HttpStatus.NOT_FOUND.value(),
        CustomExceptionUtils.getMessageForException(ex, "Not found")
      ));
  }

  @ExceptionHandler({AccessDeniedException.class, BadCredentialsException.class, JwtException.class,
    CredentialsExpiredException.class, InsufficientAuthenticationException.class, InvalidTokenException.class,
    WrongStripeSignatureException.class, UserInactiveException.class, TokenExpiredException.class})
  protected ResponseEntity<ApiErrorResponse> handleAuthException(Exception ex, HttpServletRequest request) {
    log.warn(String.format("%s%s%s", getCurrentUser(request), getRequestUrl(request), ex.getMessage()));
    return ResponseEntity
      .status(HttpStatus.UNAUTHORIZED)
      .body(new ApiErrorResponse(
        HttpStatus.UNAUTHORIZED.value(),
        CustomExceptionUtils.getMessageForException(ex, "Unauthorized")
      ));
  }

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
    MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatus status, WebRequest request
  ) {
    List<String> errors = ex.getBindingResult().getFieldErrors().stream()
      .map(e ->
        e.getField().replaceAll("\\[\\d+]", "")
          + " "
          + e.getObjectName()
          + " "
          + e.getDefaultMessage())
      .collect(Collectors.toList());

    List<String> globalErrors = ex.getBindingResult().getGlobalErrors().stream()
      .map(DefaultMessageSourceResolvable::getDefaultMessage)
      .collect(Collectors.toList());
    log.warn(ex.getMessage());

    String message = "";
    if (!errors.isEmpty()) {
      message += String.join(" ", errors);
    }
    if (!globalErrors.isEmpty()) {
      if (!errors.isEmpty()) {
        message += " ";
      }
      message += String.join(" ", globalErrors);
    }

    return ResponseEntity
      .status(HttpStatus.BAD_REQUEST)
      .body(new ApiErrorResponse(HttpStatus.BAD_REQUEST.value(), message));
  }

  @ExceptionHandler
  public ResponseEntity<ApiErrorResponse> handleUnknownException(Exception ex, HttpServletRequest request) {
    if (StringUtils.containsIgnoreCase(ExceptionUtils.getRootCauseMessage(ex), "Broken pipe")
      || StringUtils.containsIgnoreCase(ExceptionUtils.getRootCauseMessage(ex), "Connection reset by peer")
      || ex instanceof ClientAbortException
      || ex instanceof SocketTimeoutException) {
      log.error(Optional.ofNullable(ex.getMessage()).orElse("Connection reset/abort"));
      return null;
    }

    log.error(String.format("%s%s%s", getCurrentUser(request), getRequestUrl(request), ex.getMessage()), ex);
    Sentry.captureException(ex);

    return ResponseEntity
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .body(new ApiErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Something went wrong"));
  }
}
