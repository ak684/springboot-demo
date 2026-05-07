package io.ventureplatform.exception.custom;

public class PdfGenerationFailedException extends RuntimeException {
  public PdfGenerationFailedException(Throwable cause) {
    super(cause.getMessage(), cause);
  }
}
