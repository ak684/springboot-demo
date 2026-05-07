package io.ventureplatform.dto.validation;

import org.springframework.beans.BeanWrapperImpl;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

public class FieldMatchValidator implements ConstraintValidator<FieldMatch, Object> {

  private String field;
  private String fieldMatch;

  @Override
  public void initialize(final FieldMatch constraintAnnotation) {
    this.field = constraintAnnotation.field();
    this.fieldMatch = constraintAnnotation.fieldMatch();
  }

  @Override
  public boolean isValid(final Object value, final ConstraintValidatorContext context) {
    final Object firstObj = new BeanWrapperImpl(value).getPropertyValue(field);
    final Object secondObj = new BeanWrapperImpl(value).getPropertyValue(fieldMatch);

    return firstObj != null && firstObj.equals(secondObj);
  }
}
