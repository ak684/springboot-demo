package io.ventureplatform.facade;

import io.ventureplatform.dto.request.UserRequest;
import io.ventureplatform.dto.response.UserResponse;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserFacade extends AbstractDtoFacade<UserRequest, UserResponse, User> {
  private final UserService userService;

  public UserResponse findByEmail(String email) {
    return entityToDto(userService.findByEmail(email.toLowerCase()));
  }

  public UserResponse updateUserProfile(User user, UserRequest request) {
    return entityToDto(userService.updateUserProfile(user, request));
  }

  public UserResponse findByPasswordResetToken(String token, String process) {
    return entityToDto(userService.findUserByPasswordResetToken(token, process));
  }

  public UserResponse createUserProfile(String token, UserRequest request) {
    return entityToDto(userService.createUserProfile(token, request));
  }

  public UserResponse createUserProfile(UserRequest request) {
    return entityToDto(userService.createUserProfile(request));
  }

  public UserResponse findBySessionId(String sessionId) {
    return entityToDto(userService.findBySessionId(sessionId));
  }
}

