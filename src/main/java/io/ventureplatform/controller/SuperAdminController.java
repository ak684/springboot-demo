package io.ventureplatform.controller;

import com.fasterxml.jackson.annotation.JsonView;
import com.stripe.exception.StripeException;
import com.stripe.model.Discount;
import com.stripe.model.Price;
import com.stripe.model.Product;
import com.stripe.model.SubscriptionItem;
import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.response.SubscriptionDetails;
import io.ventureplatform.dto.response.VentureResponse;
import io.ventureplatform.dto.response.Views;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.User;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.facade.VentureFacade;
import io.ventureplatform.repository.UserRepository;
import io.ventureplatform.repository.VentureRepository;
import io.ventureplatform.service.external.StripeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/superadmin")
@RequiredArgsConstructor
@PreAuthorize("isSuperAdmin()")
public class SuperAdminController {
  private final StripeService stripeService;
  private final UserRepository userRepository;
  private final VentureFacade ventureFacade;
  private final VentureRepository ventureRepository;

  @GetMapping
  public ResponseEntity<List<Map<String, Object>>> getSuperAdminStatistics() {
    List<Map<String, Object>> response = new ArrayList<>();
    List<User> users = userRepository.findAllByOrderByCreatedAtDesc();

    users.forEach(user -> {
      Map<String, Object> userData = new HashMap<>();
      userData.put("email", user.getEmail());
      userData.put("name", user.getName());
      userData.put("hasPassword", user.getPassword() != null);
      userData.put("lastName", user.getLastName());
      userData.put("createdAt", user.getCreatedAt());
      userData.put("customerIds", user.getCustomerIds());

      if (!user.getCustomerIds().isEmpty()) {
        List<SubscriptionDetails> subscriptions = user.getCustomerIds().stream()
          .map(stripeService::getCustomerSubscriptions)
          .flatMap(List::stream)
          .map(subscription -> {
            SubscriptionDetails details = new SubscriptionDetails();
            details
              .setSubscriptionEnd(subscription.getCurrentPeriodEnd())
              .setRenew(!subscription.getCancelAtPeriodEnd())
              .setSubscriptionId(subscription.getId());

            details.setCreatedAt(new Date(subscription.getCreated() * 1000));

            if (!subscription.getItems().getData().isEmpty()) {
              SubscriptionItem item = subscription.getItems().getData().get(0);
              Price price = item.getPrice();
              details.setInterval(price.getRecurring().getInterval());

              try {
                Product product = Product.retrieve(price.getProduct());
                details.setProduct(product.getName());
              } catch (StripeException ex) {
                // ignore
              }
            }

            if (subscription.getDiscount() != null) {
              Discount discount = subscription.getDiscount();
              if (discount.getCoupon() != null) {
                details.setDiscount(discount.getCoupon().getName());
              }
            }

            return details;
          })
          .toList();

        userData.put("subscriptions", subscriptions);
      }

      if (user.getOrganization() != null) {
        List<Venture> ventures = user.getOrganization().getVentures();
        List<Portfolio> portfolios = user.getOrganization().getPortfolios();

        userData.put("ventures", ventures.stream().map(venture -> {
          Map<String, Object> ventureData = new HashMap<>();
          ventureData.put("id", venture.getId());
          ventureData.put("name", venture.getName());
          ventureData.put("lastModified", venture.getLastModifiedAt());
          ventureData.put("subscriptionId", venture.getSubscriptionId());
          ventureData.put("active", venture.getActive());
          return ventureData;
        }));
        userData.put("portfolios", portfolios.stream().map(portfolio -> {
          Map<String, Object> portfolioData = new HashMap<>();
          portfolioData.put("id", portfolio.getId());
          portfolioData.put("name", portfolio.getName());
          portfolioData.put("lastModified", portfolio.getLastModifiedAt());
          return portfolioData;
        }));
      }

      response.add(userData);
    });
    return ResponseEntity.ok(response);
  }

  @GetMapping("ventures")
  @JsonView(Views.Basic.class)
  public ResponseEntity<List<VentureResponse>> getAllVentures() {
    return ResponseEntity.ok(ventureFacade.entitiesToDtoList(ventureRepository.findAll()));
  }

  @PutMapping("certification/{ventureId}")
  public void updateVentureCertification(
    @PathVariable(name = "ventureId") Venture venture,
    @RequestBody Integer newLevel
  ) {
    venture.setCertification(newLevel);
    ventureRepository.save(venture);
  }
}

