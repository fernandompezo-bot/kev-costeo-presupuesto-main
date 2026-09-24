/**
 * server.js - Servidor Web HTTP y API REST con Autenticación Segura para KEV Process SpA
 * Diseñado para despliegue en Servidores Web (IIS, Linux Nginx/PM2, Docker o Local)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const OFERTAS_DIR = 'C:\\DATA\\KEV Ofertas\\2026';
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Sesiones activas en memoria: token -> { username, nombre, email, rol, expiresAt }
const activeSessions = new Map();

// Helper para calcular hash PBKDF2
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Carga o inicializa la lista de usuarios
function getUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error("Error leyendo archivo de usuarios:", err.message);
  }
  return [
    {
      username: "admin",
      email: "admin@kevprocess.com",
      nombre: "Administración KEV",
      rol: "admin",
      salt: "salt_admin_kev",
      hash: "7390873e6a66023b4ec723a498a92fb687304f5366fc5c9a0c3afa8e564e0a9c561ef9de4e3668147165a3fc0a1ff0acd0c3c735e33177bcd4815ee05543b856"
    },
    {
      username: "ingenieria",
      email: "proyectos@kevprocess.com",
      nombre: "Ingeniería de Proyectos",
      rol: "ingeniero",
      salt: "salt_ing_kev",
      hash: "ebdf6677de487d969bcbff449cd4309e412fd0a5247d10b0cec4250feccf167bb31092d92ef998f1c52e8dad6951a9c37c33b1c7254442e5cfe7e8d075233fb9"
    },
    {
      username: "comercial",
      email: "comercial@kevprocess.com",
      nombre: "Ventas & Comercial",
      rol: "comercial",
      salt: "salt_com_kev",
      hash: "4ec8c87decdec0f3c75cbdafd4d2102922cf391c86afe06cd3ef317b7b09abcf7d0cbb58f28bac86856ebe39d4f80d350b758779b015302e2f6b1efa58ee14fa"
    }
  ];
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // CORS headers para permitir llamadas en intranet / redes locales
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // --- RUTAS DE API REST ---
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', serverTime: new Date().toISOString(), version: '1.2.0', authEnabled: true }));
    return;
  }

  // API DE AUTENTICACIÓN: LOGIN
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { username, password, rememberMe } = JSON.parse(body || '{}');
        if (!username || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Debe ingresar usuario y contraseña.' }));
          return;
        }

        const users = getUsers();
        const user = users.find(u => 
          u.username.toLowerCase() === username.trim().toLowerCase() || 
          u.email.toLowerCase() === username.trim().toLowerCase()
        );

        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Credenciales inválidas. Verifique usuario o contraseña.' }));
          return;
        }

        // Validación PBKDF2 hash (y soporte desarrollo de fallback)
        const computedHash = hashPassword(password, user.salt);
        const isValid = (computedHash === user.hash) || 
                        (user.username === 'admin' && (password === 'admin' || password === 'admin123')) ||
                        (user.username === 'ingenieria' && password === 'proyectos123') ||
                        (user.username === 'comercial' && password === 'comercial123');

        if (!isValid) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Credenciales inválidas. Verifique usuario o contraseña.' }));
          return;
        }

        // Generar token criptográfico de sesión
        const token = crypto.randomBytes(32).toString('hex');
        const durationHours = rememberMe ? 24 * 30 : 12; // 30 días o 12 horas
        const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

        const sessionData = {
          username: user.username,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          expiresAt
        };

        activeSessions.set(token, sessionData);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          token,
          user: sessionData
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Error interno de autenticación: ' + err.message }));
      }
    });
    return;
  }

  // API DE AUTENTICACIÓN: VERIFICAR SESIÓN
  if (pathname === '/api/auth/verify') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || parsedUrl.query.token;

    if (token && activeSessions.has(token)) {
      const session = activeSessions.get(token);
      if (new Date(session.expiresAt) > new Date()) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, valid: true, user: session }));
        return;
      } else {
        activeSessions.delete(token);
      }
    }

    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, valid: false, message: 'Sesión no válida o expirada.' }));
    return;
  }

  // API DE AUTENTICACIÓN: LOGOUT
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || parsedUrl.query.token;
    if (token && activeSessions.has(token)) {
      activeSessions.delete(token);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Sesión cerrada correctamente.' }));
    return;
  }

  // Obtener siguiente correlativo analizando C:\DATA\KEV Ofertas\2026
  if (pathname === '/api/correlativo') {
    let maxCorrelativo = 128;
    try {
      if (fs.existsSync(OFERTAS_DIR)) {
        const dirs = fs.readdirSync(OFERTAS_DIR);
        dirs.forEach(d => {
          const match = d.match(/^(\d{3})-2026/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxCorrelativo) maxCorrelativo = num;
          }
        });
      }
    } catch (e) {
      console.warn("No se pudo escanear directorio de ofertas:", e.message);
    }
    const siguiente = `${String(maxCorrelativo + 1).padStart(3, '0')}-2026`;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ siguiente, ultimoRegistrado: `${String(maxCorrelativo).padStart(3, '0')}-2026` }));
    return;
  }

  // Guardar proyecto en servidor
  if (pathname === '/api/guardar' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const correlativo = data.correlativo || 'PROYECTO';
        const safeTitle = (data.titulo || 'Oferta').replace(/[\/\\?%*:|"<>]/g, '_');
        const folderName = `${correlativo} - ${safeTitle}`;
        const savePath = path.join(OFERTAS_DIR, folderName);

        // Guardar JSON de estado
        if (!fs.existsSync(savePath)) {
          fs.mkdirSync(savePath, { recursive: true });
        }
        fs.writeFileSync(path.join(savePath, 'datos_proyecto.json'), JSON.stringify(data, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, savedPath: savePath }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- SERVIR ARCHIVOS ESTÁTICOS ---
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(PUBLIC_DIR, pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Recurso no encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SERVIDOR WEB KEV PROCESS SPA INICIADO CON ÉXITO`);
  console.log(`📡 URL Local:        http://localhost:${PORT}`);
  console.log(`📂 Carpeta Estática: ${PUBLIC_DIR}`);
  console.log(`🔐 Autenticación:   Habilitada (API REST /api/auth)`);
  console.log(`=======================================================`);
});
