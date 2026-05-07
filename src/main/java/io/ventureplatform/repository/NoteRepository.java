package io.ventureplatform.repository;

import io.ventureplatform.entity.Impact;
import io.ventureplatform.entity.ImpactIndicator;
import io.ventureplatform.entity.Note;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface NoteRepository extends BaseEntityRepository<Note> {
  @Query("SELECT n FROM Note n WHERE "
    + "n.screen = :screen AND "
    + "n.impact = :impact AND "
    + "(:indicator is null OR n.indicator = :indicator)")
  Note findNote(String screen, Impact impact, ImpactIndicator indicator);

  void deleteAllByImpact(Impact impact);

  void deleteAllByIndicator(ImpactIndicator indicator);
}
