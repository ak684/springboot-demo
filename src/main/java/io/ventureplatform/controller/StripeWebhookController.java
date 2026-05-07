package io.ventureplatform.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.Subscription;
import com.stripe.net.Webhook;
import io.ventureplatform.exception.custom.StripeDeserializationException;
import io.ventureplatform.exception.custom.StripeUnknownEventException;
import io.ventureplatform.exception.custom.WrongStripeSignatureException;
import io.ventureplatform.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("api/v1/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {
  @Value("${stripe.webhookSecret}")
  private String endpointSecret;

  private final UserService userService;

  @PostMapping("webhook")
  public ResponseEntity handleWebhook(@RequestBody String payload, HttpServletRequest request) {
    String sigHeader = request.getHeader("Stripe-Signature");
    Event event;

    try {
      event = Webhook.constructEvent(payload, sigHeader, endpointSecret, 60L);
    } catch (SignatureVerificationException e) {
      throw new WrongStripeSignatureException(payload, e);
    }

    EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
    StripeObject stripeObject = null;
    if (dataObjectDeserializer.getObject().isPresent()) {
      stripeObject = dataObjectDeserializer.getObject().get();
    } else {
      throw new StripeDeserializationException(event.getData().toString());
    }

    switch (event.getType()) {
      case "customer.subscription.created":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        Subscription subscription = (Subscription) stripeObject;
        userService.subscriptionUpdated(subscription);
        break;
      }
      default:
        throw new StripeUnknownEventException(event.getData().toJson());
    }

    return ResponseEntity.status(200).build();
  }
}
