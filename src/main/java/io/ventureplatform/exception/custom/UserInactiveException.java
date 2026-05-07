package io.ventureplatform.exception.custom;

import io.ventureplatform.entity.User;

public class UserInactiveException extends RuntimeException {
  public UserInactiveException(String sessionId) {
    super("Could not find user for Stripe checkout session id: " + sessionId);
  }

  public UserInactiveException(User user) {
    super("Attempt to log in by inactive user: " + user.getEmail());
  }
}
