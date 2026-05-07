package io.ventureplatform.repository;

import io.ventureplatform.entity.AiTocFeedback;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AiTocFeedbackRepository extends BaseEntityRepository<AiTocFeedback> {
  Long countAllByRatingIsNotNull();

  @Query("SELECT AVG(f.rating) FROM AiTocFeedback f WHERE f.rating IS NOT NULL")
  Double findAverageRating();
}
