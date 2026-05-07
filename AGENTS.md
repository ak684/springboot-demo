# AGENTS.md

This file provides guidance to AI agents working with code in this repository.

## Runtime context for the agent

This repo is run **inside an OpenHands sandbox** (or similar agent sandbox). Key implications:

- There is **no system-level PostgreSQL** running on the sandbox. Use the **embedded-postgres** Spring profile (commands below) — that is the default and only supported way to run the backend.
- The agent has access to a `sysadmin-service` companion (see `sysadmin-service/`) for shell/SQL operations against the running app. Use it whenever you need to inspect or operate on the live process.
- Outbound network is permitted; the agent can `gh` / `git push` normally.

## Most Important Instructions
The year is 2026. You're an amazing Staff level software developer, best in the world, who explains everything you claim with code, log, or web research evidence. You never say 'likely', 'probably', etc., because that means you were too lazy to actually look at the code. Instead, you research areas of code related to a task or answer obsessively to understand the full picture, how the code (and its connecting code) works, existing patterns in the codebase, any potential issues that could be gotchas for bugs, how to verify your code changes, etc. You understand that writing the best code in the world is not easy and takes thorough planning. You are always pragmatic in your changes. You follow the KISS principle. You are always brutally honest about your thoughts. When you commit or create PRs, NEVER include any 'authored by claude code' or related lines or information. DO NOT ADD ANY 'authored by claude' TAGGING ANYWHERE OR ADD YOURSELF AS A COMMIT OR PR AUTHOR.

Avoid over-engineering. Only make changes that are directly requested or clearly necessary. Keep solutions as simple and focused as possible to complete ALL of the task at a Staff engineer level. Don’t add features, refactor code, or make “improvements” beyond what was asked.
	•	A bug fix doesn’t need surrounding code cleaned up
	•	A simple feature doesn’t need extra configurability
	•	Don’t add error handling, fallbacks, or validation for scenarios that can’t happen
	•	Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs)
	•	Don’t use backwards-compatibility shims when you can just change the code
	•	Don’t create helpers, utilities, or abstractions for one-time operations
	•	Don’t design for hypothetical future requirements
The right amount of complexity is the minimum needed for the current task. Reuse existing patterns and abstractions where possible and follow the DRY principle.
ALWAYS read and understand relevant files before proposing code. Don’t speculate about code you haven’t inspected. If the user references a file path, you MUST open and inspect it before explaining or proposing changes. Be thorough and persistent in searching code for key facts. Thoroughly review the patterns, conventions, and abstractions of the codebase. Always prefer to write code and comments that are in line with the existing patterns, conventions, and abstractions of the codebase, over implementing new abstractions.

When given ANY development task, you MUST work completely autonomously following this EXACT workflow:

### 1. RESEARCH PHASE (ALWAYS DO THIS FIRST)
- Use tools like ripgrep (or grep if rg is not available), glob, jq etc. to extensively understand the codebase structure
- **For ANY database work**: ALWAYS check existing tables/migrations in `src/main/resources/db/migrations/` FIRST to understand the actual table names, column names, and existing indexes before writing any database-related code. To inspect the running embedded DB, use the sysadmin endpoint (see "Sysadmin Service" below) — `POST /sysadmin/query` with a SQL body.
- Read all relevant files to understand existing patterns and conventions
- Understand the full scope before proceeding

### 2. PLANNING PHASE
- Create a TodoWrite list with all subtasks
- Break down the task into specific, actionable steps
- Consider edge cases and potential issues
- Plan for testing and validation
- Write out your implementation approach

### 3. IMPLEMENTATION PHASE
- Write code following existing patterns
- MANDATORY: Fix ALL checkstyle violations in files you create/modify
- Run `mvn clean compile -q` — it MUST pass
- Boot the backend with the embedded-postgres profile to verify it starts cleanly (see "Build Validation" below). Any startup errors must be fixed before saying the code is ready.

### 4. VALIDATION PHASE (NEVER SKIP)
- Run `mvn clean compile -q` — MUST pass without errors
- If checkstyle fails, fix ALL violations in your files
- Boot the backend with the embedded-postgres profile and confirm `Started Application` in the logs
- Only proceed to PR after ALL validation passes

## Critical: Adding New Extraction Phases or Database Fields

### MANDATORY CHECKLIST (Prevent Data Sync Bugs)
When adding a new extraction phase or ANY fields that need database persistence:

1. **Create Database Migration**
   - Add columns to `company_extraction_data` table
   - File: `src/main/resources/db/migrations/YYYY_MM_DD_description.yml`
   - Register in `src/main/resources/db/db.changelog.yml`

2. **Update Entity Class**
   - Add fields to `src/main/java/io/ventureplatform/entity/CompanyExtractionData.java`
   - Use proper @Column annotations matching database column names

3. **UPDATE DATA MAPPING (CRITICAL - MOST COMMON BUG!)**
   - **MUST** update `CompanyExtractionDataService.mapJsonToEntity()` method
   - Add mapping for EVERY new field:
     ```java
     entity.setYourNewField(getBigDecimalValue(json, "your_new_field"));
     entity.setYourBooleanField(getBooleanValue(json, "your_boolean_field"));
     entity.setYourTextField(getTextValue(json, "your_text_field"));
     ```
   - **WITHOUT THIS STEP**: Data will exist in JSON but database columns stay NULL!

4. **Verify Data Persistence**
   After running extraction, check that columns are populated:
   ```sql
   SELECT
     your_new_column,
     raw_extraction_data->>'your_new_field' as json_value,
     CASE
       WHEN your_new_column IS NULL
         AND raw_extraction_data->>'your_new_field' IS NOT NULL
       THEN 'BUG: JSON has data but column is NULL!'
       ELSE 'OK'
     END as sync_status
   FROM company_extraction_data
   WHERE company_name = 'Test Company';
   ```

5. **Common Bug Pattern to Avoid (Extraction Data)**
   - Phase sets value in JSON: DONE
   - Database column exists: DONE
   - `mapJsonToEntity()` not updated: MISSING
   - Result: Column stays NULL, causing UI issues

6. **API Response Mapping (NOW AUTOMATIC!)**

   **Good news:** The lite endpoint now uses `ProjectionMapper` which automatically maps all projection getter methods to snake_case API fields using reflection.

   **What this means:** When you add a new getter to `CompanyExtractionDataLiteProjection`, it is AUTOMATICALLY included in the API response. No manual mapping code needed!

   **Special cases that still need manual handling:**
   - Fields that need truncation (add to `applyProjectionTransformations()`)
   - Fields that need formatting (e.g., sales fields)
   - Fields with default values when null
   - Field name aliases (where API name differs from getter name)

   See `CompanyExtractionDataService.applyProjectionTransformations()` for examples.

7. **Complete Checklist for New Database Fields Displayed in Frontend**

   When adding ANY new column to `company_extraction_data` that will be shown in the frontend:

   - [ ] Database migration created (`src/main/resources/db/migrations/`)
   - [ ] Migration registered in `db.changelog.yml`
   - [ ] Entity class updated (`CompanyExtractionData.java`) with @Column annotation
   - [ ] Projection interface updated (`CompanyExtractionDataLiteProjection.java`) with getter method
   - [ ] `mapJsonToEntity()` updated in `CompanyExtractionDataService` (if field comes from AI extraction)
   - [ ] (AUTOMATIC) API response mapping - handled by ProjectionMapper reflection
   - [ ] (OPTIONAL) Add to `applyProjectionTransformations()` if field needs truncation/formatting/defaults
   - [ ] Frontend data mapping added (e.g., in `SuperAdminCompanyExtractor.js` transform function)
   - [ ] Frontend column definition added (if it's a new visible column)

## Code Implementation Patterns

### IMPORTANT: Java Code Style
- **INDENTATION: Always use 2 SPACES** (not 4 spaces, not tabs)
- All Java files MUST use 2-space indentation
- This applies to class members, methods, and nested blocks

### Backend (Spring Boot)

#### Service Layer Pattern
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class YourService {
    private final YourRepository repository;
    private final OtherService otherService;
    
    @Transactional
    public Result performOperation(Input input) {
        try {
            log.info("Starting operation for: {}", input);
            // business logic here
            log.info("Operation completed successfully");
            return result;
        } catch (Exception e) {
            log.error("Operation failed: {}", e.getMessage());
            return fallbackResult; // DON'T throw, return fallback
        }
    }
}
```

#### Controller Pattern
```java
@RestController
@RequestMapping(AppConstants.API_PREFIX + AppConstants.API_VERSION + "/resource")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class YourController {
    private final YourService service;
    
    @PostMapping
    public ResponseEntity<YourResponse> create(@Valid @RequestBody YourRequest request, 
                                               @CurrentUser User user) {
        return ResponseEntity.ok(service.create(request, user));
    }
}
```

#### Entity Pattern
- ALWAYS extend `BaseEntity` (has id, createdAt, lastModifiedAt, createdBy, lastModifiedBy)
- Use enums from `entity.enums` package for type safety
- Add proper JPA annotations (@Column, @JoinColumn, etc.)
- **CRITICAL**: When creating database tables for entities that extend BaseEntity, the migration MUST include ALL these columns:
  - `id` (bigint, auto-increment, primary key)
  - `created_at` (timestamp, default CURRENT_TIMESTAMP, not null)
  - `last_modified_at` (timestamp, default CURRENT_TIMESTAMP)
  - `created_by` (bigint, nullable)
  - `last_modified_by` (bigint, nullable)

#### Repository Pattern
- Extend `JpaRepository<Entity, Long>`
- Return `Optional<T>` for single results
- Use `@Query` for complex queries

#### Database Migration Pattern
```yaml
databaseChangeLog:
  - changeSet:
      id: 2025_MM_DD_description
      author: alona
      comment: "Clear description of what this migration does"
      changes:
        - addColumn:
            tableName: company_extraction_data
            columns:
              - column:
                  name: new_field
                  type: VARCHAR(500)
```

### Frontend (React)

#### Component Pattern
```javascript
import React, { memo } from 'react';

const ComponentName = memo(({ prop1, prop2, ...rest }) => {
  return (
    <MUIComponent
      variant='outlined'
      sx={{ /* styles here */ }}
      {...rest}
    />
  );
});

export default ComponentName;
```

#### Redux Store Pattern
- Each domain has: `slice.js`, `thunks.js`, `selectors.js`, `index.js`
- Use `loadDataInitialState()` helper for state
- Use `loadDataExtraReducer()` for async handling

### Critical Conventions

#### Naming
- **Services**: `*Service` (e.g., `CompanyExtractionDataService`)
- **Controllers**: `*Controller`
- **DTOs**: `*Request`/`*Response`
- **Database tables**: `snake_case`
- **Database indexes**: `idx_table_column_desc`

#### Logging
- **INFO**: Operation start/complete
- **ERROR**: Exceptions only
- **DEBUG**: Detailed technical info
- Use `{}` placeholders: `log.info("Processing company: {}", companyId)`

#### Error Handling
- Services return fallback values, DON'T throw exceptions
- Controllers use `ResponseEntity` for consistent responses
- Log errors but continue processing when possible

#### Security
- Use `@PreAuthorize("isAuthenticated()")` on controllers
- Use `@CurrentUser User user` for current user
- JWT-based authentication

### Common Patterns
- **NO COMMENTS** unless specifically requested
- **Validation**: Use `@Valid`, `@NotEmpty` on DTOs
- **Lombok**: Use `@RequiredArgsConstructor`, `@Slf4j`, `@Data`
- **Testing**: Always run `mvn clean compile -q` before committing (NEVER RUN mvn compile -q -Dcheckstyle.skip=true YOU MUST ALWAYS FIX CHECKSTYLES IN FILES YOU EDITED OR CREATED)
- **Pre-PR Testing**: ALWAYS run `vip -Dskip.npm` before creating PRs or giving final feedback. This starts the backend and will catch Liquibase migration errors, missing beans, and other runtime issues. If you see "address in use" that's fine (app is already running), but any other errors must be fixed before saying the code is ready.
- **Performance**: Consider caching for expensive operations (see IMP-76)

### CRITICAL CHECKSTYLE REQUIREMENTS (NEVER SKIP)
**YOU MUST ALWAYS FIX ALL CHECKSTYLE VIOLATIONS IN ANY FILE YOU CREATE OR MODIFY**
- Run `mvn clean compile -q` and it MUST pass without errors
- If checkstyle fails, run `mvn checkstyle:check` to see specific violations
- Fix EVERY checkstyle violation in files you touched (created or modified)
- **INDENTATION: Use 2 SPACES (not 4 spaces, not tabs)**
- Common violations to fix (or ideally AVOID):
  - **Indentation: MUST use 2-space indentation throughout**
  - Missing Javadoc comments on fields and methods
  - Trailing spaces
  - Lines longer than 80 characters
  - Missing `final` on parameters
  - Import violations (no star imports, unused imports)
  - Missing newline at end of file
- NEVER use `-Dcheckstyle.skip=true` as a workaround
- Pre-existing violations in untouched files can be ignored
- But ANY file you create or modify MUST be 100% checkstyle compliant

## Development Commands

### Run the Backend (default — embedded Postgres)

The backend always runs against an in-memory PostgreSQL instance via the `embedded-postgres` Spring profile. There is no system Postgres install in the sandbox.

```bash
SYSADMIN_API_KEY=$SYSADMIN_API_KEY mvn spring-boot:run \
  -Dspring-boot.run.profiles=embedded-postgres -Dskip.npm
```

- Server URL: `http://localhost:9000` (port 9000, **not** 8080)
- All Liquibase migrations run automatically on startup
- Seed data is loaded from `src/main/resources/db/seed-data.sql` (includes test users and sample rows)
- Data does **not** persist between restarts
- Pass the sysadmin key via env var (above) so endpoints with `@PreAuthorize("isSysAdminOrSuperAdmin()")` are reachable for testing

### Build Validation

Before declaring any coding task complete, validate that your code compiles and the backend starts cleanly:

```bash
mvn clean compile -q -Dskip.npm
```

and

```bash
SYSADMIN_API_KEY=$SYSADMIN_API_KEY mvn spring-boot:run \
  -Dspring-boot.run.profiles=embedded-postgres -Dskip.npm
```

Wait for `Started Application` in the logs. **Embedded PostgreSQL startup takes 2–3 minutes** (sometimes up to 4) — do not give up early. See the timing notes below.

### Other Useful Commands

- **Clean compile**: `mvn clean compile -q`
- **Liquibase migration only**: `mvn liquibase:update` (rarely needed — embedded-postgres runs them automatically)
- **Frontend dev server**: `cd frontend/admin-app && BROWSER=none PORT=3010 npm start`
- **Alternative frontend (map app)**: `mvn package -Pfrontend-map`

### Authenticating with API Endpoints

Most API endpoints support dual auth: sysadmin API key (preferred for the agent) or JWT token.

**1. Sysadmin API Key** (preferred — set `SYSADMIN_API_KEY` env var):

```bash
curl -X POST http://localhost:9000/api/v1/companies/rerun-emissions \
  -H "Content-Type: application/json" \
  -H "X-Sys-Admin-Key: $SYSADMIN_API_KEY" \
  -d '{"companyIds": [141], "dryRun": true}'
```

This works for endpoints annotated with `@PreAuthorize("isSysAdminOrSuperAdmin()")`.

**2. JWT Token** (if sysadmin key isn't available): log in with the seeded test user `alona@example.com` / `password123` to get a superadmin JWT in the `Authorization` response header:

```bash
TOKEN=$(curl -s -i -X POST http://localhost:9000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alona@example.com","password":"password123"}' \
  | grep -i '^Authorization:' | sed 's/Authorization: Bearer //' | tr -d '\r')

curl -X GET "http://localhost:9000/api/v1/companies/lite?portfolioId=1" \
  -H "Authorization: Bearer $TOKEN"
```

The token is in the response **header**, not the JSON body.

#### CRITICAL: Embedded PostgreSQL Startup Takes 2-3 Minutes — DO NOT Give Up Early
**The embedded PostgreSQL startup is SLOW. This is normal and expected.** The app must:
1. Download and start an embedded PostgreSQL instance
2. Run ALL Liquibase migrations from scratch
3. Load seed data
4. Initialize Spring context, security filters, and Tomcat

**This consistently takes 2-3 minutes (sometimes up to 4 minutes).** You MUST:
- Use a **timeout of at least 300 seconds** (5 minutes) when running the startup command
- Run the command in the background or with a long timeout — e.g., `timeout 300 bash -c '...'`
- **Wait for the full startup** — grep the output for `Started Application` (success) or `APPLICATION FAILED TO START` (failure)
- **DO NOT** conclude there is a build problem just because the command is still running after 60 or 120 seconds — that is completely normal
- **ONLY** if the app has not started after **5 full minutes** (300 seconds) should you investigate a potential issue
- A successful startup will always print: `Started Application in XXX seconds (JVM running for XXX)`

## UI Self-Verification (Playwright Harness)

Just like a human engineer, for any code change that touches frontend/** code, you MUST use the ui verification harness at `scripts/ui-verify/` (full docs in `scripts/ui-verify/README.md`) to look at, potentially click on, and/or verify the UI change yourself before claiming the UI-related task is done or ready. At a minimum, run a scenario that exercises the change, confirm `summary.json` reports `success=true`, and make sure the UI does not obviously break, throw an exception or error, or render incorrectly.

**Standard workflow for any frontend change**:

1. **Start local servers** (only needed the first time each session):
   - Backend: `SYSADMIN_API_KEY=$SYSADMIN_API_KEY mvn spring-boot:run -Dskip.npm -Dspring-boot.run.profiles=embedded-postgres` (run in background, wait for `Started Application`)
   - Frontend: `cd frontend/admin-app && BROWSER=none PORT=3010 npm start` (run in background, wait for port 3010 to respond 200)

2. **Write a scenario for your change** at `scripts/ui-verify/scenarios/<descriptive-name>.ts`. The scenario should exercise what you actually changed (the new button, the new chart, the new page, etc.). Copy `scenarios/smoke-login.ts` as a starting template.

3. **Run the harness**:
   ```bash
   bun scripts/ui-verify/verify.ts --scenario <your-scenario>
   # artifacts → /tmp/ui-verify/<timestamp>-<scenario>/
   ```
   Check the output. If `success=false`, fix what's wrong before proceeding.

4. **Attach proof to the PR.** Artifacts live in `/tmp/ui-verify/<timestamp>-<scenario>/` after a successful run. Either:
   - Reference the artifacts directory in a PR comment, or
   - Use `bun scripts/ui-verify/publish.ts --pr <N> --dir /tmp/ui-verify/<ts>-<scenario>` if your environment supports git push (it commits to a `ui-verify-artifacts` orphan branch and prints a ready-to-paste markdown block).

**Sandbox env notes**: Chromium and `ffmpeg` are pre-installed; Playwright is wired in. The harness auto-scrubs `HTTPS_PROXY` env vars for localhost targets so the sandbox proxy doesn't intercept local traffic.

## Architecture Overview

### Backend Architecture (Spring Boot + JPA)
- **Main Application**: `src/main/java/io/ventureplatform/Application.java`
- **Package Structure**:
  - `controller/` - REST API endpoints (20+ controllers)
  - `service/` - Business logic layer with external service integrations
  - `entity/` - JPA entities with extensive enum support
  - `repository/` - Data access layer
  - `facade/` - DTO mapping layer
  - `dto/` - Request/response objects with validation
  - `security/` - JWT authentication and authorization
  - `configuration/` - Spring configuration classes

 ### Key Backend Files and Code Sections (non-exhaustive):
  - `/src/main/java/io/ventureplatform/service/CompanyDataExtractionMetricsCacheService.java` - Manages cached metrics (currently global, not per-portfolio)
  - `/src/main/java/io/ventureplatform/entity/CompanyPatent.java` - Patent entity linked to companies
  - `/src/main/java/io/ventureplatform/entity/CompanyExtractionData.java` - Main company data entity, portfolio associations via portfolio_company_extraction_access junction table
  - `/src/main/java/io/ventureplatform/controller/SuperAdminCompanyController.java` - Main controller for company data endpoints
  - `/src/main/java/io/ventureplatform/service/SecurityService.java` - Security service with portfolio membership checks
  - `/src/main/java/io/ventureplatform/security/CustomMethodSecurityExpressionRoot.java` - Custom security expressions for @PreAuthorize

### Key Service Categories
- **External Integrations**: Azure, Stripe, Google APIs, Cloudinary, ChatGPT
- **Company Data Extraction**: Multi-phase pipeline for company data processing
- **Impact Management**: Core business domain for measuring venture impact
- **Portfolio Management**: Multi-tenant system for investment portfolios

### Frontend Architecture (React + Redux Toolkit)
- **Admin App**: Primary user interface with complex state management
- **Technology Stack**: React 18, Material-UI, Redux Toolkit, React Router
- **Key Features**: Impact measurement wizards, portfolio management, certification flows
- **State Management**: Redux slices in `store/ducks/` organized by domain
- **Shared Components**: Reusable UI components and utilities

### Database & Migrations
- **Database**: PostgreSQL with Liquibase migrations
- **Migration System**: Two-step process for database changes:
  1. **Create Migration File**: `src/main/resources/db/migrations/YYYY_MM_DD_descriptive_name.yml`
  2. **Register in Changelog**: Add `include` entry to `src/main/resources/db/db.changelog.yml`
- **Migration Pattern**: Files follow `YYYY_MM_DD_descriptive_name.yml` format with chronological ordering
- **Auto-Application**: Migrations run automatically on application startup via Liquibase
- **Complex Schema**: Supports multi-tenant portfolios, ventures, and impact indicators

### Key Business Domains
1. **Ventures**: Startups/companies being measured
2. **Portfolios**: Collections of ventures (for investors/accelerators)  
3. **Impacts**: Measurable outcomes and indicators
4. **Certification**: Impact assessment and validation
5. **Public Profiles**: Shareable venture/portfolio information

### Multi-App Structure
- **Admin App**: Full-featured management interface
- **Map App**: Public-facing venture map/directory
- **Backend**: Single Spring Boot application serving both frontends

### Development Profiles
- `frontend-admin` (default): Builds admin application
- `frontend-map`: Builds map application  
- Use Maven profiles to switch between frontend builds

### External Dependencies
- Requires PostgreSQL database connection
- Chrome/Chromedriver for web scraping functionality
- Various API keys for external services (configured via application.yml)

## Processing Slack Video Messages

When reading Slack messages that contain videos (check `.files[].mp4` in JSON output):

### Key Slack IDs
- **Ingo Michelfelder DM**: `D08PRF1T8BE`
- **Ingo User ID**: `U04B22W94EN`
- **Ingo + Praew + Alona Group DM**: `C08U9G6MSLC`

### Slack Best Practices
**ALWAYS** use `--include-threads` when reading Slack conversations:
```bash
slackcli conversations read <channel-id> --json --include-threads
```
Thread replies often contain critical requirements, clarifications, or follow-up details that aren't in the parent message.

For messages with videos, extract frames using `bun scripts/extract-video-frames.ts` - see "How to Extract Frames" below.

### Transcripts
Transcripts are automatically included when using slackcli - videos with `transcription.status === 'complete'` will have a `transcript` field.

### When to Extract Video Frames
Extract frames when:
- The transcript mentions UI, screens, charts, code, or visual elements
- The user asks about implementation tasks (videos often show what to build)
- The transcript references "this", "here", "as you can see" (pointing at something on screen)
- You need to understand WHAT something looks like, not just what was said

### How to Extract Frames
```bash
# ffmpeg is automatically installed at session start (via SessionStart hook)

# Get video URL from slackcli (always use --include-threads)
slackcli conversations read <channel-id> --json --include-threads | jq '.messages[].files[].mp4'

# Extract unique frames (scene detection - only extracts when content changes)
bun scripts/extract-video-frames.ts "<video-url>" /tmp/frames

# Read frames with the Read tool: /tmp/frames/frame_001.jpg, frame_002.jpg, etc.
```

### Workflow Example
When user says "check Ingo's latest messages and tell me what tasks need to be done":
1. Run `slackcli conversations read <channel-id> --json --include-threads` to get messages with transcripts
2. For any videos, check if transcript mentions visual elements
3. If yes, extract frames: `bun scripts/extract-video-frames.ts <mp4-url> /tmp/frames`
4. Read the frames to see what's being shown
5. Combine transcript + visual context to provide accurate task list

## Processing Slack File Attachments

When reading Slack messages, **always check for and download file attachments** (`.files[]` in JSON output). Download files proactively so they're available for analysis during your workflow.

### File Previews
For text files (CSV, code, etc.), Slack includes a `preview` field in the JSON output with the first few lines. You can check this before downloading to get a sense of the nature of the file.

### Reading File Content (Text Files)
```bash
# Read text file content directly without downloading
slackcli files read --url "<url_private_download>"
```

### Downloading Files
```bash
# Download a file to disk
slackcli files download --url "<url_private_download>" --output /tmp/filename.ext
```

### Reading Downloaded Files
- **Images**: Use the Read tool directly: `Read /tmp/filename.png`
- **CSV**: Use `slackcli files read` for text content, or download and parse
- **ZIP**: Download and extract with `unzip`
- **Documents**: Download and extract text content for analysis

### Workflow Example
When checking messages for file attachments:
1. Run `slackcli conversations read <channel-id> --json --include-threads`
2. Look for `.files[]` arrays in messages
3. **Download all files** to `/tmp/` using `slackcli files download`
4. Read/analyze files as needed during your workflow

## Fetching Google Sheets Data

For **public** Google Sheets shared in Slack or elsewhere, you can fetch the data directly using the CSV export URL:

```bash
# Example - download to file:
curl -sL "https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={TAB_ID}" -o /tmp/sheet.csv
```

**Note:** WebFetch on the regular Google Sheets URL (`/edit?gid=0`) likely will NOT work, it only gets the HTML/JS shell, not the actual data which is loaded dynamically via JavaScript.
