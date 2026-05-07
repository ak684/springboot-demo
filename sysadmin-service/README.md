# Sysadmin Service

Lightweight service for shell exec and SQL queries. Runs independently from the main app so Claude Code Web can diagnose/fix issues even when the main app is down.

## Production Deployments

### Main App Server (app.impactforesight.io)

- **Server**: `app.impactforesight.io` (159.223.110.238)
- **URL**: `https://app.impactforesight.io/sysadmin/` (nginx proxies to port 9001)
- **Files**: `/opt/sysadmin-service/`
- **Systemd**: `/etc/systemd/system/sysadmin.service`
- **Env file**: `/opt/sysadmin-service/.env` (contains DB_PASSWORD)
- **Features**: exec + query endpoints (has database access)

### Map Server (map.impactforesight.io)

- **Server**: `map.impactforesight.io` (134.122.112.217)
- **URL**: `https://map.impactforesight.io/sysadmin/` (nginx proxies to port 9001)
- **Files**: `/sysadmin-service/`
- **Systemd**: `/etc/systemd/system/sysadmin.service`
- **Env file**: `/sysadmin-service/.env`
- **Features**: exec endpoint only (no database access - map uses main app's database)

## Endpoints

- `POST /exec` - Execute shell command
  ```json
  {"command": "systemctl status <main-app-service>"}
  ```

- `POST /query` - Execute SQL query
  ```json
  {"sql": "SELECT id, email FROM users LIMIT 5"}
  ```

- `GET /health` - Health check (no auth required)

## Authentication

All endpoints (except /health) require the `X-Sys-Admin-Key` header. Uses the same key as the main app's sysadmin endpoints.

## Deployment

```bash
# Copy files to server
scp index.js package.json root@app.impactforesight.io:/opt/sysadmin-service/

# On the server
cd /opt/sysadmin-service
npm install

# Create systemd service (if first time)
cat > /etc/systemd/system/sysadmin.service << 'EOF'
[Unit]
Description=Sysadmin Service
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/sysadmin-service
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5

Environment=PORT=9001
Environment=SYSADMIN_API_KEY=<your-api-key>
Environment=DB_HOST=localhost
Environment=DB_PORT=5432
Environment=DB_NAME=<your-database-name>
Environment=DB_USER=<your-database-user>
EnvironmentFile=/opt/sysadmin-service/.env

[Install]
WantedBy=multi-user.target
EOF

# Create .env with DB password
echo 'DB_PASSWORD=<your-db-password>' > /opt/sysadmin-service/.env
chmod 600 /opt/sysadmin-service/.env

# Enable and start
systemctl daemon-reload
systemctl enable sysadmin
systemctl start sysadmin
```

## Usage

Both servers use standard HTTPS port 443 via nginx proxy:

```bash
# Health check (main app server)
curl -s https://app.impactforesight.io/sysadmin/health

# Health check (map server)
curl -s https://map.impactforesight.io/sysadmin/health

# Execute command on main app server
curl -s -X POST https://app.impactforesight.io/sysadmin/exec \
  -H "Content-Type: application/json" \
  -H "X-Sys-Admin-Key: $SYSADMIN_API_KEY" \
  -d '{"command": "uptime"}'

# Execute command on map server
curl -s -X POST https://map.impactforesight.io/sysadmin/exec \
  -H "Content-Type: application/json" \
  -H "X-Sys-Admin-Key: $SYSADMIN_API_KEY" \
  -d '{"command": "uptime"}'

# Query database (main app server only)
curl -s -X POST https://app.impactforesight.io/sysadmin/query \
  -H "Content-Type: application/json" \
  -H "X-Sys-Admin-Key: $SYSADMIN_API_KEY" \
  -d '{"sql": "SELECT NOW()"}'
```

## Updating

```bash
# After making changes to index.js locally
scp index.js root@app.impactforesight.io:/opt/sysadmin-service/
ssh root@app.impactforesight.io "systemctl restart sysadmin"
```
