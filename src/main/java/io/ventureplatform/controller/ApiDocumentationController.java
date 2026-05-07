package io.ventureplatform.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ApiDocumentationController {

  @Value("${server.port:9000}")
  private String serverPort;

  @GetMapping("/api-docs")
  public String getApiDocumentation(Model model) {
    // Add any dynamic values needed in the template
    model.addAttribute("serverPort", serverPort);
    return "api-documentation";
  }
}
