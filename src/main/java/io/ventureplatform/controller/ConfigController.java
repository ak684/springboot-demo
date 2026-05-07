package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.UserConfigUpdateRequest;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.ConfigService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/config")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ConfigController {
  private final ConfigService configService;

  @PutMapping("user")
  public void updateUserConfigValue(@CurrentUser User user, @Valid @RequestBody UserConfigUpdateRequest request) {
    configService.updateUserConfigValue(user, request);
  }
}
