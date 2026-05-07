package io.ventureplatform.exception.custom;

public class StripeDeserializationException extends RuntimeException {
  public StripeDeserializationException(String message) {
    super("Cannot deserialize message from Stripe: " + message);
  }
}
