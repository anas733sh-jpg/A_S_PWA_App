/* server.js - Express + Multer + Socket.io + ZIP export
   Save this file at the project root (next to package.json)
*/
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const archiver = require('archiver');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

const uploadDir = path.join(publicDir, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const dataFile = path.join(__dirname, 'poses.json');
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([], null, 2));

function loadPoses() {
  try { return JSON.parse(fs.readFileSync(dataFile)); }
  catch { return []; }
}
function savePoses(list) {
  fs.writeFileSync(dataFile, JSON.stringify(list, null, 2));
}

/* multer storage */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const name = Date.now() + '-' + Math.random().toString(36).slice(2) + path.extname(file.originalname);
    cb(null, name);
  }
});
const upload = multer({ storage });

/* middlewares */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

/* API */

/* get all poses */
app.get('/api/positions', (req, res) => {
  res.json(loadPoses());
});

/* add position (image upload supported as 'image') */
app.post('/api/positions', upload.single('image'), (req, res) => {
  try {
    const list = loadPoses();
    const item = {
      id: Date.now(),
      name: req.body.name || 'بدون اسم',
      description: req.body.description || '',
      image: req.file ? '/uploads/' + req.file.filename : '',
      color: req.body.color || '#ff6f91'
    };
    list.push(item);
    savePoses(list);
    io.emit('positions:update', list);
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed' });
  }
});

/* delete */
app.delete('/api/positions/:id', (req, res) => {
  const id = Number(req.params.id);
  let list = loadPoses();
  const item = list.find(p => p.id === id);
  if (item && item.image) {
    // remove file (best-effort)
    const filePath = path.join(publicDir, item.image);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  list = list.filter(p => p.id !== id);
  savePoses(list);
  io.emit('positions:update', list);
  res.json({ ok: true });
});

/* import (replace) */
app.post('/api/import', (req, res) => {
  if (!req.body || !Array.isArray(req.body.positions)) return res.status(400).json({ error: 'invalid' });
  savePoses(req.body.positions);
  io.emit('positions:update', req.body.positions);
  res.json({ ok: true });
});

/* export JSON */
app.get('/api/export', (req, res) => {
  res.json(loadPoses());
});

/* export zip (positions.json + uploads) */
app.get('/api/export-zip', (req, res) => {
  const archive = archiver('zip', { zlib: { level: 9 }});
  res.attachment('export.zip');
  archive.pipe(res);
  archive.append(JSON.stringify(loadPoses(), null, 2), { name: 'poses.json' });
  if (fs.existsSync(uploadDir)) {
    fs.readdirSync(uploadDir).forEach(f => {
      archive.file(path.join(uploadDir, f), { name: 'uploads/' + f });
    });
  }
  archive.finalize();
});

/* static page routes (ensure serve from public) */
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/games.html', (req, res) => res.sendFile(path.join(publicDir, 'games.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
app.get('/settings.html', (req, res) => res.sendFile(path.join(publicDir, 'settings.html')));
app.get('/home.html', (req, res) => res.sendFile(path.join(publicDir, 'home.html')));

/* socket.io */
io.on('connection', socket => {
  socket.emit('positions:update', loadPoses());
});

/* start */
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));