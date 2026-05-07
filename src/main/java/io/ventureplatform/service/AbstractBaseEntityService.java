package io.ventureplatform.service;

import io.ventureplatform.entity.BaseEntity;
import io.ventureplatform.entity.Organization;
import io.ventureplatform.entity.User;
import io.ventureplatform.exception.custom.ResourceNotFoundException;
import io.ventureplatform.repository.BaseEntityRepository;
import io.ventureplatform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.lang.reflect.ParameterizedType;
import java.util.List;
import java.util.Optional;

@Service
public abstract class AbstractBaseEntityService<E extends BaseEntity> implements BaseEntityService<E> {
  @Autowired
  private UserRepository userRepository;

  @Autowired
  protected BaseEntityRepository<E> baseEntityRepository;

  protected static final String ENTITY_ID_NOT_FOUND = "Cannot find %s with id %d";

  @Override
  public E findById(long id) {
    Optional<E> entity = baseEntityRepository.findById(id);
    return entity
      .orElseThrow(() -> new ResourceNotFoundException(String.format(ENTITY_ID_NOT_FOUND, getEntityName(), id)));
  }

  @Override
  public List<E> findAll() {
    return baseEntityRepository.findAll();
  }

  @Override
  @Transactional
  public void deleteById(long id) {
    baseEntityRepository.deleteById(id);
  }

  @SuppressWarnings("unchecked")
  protected String getEntityName() {
    return ((Class<E>) ((ParameterizedType) getClass().getGenericSuperclass())
      .getActualTypeArguments()[0]).getSimpleName().toLowerCase();
  }

  @Override
  public E create(E entity) {
    entity.setId(null);
    return baseEntityRepository.save(entity);
  }

  @Override
  public E update(long id, E entity) {
    entity.setId(id);
    return baseEntityRepository.save(entity);
  }

  protected Organization currentOrganization() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null) {
      String username = authentication.getName();

      if (StringUtils.hasLength(username)) {
        User user = userRepository.findByEmail(username).orElse(null);
        return user != null ? user.getOrganization() : null;
      }
    }

    return null;
  }
}

