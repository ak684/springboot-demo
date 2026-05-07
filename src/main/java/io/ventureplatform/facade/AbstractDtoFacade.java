package io.ventureplatform.facade;

import io.ventureplatform.dto.request.BaseRequest;
import io.ventureplatform.dto.response.BaseResponse;
import io.ventureplatform.entity.BaseEntity;
import io.ventureplatform.service.AbstractBaseEntityService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.lang.reflect.ParameterizedType;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Component
public abstract class AbstractDtoFacade<I extends BaseRequest, O extends BaseResponse, E extends BaseEntity>
  implements DtoFacade<I, O, E> {

  @Autowired
  protected ModelMapper modelMapper;

  @Autowired
  private AbstractBaseEntityService<E> entityService;

  @Override
  @SuppressWarnings("unchecked")
  public O entityToDto(E entity) {
    if (entity == null) {
      return null;
    }

    return modelMapper.map(entity, (Class<O>) ((ParameterizedType) getClass()
      .getGenericSuperclass()).getActualTypeArguments()[1]);
  }

  public List<O> entitiesToDtoList(Collection<E> entities) {
    return entities.stream()
      .map(this::entityToDto)
      .collect(Collectors.toList());
  }

  @SuppressWarnings("unchecked")
  @Override
  public E dtoToEntity(I dto) {
    if (dto == null) {
      return null;
    }

    return modelMapper.map(dto, (Class<E>) ((ParameterizedType) getClass()
      .getGenericSuperclass()).getActualTypeArguments()[2]);
  }

  public List<E> dtosToEntityList(List<I> dtos) {
    return dtos.stream()
      .map(this::dtoToEntity)
      .collect(Collectors.toList());
  }

  protected Page<O> pageableToDtoList(Page<E> entities) {
    return entities.map(this::entityToDto);
  }

  @Override
  public List<O> findAll() {
    return entitiesToDtoList(entityService.findAll());
  }

  @Override
  public O findById(long id) {
    return entityToDto(entityService.findById(id));
  }

  @Override
  public O create(I entity) {
    return entityToDto(entityService.create(dtoToEntity(entity)));
  }

  @Override
  public void deleteById(long id) {
    entityService.deleteById(id);
  }

  @Override
  public O update(long id, I entity) {
    return entityToDto(entityService.update(id, dtoToEntity(entity)));
  }
}
