package io.ventureplatform.service;

import io.ventureplatform.entity.AccelerationRecord;
import io.ventureplatform.entity.Portfolio;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.repository.AccelerationRecordRepository;
import io.ventureplatform.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccelerationRecordService extends AbstractBaseEntityService<AccelerationRecord> {
  private final AccelerationRecordRepository accelerationRecordRepository;
  private final PortfolioRepository portfolioRepository;

  public AccelerationRecord addAcceleration(AccelerationRecord acceleration, Venture venture) {
    acceleration.setVenture(venture);
    return accelerationRecordRepository.save(acceleration);
  }

  public AccelerationRecord editAcceleration(AccelerationRecord update, AccelerationRecord existing) {
    BeanUtils.copyProperties(update, existing, "id", "venture");
    return accelerationRecordRepository.save(existing);
  }

  // toDO: Add pagination when required
  // If we need to return 20 results, we can search in own ventures accelerations, and fetch from portfolio
  // repository only the missing number to complete for 20 results
  public List<AccelerationRecord> searchAccelerations(String search) {
    List<Portfolio> portfolios = portfolioRepository.searchPortfolios(search);
    List<AccelerationRecord> response = new ArrayList<>();

    portfolios.forEach(p -> {
      AccelerationRecord acceleration = new AccelerationRecord();
      BeanUtils.copyProperties(p, acceleration, "id", "venture");
      response.add(acceleration);
    });

    return response;
  }
}
