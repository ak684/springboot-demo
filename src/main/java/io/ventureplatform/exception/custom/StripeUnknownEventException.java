package io.ventureplatform.exception.custom;

public class StripeUnknownEventException extends RuntimeException {
  public StripeUnknownEventException(String message) {
    super("Unknown event from Stripe: " + message);
  }
}
