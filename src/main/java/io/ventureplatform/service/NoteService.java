package io.ventureplatform.service;

import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.Note;
import io.ventureplatform.entity.NoteFile;
import io.ventureplatform.entity.NoteLink;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.entity.VenturePitchSettings;
import io.ventureplatform.repository.NoteFileRepository;
import io.ventureplatform.repository.NoteLinkRepository;
import io.ventureplatform.repository.NoteRepository;
import io.ventureplatform.service.external.AzureService;
import io.jsonwebtoken.lang.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoteService extends AbstractBaseEntityService<Note> {
  private final NoteRepository noteRepository;
  private final NoteLinkRepository noteLinkRepository;
  private final NoteFileRepository noteFileRepository;
  private final AzureService azureService;
  private final SecurityService securityService;

  @Transactional
  public Note saveNote(Note note, List<MultipartFile> newFiles) {
    // Check if user has permission to add notes to this impact
    if (note.getImpact() != null && note.getImpact().getVenture() != null) {
      Venture venture = note.getImpact().getVenture();
      if (!securityService.isSuperAdmin() &&
          !securityService.isMember(venture.getOrganization().getId(), venture.getId())) {
        throw new AccessDeniedException("You don't have permission to add notes to this venture");
      }
    }

    if (note.getId() != null) {
      Note existing = noteRepository.getOne(note.getId());
      if (existing.getId() != null) {
        Set<NoteLink> deletedLinks = existing.getLinks().stream()
          .filter(link -> note.getLinks().stream().filter(l -> link.getId().equals(l.getId())).findFirst().isEmpty())
          .collect(Collectors.toSet());
        noteLinkRepository.deleteAll(deletedLinks);
        Set<NoteFile> deletedFiles = existing.getFiles().stream()
          .filter(file -> note.getFiles().stream().filter(f -> file.getId().equals(f.getId())).findFirst().isEmpty())
          .collect(Collectors.toSet());
        deletedFiles.forEach(file -> {
          azureService.deleteFileByKey(file.getKey());
        });
        noteFileRepository.deleteAll(deletedFiles);
      }
    }

    if (!Collections.isEmpty(newFiles)) {
      List<NoteFile> uploadedFiles = uploadFiles(newFiles, note.getImpact().getId());

      for (int i = 0; i < uploadedFiles.size(); i++) {
        uploadedFiles.get(i).setRisk(note.getNewFiles().get(i).getRisk());
        uploadedFiles.get(i).setComment(note.getNewFiles().get(i).getComment());
        uploadedFiles.get(i).setEvidenceType(note.getNewFiles().get(i).getEvidenceType());
      }

      note.getFiles().addAll(uploadedFiles);
    }

    note.getLinks().forEach(link -> {
      link.setNote(note);
    });
    note.setLinks(noteLinkRepository.saveAll(note.getLinks()));

    note.getFiles().forEach(file -> {
      file.setNote(note);
    });
    note.setFiles(noteFileRepository.saveAll(note.getFiles()));

    return noteRepository.save(note);
  }

  private List<NoteFile> uploadFiles(List<MultipartFile> files, Long impactId) {
    List<NoteFile> response = new ArrayList<>();
    for (MultipartFile file : files) {
      try {
        String key = azureService.uploadFile(file);
        response.add(new NoteFile().setName(file.getOriginalFilename()).setSize(file.getSize()).setKey(key));
      } catch (Exception ex) {
        log.error("Cannot upload note file to AWS S3");
        log.error(ex.getMessage(), ex);
      }
    }
    return response;
  }

  public Note findNote(String screen, Impact impact, ImpactIndicator indicator) {
    Note note = noteRepository.findNote(screen, impact, indicator);

    if (note == null) {
      return null;
    }

    Venture venture = note.getImpact().getVenture();
    VenturePitchSettings pitchSettings = venture.getPitchSettings();

    if (((securityService.userAuthenticated()
      && securityService.isMember(venture.getOrganization().getId(), venture.getId()))
      || (Boolean.TRUE.equals(pitchSettings.getShared())))
    ) {
      return note;
    }

    throw new AccessDeniedException("You don't have access to this note");
  }
}
