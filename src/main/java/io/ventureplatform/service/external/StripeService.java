package io.ventureplatform.service.external;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentMethod;
import com.stripe.model.Price;
import com.stripe.model.Subscription;
import com.stripe.model.SubscriptionCollection;
import com.stripe.model.SubscriptionItem;
import com.stripe.model.checkout.Session;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.SubscriptionListParams;
import com.stripe.param.billingportal.SessionCreateParams;
import io.ventureplatform.configuration.BrandingProperties;
import io.ventureplatform.dto.request.NewSubscriptionRequest;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.enums.SubscriptionType;
import io.ventureplatform.exception.custom.StripeFetchFailedException;
import io.ventureplatform.repository.UserRepository;
import io.ventureplatform.repository.VentureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Map;

import static io.ventureplatform.constant.AppConstants.SUBSCRIPTION_STATUS_ACTIVE;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripeService {
  @Value("${stripe.apiKey}")
  private String apiKey;
  @Value("${application.backend.url}")
  private String serverUrl;
  @Value("${stripe.prices.basic.monthly}")
  private String basicMonthlyPrice;
  @Value("${stripe.prices.basic.yearly}")
  private String basicYearlyPrice;
  @Value("${stripe.prices.pro.monthly}")
  private String proMonthlyPrice;
  @Value("${stripe.prices.pro.yearly}")
  private String proYearlyPrice;

  private final VentureRepository ventureRepository;
  private final UserRepository userRepository;
  private final BrandingProperties brandingProperties;

  @PostConstruct
  private void init() {
    Stripe.setMaxNetworkRetries(3);
    Stripe.setConnectTimeout(30 * 1000);
    Stripe.setReadTimeout(60 * 1000);
    Stripe.apiKey = apiKey;
  }

  public Session getCheckoutSession(String sessionId) {
    try {
      return Session.retrieve(sessionId);
    } catch (StripeException e) {
      throw new StripeFetchFailedException(e);
    }
  }

  public Customer getCustomer(String customerId) {
    return getCustomer(customerId, null);
  }

  public Customer getCustomer(String customerId, Map<String, Object> params) {
    try {
      return Customer.retrieve(customerId, params, null);
    } catch (StripeException e) {
      throw new StripeFetchFailedException(e);
    }
  }

  public PaymentMethod getPaymentMethod(String paymentMethodId) {
    try {
      return PaymentMethod.retrieve(paymentMethodId);
    } catch (StripeException e) {
      throw new StripeFetchFailedException(e);
    }
  }

  public boolean checkSubscriptionStatus(String subscriptionId) {
    try {
      Subscription subscription = Subscription.retrieve(subscriptionId);
      return SUBSCRIPTION_STATUS_ACTIVE.equals(subscription.getStatus());
    } catch (StripeException e) {
      throw new StripeFetchFailedException(e);
    }
  }

  public String getCustomerPortalLink(String subscriptionId) {
    try {
      Subscription subscription = Subscription.retrieve(subscriptionId);
      SessionCreateParams params = SessionCreateParams.builder()
        .setCustomer(subscription.getCustomer())
        .setReturnUrl(resolvePortalReturnUrl())
        .build();
      com.stripe.model.billingportal.Session session = com.stripe.model.billingportal.Session.create(params);
      return session.getUrl();
    } catch (StripeException e) {
      throw new StripeFetchFailedException(e);
    }
  }

  public void cancelUserSubscriptions(String stripeId) {
    try {
      SubscriptionListParams params = SubscriptionListParams.builder()
        .setCustomer(stripeId)
        .build();
      SubscriptionCollection subscriptions = Subscription.list(params);
      for (Subscription subscription : subscriptions.getData()) {
        subscription.cancel();
      }
    } catch (StripeException e) {
      log.error("Could not cancel user Stripe subscriptions", e);
      throw new StripeFetchFailedException(e);
    }
  }

  public List<Subscription> getCustomerSubscriptions(String customerId) {
    try {
      SubscriptionListParams params = SubscriptionListParams.builder().setCustomer(customerId).build();
      return Subscription.list(params).getData();
    } catch (StripeException ex) {
      throw new StripeFetchFailedException(ex);
    }
  }

  public List<String> getFreeSubscriptionSlots(User user) {
    return user.getCustomerIds().stream()
      .map(this::getCustomerSubscriptions)
      .flatMap(List::stream)
      .filter(s -> SUBSCRIPTION_STATUS_ACTIVE.equals(s.getStatus()))
      .map(Subscription::getId)
      .filter(id -> !ventureRepository.existsBySubscriptionId(id))
      .distinct()
      .toList();
  }

  private String resolvePortalReturnUrl() {
    return brandingProperties.normalizeUrl(brandingProperties.getAppBaseUrl()) + "/profile";
  }

  private String getPriceId(NewSubscriptionRequest request) {
    if ("basic".equals(request.getType())) {
      if ("month".equals(request.getPeriod())) {
        return basicMonthlyPrice;
      } else if ("year".equals(request.getPeriod())) {
        return basicYearlyPrice;
      }
    } else if ("pro".equals(request.getType())) {
      if ("month".equals(request.getPeriod())) {
        return proMonthlyPrice;
      } else if ("year".equals(request.getPeriod())) {
        return proYearlyPrice;
      }
    }
    return null;
  }

  private Customer createNewCustomer(User user) {
    try {
      CustomerCreateParams customerParams = CustomerCreateParams.builder()
        .setEmail(user.getEmail())
        .setName(user.getName() + " " + user.getLastName())
        .build();

      return Customer.create(customerParams);
    } catch (StripeException ex) {
      throw new RuntimeException(ex.getMessage(), ex);
    }
  }

  public Session createNewSubscription(User user, NewSubscriptionRequest request) {
    String priceId = getPriceId(request);
    String successUrl = request.getNewVenture() ? serverUrl + "ventures/profile-wizard?step=0" : serverUrl + "ventures";

    if (user.getCustomerIds().isEmpty()) {
      Customer customer = createNewCustomer(user);
      user.getCustomerIds().add(customer.getId());
      userRepository.save(user);
    }

    com.stripe.param.checkout.SessionCreateParams params = com.stripe.param.checkout.SessionCreateParams.builder()
      .addPaymentMethodType(com.stripe.param.checkout.SessionCreateParams.PaymentMethodType.CARD)
      .setMode(com.stripe.param.checkout.SessionCreateParams.Mode.SUBSCRIPTION)
      .setCustomer(user.getCustomerIds().iterator().next())
      .setSuccessUrl(successUrl)
      .setCancelUrl(serverUrl + "ventures")
      .setAllowPromotionCodes(true)
      .addLineItem(
        com.stripe.param.checkout.SessionCreateParams.LineItem.builder()
          .setQuantity(1L)
          .setPrice(priceId)
          .build()
      )
      .build();

    try {
      return Session.create(params);
    } catch (StripeException ex) {
      log.error(ex.getMessage(), ex);
      return null;
    }
  }

  public SubscriptionType getSubscriptionType(String subscriptionId) {
    if (subscriptionId == null) {
      return null;
    }

    try {
      Subscription subscription = Subscription.retrieve(subscriptionId);
      if (!subscription.getItems().getData().isEmpty()) {
        SubscriptionItem item = subscription.getItems().getData().get(0);
        Price price = item.getPrice();
        String priceId = price.getId();

        if (proYearlyPrice.equals(priceId) || proMonthlyPrice.equals(priceId)) {
          return SubscriptionType.PRO;
        } else if (basicYearlyPrice.equals(priceId) || basicMonthlyPrice.equals(priceId)) {
          return SubscriptionType.IMPACT_LOGIC;
        }
      }
      return null;
    } catch (StripeException ex) {
      log.error(ex.getMessage(), ex);
      return null;
    }
  }
}
