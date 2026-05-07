package io.ventureplatform.configuration;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.annotation.PreDestroy;
import javax.sql.DataSource;
import java.io.IOException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;

import static io.ventureplatform.constant.AppConstants.PROFILE_EMBEDDED_POSTGRES;

@Configuration
@Profile(PROFILE_EMBEDDED_POSTGRES)
@Slf4j
public class EmbeddedPostgresConfig {

  private EmbeddedPostgres embeddedPostgres;

  @Bean
  public DataSource dataSource() throws IOException {
    log.info("Starting embedded PostgreSQL database...");

    Path postgresDir = createPostgresDirectory();
    Path dataDir = postgresDir.resolve("data");
    Path socketDir = postgresDir.resolve("socket");
    cleanDirectory(dataDir);
    cleanDirectory(socketDir);
    Files.createDirectories(dataDir);
    Files.createDirectories(socketDir);

    log.info("Using PostgreSQL directories - data: {}, socket: {}",
        dataDir, socketDir);

    embeddedPostgres = EmbeddedPostgres.builder()
        .setDataDirectory(dataDir)
        .setServerConfig("unix_socket_directories", socketDir.toString())
        .setServerConfig("shared_buffers", "16MB")
        .setServerConfig("work_mem", "1MB")
        .setServerConfig("maintenance_work_mem", "8MB")
        .setServerConfig("effective_cache_size", "32MB")
        .setServerConfig("max_connections", "10")
        .start();
    int port = embeddedPostgres.getPort();
    log.info("Embedded PostgreSQL started on port {}", port);

    Runtime.getRuntime().addShutdownHook(new Thread(() -> {
      if (embeddedPostgres != null) {
        try {
          log.info("Shutdown hook: stopping embedded PostgreSQL...");
          embeddedPostgres.close();
        } catch (IOException e) {
          log.error("Error in shutdown hook: {}", e.getMessage());
        }
      }
    }));

    return embeddedPostgres.getPostgresDatabase();
  }

  @PreDestroy
  public void stopEmbeddedPostgres() {
    if (embeddedPostgres != null) {
      try {
        log.info("Stopping embedded PostgreSQL...");
        embeddedPostgres.close();
        log.info("Embedded PostgreSQL stopped.");
      } catch (IOException e) {
        log.error("Error stopping embedded PostgreSQL: {}", e.getMessage());
      }
    }
  }

  private Path createPostgresDirectory() throws IOException {
    Path projectDir = Path.of(System.getProperty("user.dir"));
    Path postgresDir = projectDir.resolve(".postgres-tmp");

    if (Files.exists(postgresDir) || canCreateDirectory(postgresDir)) {
      log.info("Using project-local PostgreSQL directory: {}", postgresDir);
      return postgresDir;
    }

    Path homeDir = Path.of(System.getProperty("user.home"));
    postgresDir = homeDir.resolve(".postgres-tmp");
    if (Files.exists(postgresDir) || canCreateDirectory(postgresDir)) {
      log.info("Using home directory PostgreSQL directory: {}", postgresDir);
      return postgresDir;
    }

    throw new IOException("Cannot create PostgreSQL directory in project "
        + "or home directory. Check file permissions.");
  }

  private boolean canCreateDirectory(final Path dir) {
    try {
      Files.createDirectories(dir);
      return true;
    } catch (IOException e) {
      log.warn("Cannot create directory {}: {}", dir, e.getMessage());
      return false;
    }
  }

  private void cleanDirectory(final Path dir) throws IOException {
    if (!Files.exists(dir)) {
      return;
    }
    log.info("Cleaning stale directory: {}", dir);
    Files.walkFileTree(dir, new SimpleFileVisitor<Path>() {
      @Override
      public FileVisitResult visitFile(
          final Path file,
          final BasicFileAttributes attrs) throws IOException {
        Files.delete(file);
        return FileVisitResult.CONTINUE;
      }

      @Override
      public FileVisitResult postVisitDirectory(
          final Path d,
          final IOException exc) throws IOException {
        Files.delete(d);
        return FileVisitResult.CONTINUE;
      }
    });
  }
}
