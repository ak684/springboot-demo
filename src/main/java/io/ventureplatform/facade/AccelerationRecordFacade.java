package io.ventureplatform.facade;

import io.ventureplatform.dto.request.AccelerationRecordRequest;
import io.ventureplatform.dto.response.AccelerationRecordResponse;
import io.ventureplatform.dto.response.VentureResponse;
import io.ventureplatform.entity.AccelerationRecord;
import io.ventureplatform.entity.Venture;
import io.ventureplatform.service.AccelerationRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class AccelerationRecordFacade
  extends AbstractDtoFacade<AccelerationRecordRequest, AccelerationRecordResponse, AccelerationRecord> {
  private final AccelerationRecordService accelerationRecordService;

  public AccelerationRecordResponse addAcceleration(AccelerationRecordRequest request, Venture venture) {
    return entityToDto(accelerationRecordService.addAcceleration(dtoToEntity(request), venture));
  }

  public AccelerationRecordResponse editAcceleration(
    AccelerationRecordRequest request,
    AccelerationRecord existing
  ) {
    return entityToDto(accelerationRecordService.editAcceleration(dtoToEntity(request), existing));
  }

  public List<AccelerationRecordResponse> searchAccelerations(List<VentureResponse> ventures, String search) {
    List<AccelerationRecordResponse> accelerations = ventures.stream()
      .map(VentureResponse::getAcceleration)
      .flatMap(List::stream)
      .filter(a -> a.getName().toLowerCase().contains(search.toLowerCase())
        || Optional.ofNullable(a.getWebsite()).orElse("").toLowerCase().contains(search.toLowerCase()))
      .toList();

    List<AccelerationRecordResponse> portfolios =
      entitiesToDtoList(accelerationRecordService.searchAccelerations(search));

    return Stream.concat(accelerations.stream(), portfolios.stream()).toList();
  }
}
