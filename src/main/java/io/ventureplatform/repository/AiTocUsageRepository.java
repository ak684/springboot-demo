package io.ventureplatform.repository;

import io.ventureplatform.entity.AiTocUsage;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface AiTocUsageRepository extends BaseEntityRepository<AiTocUsage> {
  @Query("SELECT COUNT(u) FROM AiTocUsage u WHERE FUNCTION('DATE', u.createdAt) = CURRENT_DATE")
  long countToday();

  @Query("SELECT COUNT(e) FROM AiTocUsage e WHERE e.createdAt >= :since")
  long countSince(Date since);

  @Query("SELECT u.country, COUNT(u) FROM AiTocUsage u WHERE u.country IS NOT NULL GROUP BY u.country")
  List<Object[]> countRecordsByCountry();

  @Query("SELECT FUNCTION('TO_CHAR', u.createdAt, 'MMDD, Mon DD') AS formattedDate, COUNT(u.id) AS usageCount "
    + "FROM AiTocUsage u "
    + "WHERE u.createdAt >= :since "
    + "GROUP BY FUNCTION('TO_CHAR', u.createdAt, 'MMDD, Mon DD') "
    + "ORDER BY formattedDate DESC")
  List<Object[]> getDailyUsageCount(@Param("since")Date since);

  @Query("SELECT FUNCTION('TO_CHAR', u.createdAt, 'MMDDYYYY') AS formattedDate, "
    + "COUNT(u) AS usageCount,"
    + "u.country AS country "
    + "FROM AiTocUsage u "
    + "WHERE u.createdAt >= :since "
    + "GROUP BY formattedDate,country "
    + "ORDER BY formattedDate DESC")
  List<Object[]> getDailyRaceUsageCount(@Param("since")Date since);
}
