package io.ventureplatform.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Sysadmin endpoints for local development and Render PR previews.
 * Only active when NOT running with the "prod" profile.
 *
 * <p>API CONTRACT (keep in sync with sysadmin-service/index.js):
 * <ul>
 *   <li>GET  /health - { status: "ok" } (no auth)</li>
 *   <li>POST /exec   - { command } -> { output, exitCode }</li>
 *   <li>POST /query  - { sql } -> { rows, rowCount }</li>
 * </ul>
 *
 * <p>In production, nginx routes /sysadmin/* to the standalone Node.js
 * sysadmin-service on port 9001, so this controller is never reached.
 * This controller provides the same functionality for environments
 * where the Node.js service isn't available.
 *
 * <p>Security: Protected by isSysAdminOrSuperAdmin() which accepts
 * either X-Sys-Admin-Key header or JWT superadmin authentication.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@Profile("!prod")
@RequestMapping("/sysadmin")
public class SysAdminDevController {

  private static final int DEFAULT_TIMEOUT_SECONDS = 120;
  private static final int MAX_TIMEOUT_SECONDS = 300;
  private static final int MAX_BUFFER_SIZE = 10 * 1024 * 1024;

  private final JdbcTemplate jdbcTemplate;

  /**
   * Health check endpoint (no auth required).
   *
   * @return status ok
   */
  @GetMapping("/health")
  public ResponseEntity<Map<String, String>> health() {
    return ResponseEntity.ok(Map.of("status", "ok"));
  }

  /**
   * Execute a shell command.
   *
   * @param request containing "command" field
   * @return output and exitCode
   */
  @PostMapping("/exec")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> exec(
      @RequestBody final Map<String, Object> request) {

    String command = (String) request.get("command");
    if (command == null || command.trim().isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of(
          "error", "command is required"
      ));
    }

    log.info("SysAdmin executing command: {}", command);

    try {
      ProcessBuilder pb = new ProcessBuilder("bash", "-c", command);
      pb.redirectErrorStream(true);

      Process process = pb.start();

      StringBuilder output = new StringBuilder();
      try (BufferedReader reader = new BufferedReader(
          new InputStreamReader(process.getInputStream()))) {
        String line;
        int totalChars = 0;
        while ((line = reader.readLine()) != null
            && totalChars < MAX_BUFFER_SIZE) {
          output.append(line).append("\n");
          totalChars += line.length() + 1;
        }
      }

      boolean finished = process.waitFor(
          MAX_TIMEOUT_SECONDS, TimeUnit.SECONDS);

      Map<String, Object> response = new HashMap<>();

      if (finished) {
        response.put("output", output.toString());
        response.put("exitCode", process.exitValue());
      } else {
        process.destroyForcibly();
        response.put("error", "Command timed out after "
            + MAX_TIMEOUT_SECONDS + " seconds");
        response.put("exitCode", -1);
      }

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error executing command: {}", command, e);
      return ResponseEntity.internalServerError().body(Map.of(
          "error", e.getMessage(),
          "exitCode", -1
      ));
    }
  }

  /**
   * Execute a SQL query.
   *
   * @param request containing "sql" field
   * @return rows and rowCount
   */
  @PostMapping("/query")
  @PreAuthorize("isSysAdminOrSuperAdmin()")
  public ResponseEntity<Map<String, Object>> query(
      @RequestBody final Map<String, Object> request) {

    String sql = (String) request.get("sql");
    if (sql == null || sql.trim().isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of(
          "error", "sql is required"
      ));
    }

    log.info("SysAdmin executing SQL: {}...",
        sql.substring(0, Math.min(sql.length(), 100)));

    try {
      String sqlUpper = sql.trim().toUpperCase();
      boolean isSelect = sqlUpper.startsWith("SELECT")
          || sqlUpper.contains("RETURNING");

      if (isSelect) {
        return executeSelectQuery(sql);
      } else {
        return executeUpdateQuery(sql);
      }

    } catch (Exception e) {
      log.error("Error executing SQL: {}", sql, e);
      return ResponseEntity.internalServerError().body(Map.of(
          "error", e.getMessage()
      ));
    }
  }

  private ResponseEntity<Map<String, Object>> executeSelectQuery(
      final String sql) {
    List<Map<String, Object>> rows = new ArrayList<>();
    List<String> columns = new ArrayList<>();

    jdbcTemplate.query(sql, rs -> {
      if (columns.isEmpty()) {
        ResultSetMetaData meta = rs.getMetaData();
        for (int i = 1; i <= meta.getColumnCount(); i++) {
          columns.add(meta.getColumnLabel(i));
        }
      }
      Map<String, Object> row = new LinkedHashMap<>();
      for (int i = 0; i < columns.size(); i++) {
        row.put(columns.get(i), rs.getObject(i + 1));
      }
      rows.add(row);
    });

    Map<String, Object> response = new HashMap<>();
    response.put("rows", rows);
    response.put("rowCount", rows.size());

    return ResponseEntity.ok(response);
  }

  private ResponseEntity<Map<String, Object>> executeUpdateQuery(
      final String sql) {
    int rowsAffected = jdbcTemplate.update(sql);

    Map<String, Object> response = new HashMap<>();
    response.put("rows", List.of());
    response.put("rowCount", rowsAffected);

    return ResponseEntity.ok(response);
  }
}
