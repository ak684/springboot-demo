package io.ventureplatform.service;

import io.ventureplatform.entity.BaseEntity;

import java.util.List;

public interface BaseEntityService<E extends BaseEntity> {

  List<E> findAll();

  E findById(long id);

  E create(E entity);

  E update(long id, E entity);

  void deleteById(long id);
}

