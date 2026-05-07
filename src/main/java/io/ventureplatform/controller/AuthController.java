package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.ForgotPasswordRequest;
import io.ventureplatform.dto.request.LoginRequest;
import io.ventureplatform.dto.request.ResetPasswordRequest;
import io.ventureplatform.dto.request.StudentAccessRequest;
import io.ventureplatform.dto.request.UserRequest;
import io.ventureplatform.dto.response.UserResponse;
import io.ventureplatform.entity.User;
import io.ventureplatform.exception.custom.UserInactiveException;
import io.ventureplatform.facade.UserFacade;
import io.ventureplatform.repository.UserRepository;
import io.ventureplatform.security.JwtTokenProvider;
import io.ventureplatform.service.UserService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.transaction.Transactional;
import javax.validation.Valid;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthenticationManager authenticationManager;
  private final JwtTokenProvider jwtTokenProvider;
  private final UserFacade userFacade;
  private final UserService userService;
  private final UserRepository userRepository;

  @GetMapping("/current")
  @Transactional
  public ResponseEntity<UserResponse> getCurrentUser(@CurrentUser User user) {
    if (user != null) {
      userRepository.updateLastSeen(user.getEmail().toLowerCase());
    }

    return ResponseEntity.ok(userFacade.entityToDto(user));
  }

  @PostMapping("/login")
  public ResponseEntity<UserResponse> loginUser(@Valid @RequestBody LoginRequest request) {
    Authentication authentication = authenticationManager.authenticate(
      new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase(), request.getPassword())
    );
    return authenticateUser(request.getEmail().toLowerCase(), authentication, true);
  }

  @PostMapping("/register")
  public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody UserRequest request) {
    UserResponse user = userFacade.createUserProfile(request);
    Authentication authentication = authenticationManager.authenticate(
      new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase(), request.getPassword())
    );
    return authenticateUser(user.getEmail(), authentication, false);
  }

  private ResponseEntity<UserResponse> authenticateUser(
    String username, Authentication authentication, boolean rememberMe
  ) {
    SecurityContextHolder.getContext().setAuthentication(authentication);
    UserResponse response = userFacade.findByEmail(username);

    return ResponseEntity.ok()
      .header(
        HttpHeaders.AUTHORIZATION,
        "Bearer " + jwtTokenProvider.createToken(username, rememberMe)
      )
      .body(response);
  }

  @PostMapping("forgot")
  public void resetPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    userService.forgotPassword(request);
  }

  @PostMapping("reset")
  public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    userService.resetPassword(request);
  }

  @PostMapping("/student-access-request")
  public ResponseEntity<String> requestStudentAccess(@Valid @RequestBody StudentAccessRequest request) {
    userService.handleStudentAccessRequest(request);
    return ResponseEntity.ok("Student access request submitted successfully");
  }

  @GetMapping("intro/{token}")
  public ResponseEntity<UserResponse> getUserIntroDetails(@PathVariable String token) {
    return ResponseEntity.ok(userFacade.findByPasswordResetToken(token, "getting intro details"));
  }

  @GetMapping("intro/session/{sessionId}")
  public ResponseEntity<UserResponse> getUserIntroByStripeCheckoutSession(@PathVariable String sessionId) {
    UserResponse response = userFacade.findBySessionId(sessionId);

    if (response == null) {
      throw new UserInactiveException(sessionId);
    }

    return ResponseEntity.ok(response);
  }

  @PostMapping("/profile/{token}")
  public ResponseEntity<UserResponse> createUserProfile(
    @PathVariable String token,
    @Valid @RequestBody UserRequest request
  ) {
    UserResponse user = userFacade.createUserProfile(token, request);
    Authentication authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), null);
    return authenticateUser(user.getEmail(), authentication, false);
  }
}
