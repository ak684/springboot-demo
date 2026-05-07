package io.ventureplatform.repository;

import io.ventureplatform.entity.User;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends BaseEntityRepository<User> {
  Optional<User> findByEmail(String email);

  User findByPasswordResetToken(String token);

  @Modifying
  @Query("update User u set u.lastSeen = CURRENT_TIMESTAMP where u.email = ?1")
  void updateLastSeen(String email);

  Boolean existsByEmail(String email);

  User findByCustomerIdsContains(String customerId);

  List<User> findAllByOrderByCreatedAtDesc();

  List<User> findAllByIdLessThanOrderByCreatedAtDesc(Long count);
}
