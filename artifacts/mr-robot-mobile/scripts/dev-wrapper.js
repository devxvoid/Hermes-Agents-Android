'use strict';
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

const PORT = parseInt(process.env.PORT, 10);
if (!PORT) {
  console.error('[dev-wrapper] PORT env var is required');
  process.exit(1);
}

const METRO_PORT = PORT + 1;
let metroStarted = false;

// Set Expo environment vars from Replit's container environment
if (process.env.REPLIT_EXPO_DEV_DOMAIN && !process.env.EXPO_PACKAGER_PROXY_URL) {
  process.env.EXPO_PACKAGER_PROXY_URL = `https://${process.env.REPLIT_EXPO_DEV_DOMAIN}`;
}
if (process.env.REPLIT_DEV_DOMAIN && !process.env.EXPO_PUBLIC_DOMAIN) {
  process.env.EXPO_PUBLIC_DOMAIN = process.env.REPLIT_DEV_DOMAIN;
}
if (process.env.REPL_ID && !process.env.EXPO_PUBLIC_REPL_ID) {
  process.env.EXPO_PUBLIC_REPL_ID = process.env.REPL_ID;
}
if (process.env.REPLIT_DEV_DOMAIN && !process.env.REACT_NATIVE_PACKAGER_HOSTNAME) {
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = process.env.REPLIT_DEV_DOMAIN;
}

// HTTP server that immediately accepts connections (so workflow checker detects port)
// Returns 200 while Metro starts, then proxies real requests once Metro is ready
const server = http.createServer((req, res) => {
  if (!metroStarted) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Starting Expo...\n');
    return;
  }
  const opts = {
    hostname: '127.0.0.1',
    port: METRO_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${METRO_PORT}` },
  };
  const upstream = http.request(opts, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
    upstreamRes.pipe(res, { end: true });
  });
  upstream.on('error', () => {
    if (!res.headersSent) { res.writeHead(502); res.end('Metro not reachable\n'); }
  });
  req.pipe(upstream, { end: true });
});

// Forward WebSocket upgrades (Expo HMR)
server.on('upgrade', (req, socket, head) => {
  const dest = net.connect(METRO_PORT, '127.0.0.1', () => {
    const headers = [
      `${req.method} ${req.url} HTTP/${req.httpVersion}`,
      ...Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`),
      '', '',
    ].join('\r\n');
    dest.write(headers);
    if (head && head.length) dest.write(head);
    socket.pipe(dest, { end: true });
    dest.pipe(socket, { end: true });
  });
  dest.on('error', () => socket.destroy());
  socket.on('error', () => dest.destroy());
});

server.on('error', (err) => {
  console.error('[dev-wrapper] server error:', err.message);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[dev-wrapper] HTTP proxy ready: 0.0.0.0:${PORT} → localhost:${METRO_PORT}`);
  console.log(`[dev-wrapper] EXPO_PACKAGER_PROXY_URL=${process.env.EXPO_PACKAGER_PROXY_URL || '(not set)'}`);

  const expoEnv = { ...process.env, PORT: String(METRO_PORT) };
  const expo = spawn(
    'pnpm',
    ['exec', 'expo', 'start', '--port', String(METRO_PORT)],
    { env: expoEnv, stdio: 'inherit', shell: false,
      cwd: '/home/runner/workspace/artifacts/mr-robot-mobile' }
  );

  setTimeout(() => {
    metroStarted = true;
    console.log(`[dev-wrapper] Metro ready — now forwarding to localhost:${METRO_PORT}`);
  }, 25000);

  expo.on('exit', (code) => {
    server.close();
    process.exit(code ?? 0);
  });
});
