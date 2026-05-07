# Venture Impact Platform

A Spring Boot + React application used as the demo target for OpenHands code review.
This repo runs **locally only** — there is no production environment associated with it.

## Quick Start

Clone:

```bash
git clone git@github.com:ak684/springboot-demo.git
cd springboot-demo
```

Run backend (from your IDE: open `Application.java` and press Run, or via Maven):

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=embedded-postgres -Dskip.npm
```

Visit [http://localhost:9000/](http://localhost:9000/).

Run frontend:

```bash
cd frontend/admin-app
npm install
npm start
```

Visit [http://localhost:3010/](http://localhost:3010/).

## Local Development

Install:
* [Maven](https://maven.apache.org/install.html)
* [JDK 17](https://adoptium.net/temurin/releases/)
* [Node.js 18+](https://nodejs.org/en/download/)

You also need the Lombok plugin in your IDE.

### Embedded PostgreSQL

The recommended local profile is `embedded-postgres`, which spins up an in-memory PostgreSQL via `zonky.io/embedded-postgres-binaries` automatically. No system Postgres install required:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=embedded-postgres -Dskip.npm
```

If you prefer a real local Postgres instead, point Spring at it via `SPRING_DATASOURCE_URL`:

```bash
SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/ventureplatform_dev?currentSchema=public" \
  mvn spring-boot:run -Dskip.npm
```

Connect to the local DB:

```bash
psql -U impact_user -d ventureplatform_dev -h localhost -p 5432
```

## Sysadmin Service

A lightweight Node.js companion service (`sysadmin-service/`) that exposes shell-exec and SQL-query endpoints, used by automation/agents to inspect or operate on the running app. Auth is controlled via the `SYSADMIN_API_KEY` env var, which must be set on both server and client.

**Endpoints:**
- `GET /sysadmin/health` — health check (no auth required)
- `POST /sysadmin/query` — execute SQL queries (requires `X-Sys-Admin-Key` header)
- `POST /sysadmin/exec` — execute shell commands (requires `X-Sys-Admin-Key` header)

**Local example:**

```bash
# Health check
curl http://localhost:9000/sysadmin/health

# SQL query
curl -X POST "http://localhost:9000/sysadmin/query" \
  -H "Content-Type: application/json" \
  -H "X-Sys-Admin-Key: $SYSADMIN_API_KEY" \
  -d '{"sql": "SELECT COUNT(*) FROM users"}'

# Shell command
curl -X POST "http://localhost:9000/sysadmin/exec" \
  -H "Content-Type: application/json" \
  -H "X-Sys-Admin-Key: $SYSADMIN_API_KEY" \
  -d '{"command": "ls -la"}'
```

See `sysadmin-service/README.md` for full documentation.

## UI Verification (Playwright Harness)

For frontend changes, use the UI verification harness at `scripts/ui-verify/` to exercise the change in a real browser before declaring it done. This is what the agent uses too.

Quick start:

```bash
bun scripts/ui-verify/verify.ts --scenario <scenario-name>
# artifacts → /tmp/ui-verify/<timestamp>-<scenario>/
```

Each scenario lives at `scripts/ui-verify/scenarios/<name>.ts`. Copy `scenarios/smoke-login.ts` as a starting template for new ones. Run against your local frontend at `http://localhost:3010/` — no external services needed.

Full documentation: `scripts/ui-verify/README.md`.
