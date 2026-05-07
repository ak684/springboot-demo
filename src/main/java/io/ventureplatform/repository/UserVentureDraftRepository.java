package io.ventureplatform.repository;

import io.ventureplatform.entity.User;
import io.ventureplatform.entity.UserVentureDraft;
import io.ventureplatform.entity.UserVentureDraftId;
import io.ventureplatform.entity.Venture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UserVentureDraftRepository extends JpaRepository<UserVentureDraft, UserVentureDraftId> {
  boolean existsById(UserVentureDraftId id);

  @Modifying
  @Query("DELETE FROM UserVentureDraft uvd WHERE uvd.user = :user AND uvd.venture = :venture")
  void deleteByUserAndVenture(User user, Venture venture);
}
