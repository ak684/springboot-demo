package io.ventureplatform.repository;

import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.NoteLink;
import org.springframework.stereotype.Repository;

@Repository
public interface NoteLinkRepository extends BaseEntityRepository<NoteLink> {
  void deleteAllByNoteImpact(Impact impact);

  void deleteAllByNoteIndicator(ImpactIndicator indicator);
}
