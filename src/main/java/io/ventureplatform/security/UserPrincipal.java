package io.ventureplatform.security;


import io.ventureplatform.entity.User;
import io.ventureplatform.entity.enums.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serializable;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

public class UserPrincipal implements UserDetails, Serializable {
  private final Long id;
  private final String email;
  private final String password;
  private final Boolean isActive;
  private final Boolean isBlocked;
  private final UserRole role;
  private final Collection<? extends GrantedAuthority> authorities;

  public UserPrincipal(Long id, String email, String password, Boolean isActive, Boolean isBlocked, UserRole role,
                       Collection<? extends GrantedAuthority> authorities) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.isActive = isActive;
    this.isBlocked = isBlocked;
    this.role = role;
    this.authorities = authorities;
  }

  public static UserPrincipal create(User user) {
    List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()));
    return new UserPrincipal(
      user.getId(),
      user.getEmail(),
      user.getPassword(),
      true,
      false,
      UserRole.ROLE_USER,
      authorities
    );
  }

  public Long getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public Boolean getIsActive() {
    return isActive;
  }

  public Boolean getIsBlocked() {
    return isBlocked;
  }

  public UserRole getRole() {
    return role;
  }

  @Override
  public String getPassword() {
    return password;
  }

  @Override
  public String getUsername() {
    return email;
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return true;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return authorities;
  }
}
