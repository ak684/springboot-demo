package io.ventureplatform.facade;

import io.ventureplatform.dto.request.BaseRequest;
import io.ventureplatform.dto.response.BaseResponse;
import io.ventureplatform.entity.BaseEntity;

import java.util.List;

public interface DtoFacade<I extends BaseRequest, O extends BaseResponse, E extends BaseEntity> {

  O entityToDto(E entity);

  E dtoToEntity(I dto);

  // toDO: Remove findAll from default list here and in service? It's likely we won't need it for most collections
  //  except some dictionaries
  List<O> findAll();

  O findById(long id);

  O create(I entity);

  O update(long id, I entity);

  void deleteById(long id);
}
