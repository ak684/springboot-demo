package io.ventureplatform.controller;

import com.stripe.model.checkout.Session;
import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.ChangePasswordRequest;
import io.ventureplatform.dto.request.NewSubscriptionRequest;
import io.ventureplatform.dto.request.UserRequest;
import io.ventureplatform.dto.response.SubscriptionDetails;
import io.ventureplatform.configuration.SuperAdminConfiguration;
import io.ventureplatform.dto.response.UserResponse;
import io.ventureplatform.entity.User;
import io.ventureplatform.facade.UserFacade;
import io.ventureplatform.service.SecurityService;
import io.ventureplatform.service.UserService;
import io.ventureplatform.service.external.StripeService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(
    value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/users")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserController {
  /**
   * User service.
   */
  private final UserService userService;
  /**
   * User facade.
   */
  private final UserFacade userFacade;
  /**
   * Stripe service.
   */
  private final StripeService stripeService;
  /**
   * Security service.
   */
  private final SecurityService securityService;
  /**
   * Super admin configuration.
   */
  private final SuperAdminConfiguration superAdminConfiguration;

  /**
   * Check if current user is a superadmin.
   *
   * @return true if user is superadmin
   */
  @GetMapping("is-superadmin")
  public ResponseEntity<Boolean> isSuperAdmin() {
    return ResponseEntity.ok(securityService.isSuperAdmin());
  }

  /**
   * Get super admin information.
   *
   * @return map with superadmin status and notification email
   */
  @GetMapping("superadmin-info")
  public ResponseEntity<Map<String, Object>> getSuperAdminInfo() {
    Map<String, Object> info = new HashMap<>();
    info.put("isSuperAdmin", securityService.isSuperAdmin());
    info.put("notificationEmail",
             superAdminConfiguration.getNotificationEmail());
    return ResponseEntity.ok(info);
  }

  /**
   * Get user subscription details.
   *
   * @param user current user
   * @return list of subscription details
   */
  @GetMapping("subscriptions")
  public ResponseEntity<List<SubscriptionDetails>> getSubscriptionDetails(
      @CurrentUser final User user) {
    return ResponseEntity.ok(userService.getSubscriptionDetails(user));
  }

  /**
   * Get customer portal link.
   *
   * @param user current user
   * @param subscriptionId subscription id
   * @return portal link
   */
  @GetMapping("portal/link/{subscriptionId}")
  public ResponseEntity<String> getCustomerPortalLink(
      @CurrentUser final User user,
      @PathVariable final String subscriptionId) {
    if (user != null) {
      return ResponseEntity.ok(
          stripeService.getCustomerPortalLink(subscriptionId));
    } else {
      return null;
    }
  }

  /**
   * Upload user avatar.
   *
   * @param avatarUrl avatar URL
   * @param user current user
   */
  @PutMapping("avatar")
  public void uploadUserAvatar(@RequestBody final String avatarUrl,
                               @CurrentUser final User user) {
    userService.saveAvatar(user, avatarUrl);
  }

  /**
   * Update user profile.
   *
   * @param request user request
   * @param user current user
   * @return updated user response
   */
  @PutMapping("profile")
  public ResponseEntity<UserResponse> updateUserProfile(
    @RequestBody @Valid final UserRequest request,
    @CurrentUser final User user
  ) {
    return ResponseEntity.ok(userFacade.updateUserProfile(user, request));
  }

  /**
   * Change user password.
   *
   * @param request password change request
   * @param user current user
   */
  @PostMapping("change")
  public void changePassword(
      @Valid @RequestBody final ChangePasswordRequest request,
      @CurrentUser final User user) {
    userService.changePassword(request, user);
  }

  /**
   * Delete user account.
   *
   * @param user current user
   */
  @DeleteMapping("profile")
  public void deleteAccount(@CurrentUser final User user) {
    userService.deleteAccount(user);
  }

  /**
   * Create new subscription.
   *
   * @param user current user
   * @param request subscription request
   * @return subscription URL
   */
  @PostMapping("subscriptions")
  public ResponseEntity<String> createNewSubscription(
    @CurrentUser final User user,
    @RequestBody @Valid final NewSubscriptionRequest request
  ) {
    Session newSubscription = stripeService.createNewSubscription(
        user, request);
    return ResponseEntity.ok(newSubscription.getUrl());
  }
}
