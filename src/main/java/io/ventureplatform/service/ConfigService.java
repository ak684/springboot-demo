package io.ventureplatform.service;

import io.ventureplatform.dto.request.UserConfigUpdateRequest;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.UserConfig;
import io.ventureplatform.exception.custom.ValidationException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.beanutils.BeanUtils;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.lang.reflect.InvocationTargetException;

@Service
@RequiredArgsConstructor
public class ConfigService {
  private final UserService userService;

  @Transactional
  public void updateUserConfigValue(User user, UserConfigUpdateRequest request) {
    if (user != null) {
      UserConfig config = user.getConfig();
      try {
        BeanUtils.copyProperty(config, request.getName(), request.getValue());
        userService.update(user.getId(), user);
      } catch (IllegalAccessException | InvocationTargetException ex) {
        throw new ValidationException("Cannot update property " + request.getName());
      }
    }
  }
}
