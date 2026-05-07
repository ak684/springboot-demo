package io.ventureplatform.service.external;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import io.ventureplatform.exception.custom.CloudinaryException;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Service
public class CloudinaryService {
  private final Cloudinary cloudinary;
  @Value("${spring.profiles.active}")
  private String folderName;

  @Autowired
  public CloudinaryService(Cloudinary cloudinary) {
    this.cloudinary = cloudinary;
  }

  public String upload(InputStream file, Long userId) {
    try {
      Map upload = cloudinary.uploader().uploadLarge(
        file,
        ObjectUtils.asMap(
          "folder", folderName,
          "format", "jpg",
          "tags", userId,
          "transformation", new Transformation().width(2048).height(1536).crop("limit")
        )
      );
      return (String) upload.get("url");
    } catch (IOException ex) {
      throw new CloudinaryException(ex);
    }
  }

  public String getUrl(String publicId) {
    return cloudinary.url().generate(folderName + "/" + publicId);
  }

  public boolean deleteByPublicId(String publicId) {
    if (StringUtils.isEmpty(publicId) || !publicId.startsWith(folderName)) {
      return false;
    }
    Map<String, String> deleteOptions = new HashMap<>();
    deleteOptions.put("invalidate", "true");
    try {
      final Map destroy = cloudinary.uploader().destroy(publicId, deleteOptions);
      return destroy.get("result").equals("ok");
    } catch (IOException ex) {
      throw new CloudinaryException(ex);
    }
  }
}
