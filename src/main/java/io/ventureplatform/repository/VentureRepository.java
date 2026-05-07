package io.ventureplatform.repository;

import io.ventureplatform.entity.Venture;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VentureRepository extends BaseEntityRepository<Venture> {
  Venture findByPitchSettingsPitchId(String uuid);

  List<Venture> findAllByFacebookTokenIsNotNull();

  Venture findBySubscriptionId(String subscriptionId);

  Boolean existsBySubscriptionId(String subscriptionId);

  @Query("SELECT v FROM Venture v WHERE v.certification >= 1 AND v.publicSettings.shared = true")
  List<Venture> findPublicVentures();
}
