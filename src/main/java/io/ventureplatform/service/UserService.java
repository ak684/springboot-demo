package io.ventureplatform.service;

import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentMethod;
import com.stripe.model.Price;
import com.stripe.model.Product;
import com.stripe.model.Subscription;
import com.stripe.model.SubscriptionItem;
import com.stripe.model.checkout.Session;
import io.ventureplatform.dto.request.ChangePasswordRequest;
import io.ventureplatform.dto.request.ForgotPasswordRequest;
import io.ventureplatform.dto.request.ResetPasswordRequest;
import io.ventureplatform.dto.request.StudentAccessRequest;
import io.ventureplatform.dto.request.UserRequest;
import io.ventureplatform.dto.response.SubscriptionDetails;
import io.ventureplatform.entity.Organization;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.enums.Geography;
import io.ventureplatform.exception.custom.InvalidTokenException;
import io.ventureplatform.exception.custom.TokenExpiredException;
import io.ventureplatform.exception.custom.ValidationException;
import io.ventureplatform.repository.OrganizationRepository;
import io.ventureplatform.repository.PortfolioMemberAccessRepository;
import io.ventureplatform.repository.UserRepository;
import io.ventureplatform.repository.VentureMemberAccessRepository;
import io.ventureplatform.repository.VentureRepository;
import io.ventureplatform.service.external.StripeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.codehaus.plexus.util.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static io.ventureplatform.constant.AppConstants.ONE_DAY_MILLIS;
import static io.ventureplatform.constant.AppConstants.SUBSCRIPTION_STATUS_ACTIVE;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService extends AbstractBaseEntityService<User> {
  private final UserRepository userRepository;
  private final VentureRepository ventureRepository;
  private final OrganizationRepository organizationRepository;
  private final StripeService stripeService;
  private final EmailService emailService;
  private final BrandResolver brandResolver;
  private final PasswordEncoder passwordEncoder;
  private final VentureMemberAccessRepository ventureMemberAccessRepository;
  private final PortfolioMemberAccessRepository portfolioMemberAccessRepository;

  public User findByEmail(String email) {
    return userRepository.findByEmail(email.toLowerCase()).orElse(null);
  }

  public void subscriptionUpdated(Subscription subscription) {
    String customerId = subscription.getCustomer();
    User user = userRepository.findByCustomerIdsContains(customerId);

    if (user == null) {
      log.info(String.format("Creating new account for customer %s", customerId));
      Customer customer = stripeService.getCustomer(customerId);
      User existing = findByEmail(customer.getEmail());
      if (existing == null) {
        user = createUserAccount(
          customer.getEmail(),
          customer.getName(),
          customer.getId(),
          customer.getAddress() != null ? customer.getAddress().getCountry() : null
        );
        emailService.sendWelcomeEmail(user, brandResolver.forUser(user));
      } else {
        existing.getCustomerIds().add(customerId);
        userRepository.save(existing);
      }
    } else {
      Venture venture = ventureRepository.findBySubscriptionId(subscription.getId());
      if (venture != null) {
        venture.setActive(SUBSCRIPTION_STATUS_ACTIVE.equals(subscription.getStatus()));
        venture.setSubscriptionType(stripeService.getSubscriptionType(subscription.getId()));
        ventureRepository.save(venture);
      }
    }
  }

  public User createUserAccount(String email, String name, String customerId, String countryCode) {
    Organization organization = new Organization();
    organization = organizationRepository.save(organization);

    String firstName = name;
    String lastName = null;

    if (StringUtils.isNotEmpty(name)) {
      int spaceIndex = name.indexOf(' ');

      if (spaceIndex > -1) {
        firstName = name.substring(0, spaceIndex);
        lastName = name.substring(spaceIndex + 1);
      }
    }

    User user = new User()
      .setEmail(email.toLowerCase())
      .setName(firstName)
      .setLastName(lastName)
      .setOrganization(organization);
    user.setHomeBrandKey(brandResolver.getKeyForCurrentRequest());
    user.getConfig().setUser(user);

    if (customerId != null) {
      user.getCustomerIds().add(customerId);
      user
        .setPasswordResetToken(UUID.randomUUID().toString())
        .setTokenExpiryDate(System.currentTimeMillis() + ONE_DAY_MILLIS * 7);
    }

    if (countryCode != null) {
      Geography country = Arrays.stream(Geography.values())
        .filter(g -> g.getCode() != null && g.getCode().equals(countryCode))
        .findFirst()
        .orElse(null);
      user.setCountry(country);
    }

    try {
      return userRepository.save(user);
    } catch (Exception e) {
      log.error(e.getMessage(), e);
      return null;
    }
  }

  public User createInvitedAccount(String email, String name, String lastName) {
    User user = new User()
      .setEmail(email.toLowerCase())
      .setName(name)
      .setLastName(lastName)
      .setPasswordResetToken(UUID.randomUUID().toString())
      .setTokenExpiryDate(System.currentTimeMillis() + ONE_DAY_MILLIS * 30);
    user.setHomeBrandKey(brandResolver.getKeyForCurrentRequest());
    user.getConfig().setUser(user);

    return userRepository.save(user);
  }

  public User findBySessionId(String sessionId) {
    Session session = stripeService.getCheckoutSession(sessionId);
    return userRepository.findByCustomerIdsContains(session.getCustomer());
  }

  public List<SubscriptionDetails> getSubscriptionDetails(User user) {
    if (user == null) {
      return null;
    }

    return user.getCustomerIds().stream()
      .map(stripeService::getCustomerSubscriptions)
      .flatMap(List::stream)
      .map(subscription -> {
        PaymentMethod paymentMethod = stripeService.getPaymentMethod(subscription.getDefaultPaymentMethod());

        SubscriptionDetails details = new SubscriptionDetails()
          .setSubscriptionEnd(subscription.getCurrentPeriodEnd())
          .setRenew(!subscription.getCancelAtPeriodEnd())
          .setLast4(paymentMethod != null && paymentMethod.getCard() != null ? paymentMethod.getCard().getLast4() : null)
          .setCardType(paymentMethod != null && paymentMethod.getCard() != null ? paymentMethod.getCard().getBrand() : null)
          .setSubscriptionId(subscription.getId());

        if (!subscription.getItems().getData().isEmpty()) {
          SubscriptionItem item = subscription.getItems().getData().get(0);
          Price price = item.getPrice();
          details.setInterval(price.getRecurring().getInterval());

          try {
            Product product = Product.retrieve(price.getProduct());
            details.setProduct(product.getName());
          } catch (StripeException ex) {
            log.error(ex.getMessage(), ex);
          }
        }
        Venture venture = ventureRepository.findBySubscriptionId(subscription.getId());
        if (venture != null) {
          details.setVenture(venture.getName());
        }

        return details;
      })
      .toList();
  }

  public void forgotPassword(ForgotPasswordRequest request) {
    Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());

    if (optionalUser.isPresent()) {
      User user = optionalUser.get();
      String resetToken = UUID.randomUUID().toString();
      user
        .setPasswordResetToken(resetToken)
        .setTokenExpiryDate(System.currentTimeMillis() + ONE_DAY_MILLIS);
      userRepository.save(user);
      emailService.sendForgotPasswordEmail(user, brandResolver.forCurrentRequest());
    }
  }

  public void resetPassword(ResetPasswordRequest request) {
    User user = findUserByPasswordResetToken(request.getToken(), "password reset");
    user.setPassword(passwordEncoder.encode(request.getPassword()))
      .setPasswordResetToken(null)
      .setTokenExpiryDate(null);
    userRepository.save(user);
  }

  public void changePassword(ChangePasswordRequest request, User user) {
    if (user != null) {
      if (user.getPassword() != null && request.getPassword() == null) {
        throw new ValidationException("You need to provide the current password");
      }

      if (user.getPassword() != null && !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new ValidationException("Current password is incorrect");
      }

      user.setPassword(passwordEncoder.encode(request.getNewPassword()));
      user.setPasswordResetToken(null);
      super.update(user.getId(), user);
    }
  }

  public void saveAvatar(User user, String avatarUrl) {
    if (user != null) {
      user.setAvatar(avatarUrl);
      userRepository.save(user);
    }
  }

  public User updateUserProfile(User user, UserRequest request) {
    request.setId(user.getId());
    BeanUtils.copyProperties(request, user, "id", "password", "email");

    return userRepository.save(user);
  }

  public User findUserByPasswordResetToken(String token, String process) {
    User user = userRepository.findByPasswordResetToken(token);

    if (user == null) {
      throw new InvalidTokenException(String.format("Invalid token provided during %s: %s", process, token));
    } else if (user.getTokenExpiryDate() < System.currentTimeMillis()) {
      throw new TokenExpiredException("Expired token provided for user " + user.getEmail());
    }

    return user;
  }

  public User createUserProfile(UserRequest request) {
    User user = createUserAccount(request.getEmail(), request.getName(), null, null);
    BeanUtils.copyProperties(request, user, "id", "country", "password");
    user.setPassword(passwordEncoder.encode(request.getPassword())).setLastSeen(new Date());
    emailService.sendWelcomeEmail(user, brandResolver.forCurrentRequest());
    return userRepository.save(user);
  }

  public User createUserProfile(String token, UserRequest request) {
    User user = findUserByPasswordResetToken(token, "profile creation");
    BeanUtils.copyProperties(request, user, "id", "email", "country", "password");
    user.setPassword(passwordEncoder.encode(request.getPassword()))
      .setPasswordResetToken(null)
      .setTokenExpiryDate(null)
      .setLastSeen(new Date());

    return userRepository.save(user);
  }

  @Transactional
  public void deleteAccount(User user) {
    ventureMemberAccessRepository.deleteAll(user.getVentures());
    portfolioMemberAccessRepository.deleteAll(user.getPortfolios());

    user.getCustomerIds().forEach(stripeService::cancelUserSubscriptions);

    // toDO: Update this method once we might have more than one account owner on organization level
    if (user.getOrganization() != null) {
      List<Venture> createdVentures = user.getOrganization().getVentures();
      for (Venture venture : createdVentures) {
        ventureMemberAccessRepository.deleteAll(venture.getMembers());
      }

      List<Portfolio> createdPortfolios = user.getOrganization().getPortfolios();
      for (Portfolio portfolio : createdPortfolios) {
        portfolioMemberAccessRepository.deleteAll(portfolio.getMembers());
      }
    }

    emailService.sendAccountDeactivatedEmail(user, brandResolver.forUser(user));
    Long userId = user.getId();
    user = new User()
      .setName("User" + user.getId())
      .setEmail("user_" + UUID.randomUUID())
      .setOrganization(user.getOrganization());
    user.setId(userId);
    user.getConfig().setUser(user);

    userRepository.save(user);
  }

  public void handleStudentAccessRequest(StudentAccessRequest request) {
    log.info("Student access request received for email: {}", request.getEmail());
    
    try {
      emailService.sendStudentAccessRequestEmail(request.getEmail(), brandResolver.forCurrentRequest());
      log.info("Student access request email sent successfully for: {}", request.getEmail());
    } catch (Exception e) {
      // Log error but don't fail the request - fallback to just logging
      log.error("Failed to send student access request email for: {}. Error: {}", 
                request.getEmail(), e.getMessage());
      // Continue anyway - at least the request is logged
    }
  }
}
