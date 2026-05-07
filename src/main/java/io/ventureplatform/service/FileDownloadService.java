package io.ventureplatform.service;

import io.ventureplatform.entity.NoteFile;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.VenturePitchSettings;
import io.ventureplatform.service.external.AzureService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.InputStream;

@Service
@RequiredArgsConstructor
public class FileDownloadService {
  private final AzureService azureService;
  private final SecurityService securityService;

  public ResponseEntity<InputStreamResource> getDownloadPdfResponse(InputStream inputStream) {
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "attachment; filename=impacts.pdf");
    headers.add("Cache-Control", "no-cache, no-store, must-revalidate");
    headers.add("Pragma", "no-cache");
    headers.add("Expires", "0");

    return ResponseEntity
      .ok()
      .headers(headers)
      .contentType(MediaType.parseMediaType("application/pdf"))
      .body(new InputStreamResource(inputStream));
  }

  public ResponseEntity<InputStreamResource> downloadFile(NoteFile noteFile) {
    Venture venture = noteFile.getNote().getImpact().getVenture();
    VenturePitchSettings pitchSettings = venture.getPitchSettings();

    if (((securityService.userAuthenticated()
      && securityService.isMember(venture.getOrganization().getId(), venture.getId()))
      || (Boolean.TRUE.equals(pitchSettings.getShared())
      && Boolean.TRUE.equals(pitchSettings.getAllowDownloadFiles()))) && !StringUtils.isEmpty(noteFile.getKey())
    ) {
      return azureService.downloadFile(noteFile);
    }

    throw new AccessDeniedException("You don't have access to this file");
  }
}
