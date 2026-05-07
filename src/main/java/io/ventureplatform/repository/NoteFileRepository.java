package io.ventureplatform.repository;

import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.NoteFile;
import org.springframework.stereotype.Repository;

@Repository
public interface NoteFileRepository extends BaseEntityRepository<NoteFile> {
  void deleteAllByNoteImpact(Impact impact);

  void deleteAllByNoteIndicator(ImpactIndicator indicator);
}
