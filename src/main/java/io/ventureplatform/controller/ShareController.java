package io.ventureplatform.controller;

import io.ventureplatform.service.external.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;

@Controller
@RequestMapping("/share")
@RequiredArgsConstructor
public class ShareController {
  private final CloudinaryService cloudinaryService;

  private ModelAndView shareChart(String imageId, String title, String url) {
    ModelAndView response = new ModelAndView("share");

    response.addObject("imageUrl", cloudinaryService.getUrl(imageId));
    response.addObject("title", title);
    response.addObject("url", url);

    return response;
  }

  @GetMapping("impacts/{imageId}")
  public ModelAndView shareImpactsChart(@PathVariable String imageId, HttpServletRequest request) {
    return shareChart(imageId, "Most important impact areas", request.getRequestURL().toString());
  }

  @GetMapping("scoring/{imageId}")
  public ModelAndView shareScoringOverTimeChart(@PathVariable String imageId, HttpServletRequest request) {
    return shareChart(imageId, "Total Impact Potential Score over time", request.getRequestURL().toString());
  }

  @GetMapping("sdg/{imageId}")
  public ModelAndView shareSdgChart(@PathVariable String imageId, HttpServletRequest request) {
    return shareChart(imageId, "Total Impact Potential Score over time", request.getRequestURL().toString());
  }

  @GetMapping("categories/{imageId}")
  public ModelAndView shareSdgCategoriesChart(@PathVariable String imageId, HttpServletRequest request) {
    return shareChart(imageId, "Total Impact Potential Score over time", request.getRequestURL().toString());
  }
}
