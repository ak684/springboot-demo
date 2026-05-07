/**
 * Standalone sysadmin service for production.
 * Runs independently on port 9001, routed via nginx.
 *
 * API CONTRACT (keep in sync with SysAdminDevController.java):
 *   GET  /health - { status: "ok" } (no auth)
 *   POST /exec   - { command } -> { output, exitCode }
 *   POST /query  - { sql } -> { rows, rowCount }
 *
 * For local dev and Render PR previews, the Spring Boot app
 * provides these same endpoints via SysAdminDevController.
 */

const http = require('http');
const { exec } = require('child_process');
const { Pool } = require('pg');

const PORT = process.env.PORT || 9001;
const API_KEY = process.env.SYSADMIN_API_KEY;

if (!API_KEY) {
  console.error('SYSADMIN_API_KEY environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'impactforesight',
  user: process.env.DB_USER || 'impact_user',
  password: process.env.DB_PASSWORD
});

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function authenticate(req) {
  return req.headers['x-sys-admin-key'] === API_KEY;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleExec(req, res) {
  const { command } = await parseBody(req);
  if (!command) {
    return sendJson(res, 400, { error: 'command is required' });
  }

  log(`Executing: ${command}`);

  exec(command, { maxBuffer: 10 * 1024 * 1024, timeout: 300000 }, (error, stdout, stderr) => {
    const output = stdout + stderr;
    if (error && !output) {
      sendJson(res, 500, { error: error.message, exitCode: error.code });
    } else {
      sendJson(res, 200, { output, exitCode: error ? error.code : 0 });
    }
  });
}

async function handleQuery(req, res) {
  const { sql } = await parseBody(req);
  if (!sql) {
    return sendJson(res, 400, { error: 'sql is required' });
  }

  log(`Executing SQL: ${sql.substring(0, 100)}...`);

  try {
    const result = await pool.query(sql);
    sendJson(res, 200, { rows: result.rows, rowCount: result.rowCount });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sys-Admin-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Health check (no auth required)
  if (req.url === '/health' && req.method === 'GET') {
    return sendJson(res, 200, { status: 'ok' });
  }

  // Auth check for all other endpoints
  if (!authenticate(req)) {
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  try {
    if (req.url === '/exec' && req.method === 'POST') {
      await handleExec(req, res);
    } else if (req.url === '/query' && req.method === 'POST') {
      await handleQuery(req, res);
    } else {
      sendJson(res, 404, { error: 'Not found' });
    }
  } catch (error) {
    log(`Error: ${error.message}`);
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  log(`Sysadmin service running on port ${PORT}`);
});
