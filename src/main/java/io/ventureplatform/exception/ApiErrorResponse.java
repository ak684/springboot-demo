package io.ventureplatform.exception;

import lombok.Data;

import java.io.Serializable;

@Data
public class ApiErrorResponse implements Serializable {
  private Integer code;
  private String message;

  public ApiErrorResponse(Integer code) {
    this.code = code;
  }

  public ApiErrorResponse(Integer code, String message) {
    this(code);
    this.message = message;
  }
}
