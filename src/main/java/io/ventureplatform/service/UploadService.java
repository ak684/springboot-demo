package io.ventureplatform.service;

import io.ventureplatform.dto.request.ImageUploadRequest;
import io.ventureplatform.entity.User;
import io.ventureplatform.exception.custom.ValidationException;
import io.ventureplatform.service.external.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class UploadService {
  private final CloudinaryService cloudinaryService;

  private static final long MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  public String uploadBase64Image(ImageUploadRequest request, User user) {
    if (user == null) {
      return null;
    }

    String base64Image = request.getContent().replace("data:image/png;base64,", "");
    byte[] imageBytes = Base64.getDecoder().decode(base64Image);
    ByteArrayInputStream inputStream = new ByteArrayInputStream(imageBytes);
    return cloudinaryService.upload(inputStream, user.getId());
  }

  public String uploadImage(MultipartFile file, User user) {
    try {
      if (file.getSize() > MAX_SIZE) {
        throw new ValidationException("Your image is too large. Max image size is 10MB");
      }
      return cloudinaryService.upload(file.getInputStream(), user.getId());
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }
}
