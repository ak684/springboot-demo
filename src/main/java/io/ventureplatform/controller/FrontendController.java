package io.ventureplatform.controller;

import io.ventureplatform.service.ServerSideRenderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;

@Controller
@RequestMapping("/")
@RequiredArgsConstructor
public class FrontendController {
  private final ServerSideRenderService serverSideRenderService;

  private ModelAndView getModelAndViewWithTags(HttpServletRequest request) {
    ModelAndView modelAndView = new ModelAndView();
    modelAndView.setViewName("index");
    serverSideRenderService.getHtmlWithTags(request, modelAndView.getModelMap());
    return modelAndView;
  }

  @GetMapping
  public ModelAndView trueIndex(HttpServletRequest request) {
    return getModelAndViewWithTags(request);
  }

  @GetMapping("**/{subpath:[^\\.]+}")
  public ModelAndView fakeIndex(HttpServletRequest request) {
    return getModelAndViewWithTags(request);
  }
}
