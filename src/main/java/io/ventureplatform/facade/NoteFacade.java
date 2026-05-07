package io.ventureplatform.facade;

import io.ventureplatform.dto.request.NoteRequest;
import io.ventureplatform.dto.response.NoteResponse;
import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.Note;
import io.ventureplatform.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Component
@RequiredArgsConstructor
public class NoteFacade extends AbstractDtoFacade<NoteRequest, NoteResponse, Note> {
  private final NoteService noteService;

  public NoteResponse saveNote(NoteRequest request, List<MultipartFile> newFiles) {
    return entityToDto(noteService.saveNote(dtoToEntity(request), newFiles));
  }

  public NoteResponse findNote(String screen, Impact impact, ImpactIndicator indicator) {
    return entityToDto(noteService.findNote(screen, impact, indicator));
  }
}
