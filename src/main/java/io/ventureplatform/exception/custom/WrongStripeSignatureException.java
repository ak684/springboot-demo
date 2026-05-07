package io.ventureplatform.exception.custom;

public class WrongStripeSignatureException extends RuntimeException {
  public WrongStripeSignatureException(String payload, Throwable cause) {
    super("Invalid Stripe signature: " + payload, cause);
  }
}
