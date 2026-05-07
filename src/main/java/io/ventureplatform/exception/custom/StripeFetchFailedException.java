package io.ventureplatform.exception.custom;

import com.stripe.exception.StripeException;

public class StripeFetchFailedException extends RuntimeException {
  public StripeFetchFailedException(StripeException ex) {
    super(ex.getMessage(), ex);
  }
}
