package io.ventureplatform.exception.custom;

public class EmailSendFailedException extends RuntimeException {
  public EmailSendFailedException(Exception ex) {
    super(ex);
  }
}
