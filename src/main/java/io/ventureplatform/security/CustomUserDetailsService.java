package io.ventureplatform.security;

import io.ventureplatform.entity.User;
import io.ventureplatform.repository.UserRepository;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {
  private final UserRepository userRepository;

  @Autowired
  public CustomUserDetailsService(@NonNull UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Override
  public UserDetails loadUserByUsername(String username) {
    Optional<User> user;
    user = userRepository.findByEmail(username);
    if (user.isPresent()) {
      return UserPrincipal.create(user.get());
    } else {
      throw new UsernameNotFoundException("User not found");
    }
  }
}
