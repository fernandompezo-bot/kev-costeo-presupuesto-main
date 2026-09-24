/**
 * server.js - Servidor Web HTTP y API REST para KEV Process SpA
 * Diseñado para despliegue en Servidores Web (IIS, Linux Nginx/PM2, Docker o Local)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const OFERTAS_DIR = 'C:\\DATA\\KEV Ofertas\\2026';

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // --- RUTAS DE API REST ---
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', serverTime: new Date().toISOString(), version: '1.1.0' }));
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
  console.log(`=======================================================`);
});
