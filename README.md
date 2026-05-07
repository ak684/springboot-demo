![Build Status](https://github.com/LaunchForce-AI/venture-impact-platform/actions/workflows/ci.yml/badge.svg)

# Venture Impact Platform

## Quick Start

Clone repository:

```bash
git clone git@github.com:LaunchForce-AI/venture-impact-platform.git
cd venture-impact-platform
```

Run backend from IDE: Open `Application.java` and press Run. Visit [http://localhost:9000/](http://localhost:9000/)

Run frontend:

```bash
cd frontend/admin-app
npm install
npm start
```

Visit [http://localhost:3010/](http://localhost:3010/)

## Local Development

Install tools:
* [Maven](https://maven.apache.org/install.html)
* [JDK 17](https://adoptium.net/temurin/releases/)
* [Node.js 18+](https://nodejs.org/en/download/)

You also need the Lombok plugin in your IDE.

## Deployment

**Auto-deploy:** Pushing to `main` triggers GitHub Actions which builds and deploys to production automatically.

Production URL: [app.impactforesight.io](https://app.impactforesight.io/)

### Manual Service Management

```bash
# SSH to server
ssh root@app.impactforesight.io

# Restart service
systemctl restart impactforesight

# Check status
systemctl status impactforesight

# View logs
journalctl -u impactforesight.service -f
```

### Production Architecture

Traffic flows through nginx which handles TLS termination and routes requests:

```
User (HTTPS:443) → nginx → /sysadmin/* → sysadmin service (HTTP:9001)
                         → /*          → Spring Boot app (HTTP:9000)
```

This architecture ensures the sysadmin service stays available even if the main app crashes, enabling remote debugging and recovery.

| Component | Port | Description |
|-----------|------|-------------|
| nginx | 443 | TLS termination, reverse proxy |
| Spring Boot | 9000 | Main application (HTTP, localhost only) |
| Sysadmin | 9001 | Shell/SQL endpoints (HTTP, localhost only) |

```bash
# Check all services
systemctl status nginx impactforesight sysadmin

# Restart individual services
systemctl restart nginx
systemctl restart impactforesight
systemctl restart sysadmin

# View nginx config
cat /etc/nginx/sites-available/impactforesight
```

### Sysadmin Service

A lightweight Node.js service that provides remote shell exec and SQL query capabilities. Runs independently from the main app, so it stays available even during deploys or if the main app crashes. Auth is controlled via a sysadmin key env variable. This needs to be set on both server and client before usage.

| Item | Location |
|------|----------|
| Code | `sysadmin-service/` (this repo) |
| Server files | `/opt/sysadmin-service/` |
| Systemd unit | `/etc/systemd/system/sysadmin.service` |
| URL | `https://app.impactforesight.io/sysadmin/` |

**Endpoints:**
- `GET /sysadmin/health` - Health check (no auth required)
- `POST /sysadmin/query` - Execute SQL queries (requires `X-Sys-Admin-Key` header)
- `POST /sysadmin/exec` - Execute shell commands (requires `X-Sys-Admin-Key` header)

**Example usage:**
```bash
# Health check
curl https://app.impactforesight.io/sysadmin/health

# SQL query
curl -X POST "https://app.impactforesight.io/sysadmin/query" \
  -H "Content-Type: application/json" \
  -H "X-Sys-Admin-Key: $SYSADMIN_API_KEY" \
  -d '{"sql": "SELECT COUNT(*) FROM users"}'

# Shell command
curl -X POST "https://app.impactforesight.io/sysadmin/exec" \
  -H "Content-Type: application/json" \
  -H "X-Sys-Admin-Key: $SYSADMIN_API_KEY" \
  -d '{"command": "systemctl status impactforesight"}'
```

**Updating the service:**
```bash
scp sysadmin-service/index.js root@app.impactforesight.io:/opt/sysadmin-service/
ssh root@app.impactforesight.io "systemctl restart sysadmin"
```

See `sysadmin-service/README.md` for full documentation.

### SSL Certificate Renewal

Certificates are managed via certbot and used by nginx. The certs are at `/etc/letsencrypt/live/app.impactforesight.io/`.

```bash
# Renew certificate (nginx handles reload automatically)
certbot renew

# Or with nginx reload
certbot renew --post-hook "systemctl reload nginx"

# Check certificate expiry
certbot certificates
```

Note: Legacy config for when Spring Boot handled TLS directly is saved at `/impactforesight/legacy-ssl-config/` on the server, with instructions to revert if needed.

### Database Backups

Automated daily backups run at 3am UTC via cron job.

| Item | Location |
|------|----------|
| Backup script | `/impactforesight/backup.sh` |
| Backup folder | `/impactforesight/backups/` |
| Log file | `/impactforesight/backups/backup.log` |
| Retention | 30 days (auto-deleted) |

```bash
# Manual backup
/impactforesight/backup.sh

# List backups
ls -lah /impactforesight/backups/

# Restore from backup
sudo -u postgres pg_restore -d impactforesight /impactforesight/backups/impactforesight_YYYY_MM_DD.dump
```

---

## Server Setup Reference

Reference for setting up a new server/droplet from scratch.

### 1. Install JDK 17

```bash
sudo apt update && sudo apt upgrade -y
sudo apt-get install openjdk-17-jre openjdk-17-jdk -y
```

### 2. Install PostgreSQL

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null
sudo apt update
sudo apt install postgresql postgresql-client -y
```

### 3. Setup Database

```bash
sudo -u postgres psql

ALTER USER postgres PASSWORD 'yourpassword';
CREATE DATABASE impactforesight;
CREATE USER impact_user WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE impactforesight TO impact_user;
```

### 4. Create Systemd Service

```bash
sudo nano /etc/systemd/system/impactforesight.service
```

Contents:

```ini
[Unit]
Description=Venture impact platform
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=on-abnormal
RestartSec=1
User=root
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=prod -Dspring.config.location=classpath:application.yml,/impactforesight/application.yml /impactforesight/ventureplatform-1.0.jar

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
systemctl daemon-reload
systemctl enable impactforesight
```

### 5. Install nginx and Certbot for SSL

nginx handles TLS termination and routes traffic to the backend services.

```bash
apt install nginx certbot -y
```

Create SSL certificate:

```bash
systemctl stop nginx
certbot certonly -a standalone -d app.impactforesight.io
systemctl start nginx
```

Create nginx config at `/etc/nginx/sites-available/impactforesight`:

```nginx
server {
    listen 443 ssl;
    server_name app.impactforesight.io;

    ssl_certificate /etc/letsencrypt/live/app.impactforesight.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.impactforesight.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Sysadmin endpoints - route to sysadmin service on 9001
    location /sysadmin/ {
        proxy_pass http://127.0.0.1:9001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # Everything else - route to main Spring Boot app on 9000
    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name app.impactforesight.io;
    return 301 https://$server_name$request_uri;
}
```

Enable the config:

```bash
ln -sf /etc/nginx/sites-available/impactforesight /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 6. Install Chrome and Chromedriver

Required for web scraping functionality.

```bash
sudo apt update
sudo apt install -y unzip xvfb libxi6 libgconf-2-4
sudo curl -sS -o - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add
sudo bash -c "echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' >> /etc/apt/sources.list.d/google-chrome.list"
sudo apt -y update
sudo apt -y install google-chrome-stable
```

Then install chromedriver (version must match Chrome):

```bash
# Check Chrome version first
google-chrome --version

# Download matching chromedriver from https://chromedriver.chromium.org/downloads
wget https://chromedriver.storage.googleapis.com/<VERSION>/chromedriver_linux64.zip
unzip chromedriver_linux64.zip
sudo mv chromedriver /usr/local/bin/chromedriver
sudo chown root:root /usr/local/bin/chromedriver
sudo chmod +x /usr/local/bin/chromedriver
```

### 7. Install Node.js and Maven (for manual builds)

```bash
# Node.js via nvm
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.profile
nvm install 18

# Maven
apt install maven -y
```

### 8. Setup GitHub Actions Deploy

Add these secrets to the GitHub repo:
- `DROPLET_HOST` - server IP/hostname
- `DROPLET_USERNAME` - SSH user (root)
- `DROPLET_SSH_KEY` - private SSH key
- `DROPLET_PORT` - SSH port (22)

Generate SSH key on server and add public key to GitHub deploy keys:

```bash
cd ~/.ssh
ssh-keygen -t rsa
cat id_rsa.pub  # Add this to GitHub repo deploy keys
```
