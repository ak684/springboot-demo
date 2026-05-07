package io.ventureplatform.repository;

import io.ventureplatform.entity.Followers;
import io.ventureplatform.entity.Venture;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface FollowersRepository extends BaseEntityRepository<Followers> {
  @Query(value = "SELECT f.* FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY type ORDER BY created_at DESC) as rn "
    + "FROM followers WHERE venture_id = :ventureId) f "
    + "WHERE f.rn = 1", nativeQuery = true)
  List<Followers> getLatestFollowers(@Param("ventureId") Long ventureId);

  @Query(value = "SELECT (latest.value - COALESCE(earliest.value, latest.value)) as valueDifference "
    + "FROM (SELECT * FROM followers WHERE venture_id = :ventureId AND type = :type ORDER BY created_at DESC LIMIT 1) "
    + "as latest "
    + "LEFT JOIN (SELECT * FROM followers WHERE venture_id = :ventureId AND type = :type AND created_at >= :daysAgo "
    + "ORDER BY created_at ASC LIMIT 1) as earliest ON true",
    nativeQuery = true)
  Long getValueChangeForVentureAndType(
    @Param("ventureId") Long ventureId,
    @Param("type") String type,
    @Param("daysAgo") Date daysAgo);

  void deleteAllByVenture(Venture venture);
}
