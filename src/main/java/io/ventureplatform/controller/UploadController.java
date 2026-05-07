package io.ventureplatform.controller;

import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.ImageUploadRequest;
import io.ventureplatform.entity.User;
import io.ventureplatform.service.UploadService;
import io.ventureplatform.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/uploads")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UploadController {
  private final UploadService uploadService;

  @PostMapping("base64")
  public String uploadBase64Image(@RequestBody @Valid ImageUploadRequest request, @CurrentUser User user) {
    return uploadService.uploadBase64Image(request, user);
  }

  @PostMapping
  public String uploadImage(@RequestParam("file") MultipartFile file, @CurrentUser User user) {
    return uploadService.uploadImage(file, user);
  }
}
