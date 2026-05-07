package io.ventureplatform.dto.validation;

import lombok.SneakyThrows;
import org.apache.commons.beanutils.BeanUtils;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import java.util.Arrays;

import static org.springframework.util.ObjectUtils.isEmpty;

public class ConditionalValidator implements ConstraintValidator<Conditional, Object> {

  private String selected;
  private String[] required;
  private String message;
  private String[] values;

  @Override
  public void initialize(Conditional requiredIfChecked) {
    selected = requiredIfChecked.selected();
    required = requiredIfChecked.required();
    message = requiredIfChecked.message();
    values = requiredIfChecked.values();
  }

  @SneakyThrows
  @Override
  public boolean isValid(Object objectToValidate, ConstraintValidatorContext context) {
    boolean valid = true;
    Object actualValue = BeanUtils.getProperty(objectToValidate, selected);
    if (Arrays.asList(values).contains(actualValue)) {
      for (String propName : required) {
        Object requiredValue = BeanUtils.getProperty(objectToValidate, propName);
        valid = requiredValue != null && !isEmpty(requiredValue);
        if (!valid) {
          context.disableDefaultConstraintViolation();
          context.buildConstraintViolationWithTemplate(message).addPropertyNode(propName).addConstraintViolation();
        }
      }
    }
    return valid;
  }
}
