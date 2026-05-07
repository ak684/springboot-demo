package io.ventureplatform.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ventureplatform.constant.AppConstants;
import io.ventureplatform.dto.request.NoteRequest;
import io.ventureplatform.dto.response.NoteResponse;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.NoteFile;
import io.ventureplatform.facade.NoteFacade;
import io.ventureplatform.service.FileDownloadService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.DataBinder;
import org.springframework.validation.Validator;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping(value = AppConstants.API_PREFIX + AppConstants.API_VERSION + "/notes")
@RequiredArgsConstructor
public class NoteController {
  private final NoteFacade noteFacade;
  private final ObjectMapper objectMapper;
  private final Validator validator;
  private final FileDownloadService fileDownloadService;

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("isAuthenticated()")
  public NoteResponse saveNote(
    @RequestPart("note") String request,
    @RequestPart(required = false, name = "newFiles") List<MultipartFile> newFiles
  ) throws JsonProcessingException, BindException {
    NoteRequest note = objectMapper.readValue(request, NoteRequest.class);
    DataBinder binder = new DataBinder(note);
    binder.setValidator(validator);
    binder.validate();

    BindingResult bindingResult = binder.getBindingResult();

    if (bindingResult.hasErrors()) {
      throw new BindException(bindingResult);
    }

    return noteFacade.saveNote(note, newFiles);
  }

  @GetMapping
  public NoteResponse findNote(
    @RequestParam String screen,
    @RequestParam(name = "impactId") Impact impact,
    @RequestParam(required = false, name = "indicatorId") ImpactIndicator indicator
  ) {
    return noteFacade.findNote(screen, impact, indicator);
  }

  @GetMapping("download/{fileId}")
  public ResponseEntity<InputStreamResource> downloadNoteFile(@PathVariable(name = "fileId") NoteFile noteFile) {
    return fileDownloadService.downloadFile(noteFile);
  }
}
