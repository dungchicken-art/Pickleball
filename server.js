const { createServer: createHttpServer } = require('node:http');
const { readFile, writeFile, stat } = require('node:fs/promises');
const { createReadStream } = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

const DEMO_USERS = {
  user: { email: 'user@pickle.com', password: 'play123' },
  admin: { email: 'admin@pickle.com', password: 'verify123' },
};

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8') || '{}';
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('invalid_json');
  }
}

async function loadBookings() {
  try {
    const raw = await readFile(BOOKINGS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await saveBookings([]);
      return [];
    }
    throw error;
  }
}

async function saveBookings(bookings) {
  await writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sanitizePath(requestPath) {
  const safeSuffix = path.normalize(requestPath).replace(/^\//, '');
  const resolvedPath = path.join(ROOT_DIR, safeSuffix);
  if (!resolvedPath.startsWith(ROOT_DIR)) {
    return null;
  }
  return resolvedPath;
}

async function handleLogin(req, res) {
  const body = await readJsonBody(req);
  const { role, email, password } = body;
  const match = DEMO_USERS[role];
  if (!match || match.email !== email || match.password !== password) {
    return sendJson(res, 401, { message: 'Sai tài khoản demo' });
  }
  return sendJson(res, 200, { role, email });
}

function validateBooking(input) {
  const required = ['date', 'time', 'duration', 'playerName', 'phone', 'paymentMethod'];
  for (const field of required) {
    if (!input[field]) return false;
  }
  return true;
}

async function handleCreateBooking(req, res) {
  const body = await readJsonBody(req);
  if (!validateBooking(body)) {
    return sendJson(res, 400, { message: 'Thiếu dữ liệu đặt sân' });
  }

  const booking = {
    id: randomUUID(),
    date: body.date,
    time: body.time,
    duration: body.duration,
    playerName: body.playerName,
    phone: body.phone,
    paymentMethod: body.paymentMethod,
    paymentRef: body.paymentRef || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const bookings = await loadBookings();
  bookings.unshift(booking);
  await saveBookings(bookings);
  return sendJson(res, 201, booking);
}

async function handleListBookings(res) {
  const bookings = await loadBookings();
  bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return sendJson(res, 200, bookings);
}

async function handleUpdateStatus(req, res, bookingId) {
  const body = await readJsonBody(req);
  const allowed = ['pending', 'confirmed', 'rejected'];
  if (!allowed.includes(body.status)) {
    return sendJson(res, 400, { message: 'Trạng thái không hợp lệ' });
  }

  const bookings = await loadBookings();
  const index = bookings.findIndex((item) => item.id === bookingId);
  if (index === -1) {
    return sendJson(res, 404, { message: 'Không tìm thấy đặt sân' });
  }

  bookings[index].status = body.status;
  await saveBookings(bookings);
  return sendJson(res, 200, bookings[index]);
}

async function serveStatic(req, res, requestPath) {
  const normalizedPath = requestPath === '/admin' ? '/admin.html' : requestPath;
  let resolved = sanitizePath(normalizedPath);
  if (!resolved) {
    res.writeHead(400);
    return res.end('Bad request');
  }

  let stats;
  try {
    stats = await stat(resolved);
  } catch (error) {
    res.writeHead(404);
    return res.end('Not found');
  }

  if (stats.isDirectory()) {
    const fallback = requestPath === '/admin' ? 'admin.html' : 'index.html';
    resolved = path.join(resolved, fallback);
  }

  const ext = path.extname(resolved).toLowerCase();
  const mimeType = MIME_MAP[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': mimeType });
  const stream = createReadStream(resolved);
  stream.pipe(res);
  stream.on('error', () => {
    res.writeHead(500);
    res.end('Server error');
  });
}

async function router(req, res) {
  const { method } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      return await handleLogin(req, res);
    } catch (error) {
      const status = error.message === 'invalid_json' ? 400 : 500;
      return sendJson(res, status, { message: 'Không đọc được dữ liệu' });
    }
  }

  if (pathname === '/api/bookings' && method === 'GET') {
    try {
      return await handleListBookings(res);
    } catch (error) {
      return sendJson(res, 500, { message: 'Lỗi tải danh sách' });
    }
  }

  if (pathname === '/api/bookings' && method === 'POST') {
    try {
      return await handleCreateBooking(req, res);
    } catch (error) {
      const status = error.message === 'invalid_json' ? 400 : 500;
      return sendJson(res, status, { message: 'Không lưu được đặt sân' });
    }
  }

  if (pathname.startsWith('/api/bookings/') && method === 'PATCH') {
    const id = pathname.replace('/api/bookings/', '');
    try {
      return await handleUpdateStatus(req, res, id);
    } catch (error) {
      const status = error.message === 'invalid_json' ? 400 : 500;
      return sendJson(res, status, { message: 'Không cập nhật được trạng thái' });
    }
  }

  return serveStatic(req, res, pathname === '/' ? '/index.html' : pathname);
}

function createServer() {
  return createHttpServer((req, res) => {
    router(req, res);
  });
}

function startServer(port = process.env.PORT || 3000) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`Pickleball server đang chạy tại http://localhost:${port}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { createServer, startServer };
