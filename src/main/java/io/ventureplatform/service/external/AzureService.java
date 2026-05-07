package io.ventureplatform.service.external;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import io.ventureplatform.entity.NoteFile;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URL;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AzureService {
  private final BlobServiceClient blobServiceClient;

  @Value("${azure.storage.container-name}")
  private String containerName;

  public String uploadFile(MultipartFile file) {
    try {
      BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
      String blobName = UUID.randomUUID() + getFileExtension(file);
      containerClient.getBlobClient(blobName).upload(file.getInputStream(), file.getSize(), true);
      return blobName;
    } catch (IOException ex) {
      throw new IllegalStateException("Failed to upload file to Azure Blob Storage", ex);
    }
  }

  public void deleteFileByKey(String blobName) {
    try {
      BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
      containerClient.getBlobClient(blobName).delete();
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to delete file from Azure Blob Storage", ex);
    }
  }

  public String getFileExtension(MultipartFile file) {
    String fileName = file.getOriginalFilename();
    if (fileName == null || fileName.lastIndexOf('.') < 0) {
      return "";
    }
    return fileName.substring(fileName.lastIndexOf('.'));
  }

  public ResponseEntity<InputStreamResource> downloadFile(NoteFile file) {
    String contentDispositionHeaderValue = "attachment; filename=\"" + file.getName() + "\"";

    BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
    BlobClient blobClient = containerClient.getBlobClient(file.getKey());

    if (!blobClient.exists()) {
      throw new IllegalStateException("File not found in Azure Blob Storage");
    }

    try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
      blobClient.downloadStream(outputStream);
      InputStreamResource resource = new InputStreamResource(new ByteArrayInputStream(outputStream.toByteArray()));

      return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, contentDispositionHeaderValue)
        .body(resource);
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to download file from Azure Blob Storage", ex);
    }
  }
}
