package io.ventureplatform.exception;

import io.ventureplatform.exception.custom.AuthorizationException;
import io.ventureplatform.exception.custom.InvalidTokenException;
import io.ventureplatform.exception.custom.TokenExpiredException;
import io.ventureplatform.exception.custom.UserInactiveException;
import io.ventureplatform.exception.custom.ValidationException;
import io.ventureplatform.exception.custom.WrongStripeSignatureException;
import io.jsonwebtoken.JwtException;
import org.springframework.cglib.core.internal.Function;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import java.util.HashMap;
import java.util.Map;

public class CustomExceptionUtils {
  private static final Map<Class<? extends Throwable>, Function<Throwable, String>> EXCEPTION_MESSAGES = new HashMap<>();

  static {
    // 400
    EXCEPTION_MESSAGES.put(MaxUploadSizeExceededException.class, (ex) -> "The selected file is too large");
    EXCEPTION_MESSAGES.put(MultipartException.class, (ex) -> "Cannot upload file");
    EXCEPTION_MESSAGES.put(ValidationException.class, Throwable::getMessage);

    // 401
    EXCEPTION_MESSAGES.put(AccessDeniedException.class, (ex) -> "You don't have permission to access this resource");
    EXCEPTION_MESSAGES.put(
      InsufficientAuthenticationException.class,
      (ex) -> "You don't have permission to access this resource"
    );
    EXCEPTION_MESSAGES.put(JwtException.class, (ex) -> "Your credentials are invalid");
    EXCEPTION_MESSAGES.put(InvalidTokenException.class, (ex) -> "Your access token is invalid");
    EXCEPTION_MESSAGES.put(BadCredentialsException.class, (ex) -> "Wrong username or password");
    EXCEPTION_MESSAGES.put(CredentialsExpiredException.class, (ex) -> "Your token has expired");
    EXCEPTION_MESSAGES.put(WrongStripeSignatureException.class, (ex) -> "Invalid signature");
    EXCEPTION_MESSAGES.put(UserInactiveException.class, (ex) -> "Your account is not active");
    EXCEPTION_MESSAGES.put(TokenExpiredException.class, (ex) -> "Your link has expired. Request a new one");

    // 403
    EXCEPTION_MESSAGES.put(AuthorizationException.class, (ex) -> "You don't have permission to do this action");
  }

  public static String getMessageForException(Throwable exception, String fallback) {
    Function<Throwable, String> messageFunc = EXCEPTION_MESSAGES.get(exception.getClass());

    if (messageFunc == null) {
      return fallback;
    } else {
      return messageFunc.apply(exception);
    }
  }

  private CustomExceptionUtils() {
  }
}
