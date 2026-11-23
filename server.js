// Local server for the kanji bubble game: static files + Soniox TTS proxy.
// Zero dependencies (Node >= 18 for global fetch).
//
//   SONIOX_API_KEY=... node server.js          -> http://127.0.0.1:8000
//
// Settings can also live in a `.env` file next to this script (KEY=VALUE lines).
// Variables already set in the shell win over .env. ENV_FILE=/path overrides the file location.
//
// The API key stays on this server; the browser only calls GET /api/tts?text=...
// Soniox call follows talkbear-collect src/lib/soniox-tts.ts (REST POST {base}/tts -> raw audio bytes).
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------- .env ----------
// Must run before any process.env reads below. Never overwrites vars already in process.env
// (process.loadEnvFile already behaves this way; the fallback parser checks explicitly).
const ENV_FILE = process.env.ENV_FILE ? path.resolve(process.env.ENV_FILE) : path.join(__dirname, '.env');

function parseEnvFallback(file) {
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.replace(/^export\s+/, '').match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (val.length >= 2 && (val[0] === '"' || val[0] === "'") && val[val.length - 1] === val[0]) val = val.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

function loadEnv(file) {
  try {
    if (typeof process.loadEnvFile === 'function') process.loadEnvFile(file);
    else parseEnvFallback(file);
    return 'loaded';
  } catch (e) {
    if (e && e.code === 'ENOENT') return 'not found';
    console.warn(`[env] could not load ${path.basename(file)}: ${e && e.message}`);
    return 'error';
  }
}
const ENV_STATUS = loadEnv(ENV_FILE);

const ROOT = __dirname;
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT) || 8000;
const CACHE_DIR = path.join(ROOT, '.tts-cache');

// Soniox settings. Keys are region-locked: a JP key only works on the JP endpoint.
const TTS_BASE = (process.env.SONIOX_TTS_BASE_URL || 'https://tts-rt.jp.soniox.com').replace(/\/+$/, '');
const TTS_MODEL = process.env.SONIOX_TTS_MODEL || 'tts-rt-v2';
const TTS_VOICE = process.env.SONIOX_TTS_VOICE || 'Kenji';
// v2 accepts speed 0.7-1.3 only. 0.75: the [warm] [softly] tags speed delivery up a bit, so this
// lands at the tempo of plain 0.8 (slow, clear for small kids) with a softer tone.
const TTS_SPEED = Math.min(1.3, Math.max(0.7, Number(process.env.SONIOX_TTS_SPEED) || 0.75));
// tts-rt-v2 has no style/pitch/emotion request field; delivery is steered with English audio
// tags inline in the text (docs.soniox.com/tts/concepts/emotion-and-tone). This prefix is
// prepended to every request. Set SONIOX_TTS_STYLE="" to disable.
const TTS_STYLE = (process.env.SONIOX_TTS_STYLE ?? '[warm] [softly]').trim();
// reduce_silence shortens pauses between words/sentences (snappier, less calm). Off by default
// for kids; set SONIOX_TTS_REDUCE_SILENCE=1 to re-enable.
const TTS_REDUCE_SILENCE = /^(1|true|yes|on)$/i.test(process.env.SONIOX_TTS_REDUCE_SILENCE || '');
// talkbear uses mp3 / 16 kHz / 64 kbps (proven values); override for higher quality if Soniox accepts it.
const TTS_SAMPLE_RATE = Number(process.env.SONIOX_TTS_SAMPLE_RATE) || 16000;
const TTS_TIMEOUT_MS = 20000;
const MAX_TEXT = 200; // longest game sentence / story chunk is far below this

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Cache-Control': 'no-store',
  });
  res.end(data);
}

// ---------- TTS ----------
const inflight = new Map(); // cache key -> Promise<Buffer>, so parallel requests share one Soniox call

async function synthesize(text) {
  const key = process.env.SONIOX_API_KEY;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TTS_TIMEOUT_MS);
  try {
    const res = await fetch(`${TTS_BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: TTS_MODEL,
        language: 'ja',
        voice: TTS_VOICE,
        audio_format: 'mp3',
        sample_rate: TTS_SAMPLE_RATE,
        bitrate: 64000,
        text: TTS_STYLE ? `${TTS_STYLE} ${text}` : text,
        reduce_silence: TTS_REDUCE_SILENCE,
        ...(TTS_SPEED !== 1 ? { speed: TTS_SPEED } : {}),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 200);
      const err = new Error(`soniox ${res.status}: ${detail}`);
      err.upstreamStatus = res.status;
      throw err;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) throw new Error('soniox returned empty audio');
    return buf;
  } finally {
    clearTimeout(timer);
  }
}

function cachedAudio(text) {
  const id = crypto.createHash('sha1').update(`${TTS_MODEL}|${TTS_VOICE}|${TTS_SPEED}|${TTS_SAMPLE_RATE}|${TTS_STYLE}|${TTS_REDUCE_SILENCE}|${text}`).digest('hex');
  const file = path.join(CACHE_DIR, `${id}.mp3`);
  if (inflight.has(id)) return inflight.get(id);
  const job = (async () => {
    try {
      return { buf: await fs.promises.readFile(file), hit: true };
    } catch { /* not cached yet */ }
    const buf = await synthesize(text);
    await fs.promises.mkdir(CACHE_DIR, { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.promises.writeFile(tmp, buf);
    await fs.promises.rename(tmp, file);
    return { buf, hit: false };
  })().finally(() => inflight.delete(id));
  inflight.set(id, job);
  return job;
}

async function handleTts(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  // Another website open in the same browser must not spend our Soniox credit.
  if (req.headers['sec-fetch-site'] === 'cross-site') {
    sendJson(res, 403, { error: 'cross-site request refused' });
    return;
  }
  if (url.pathname === '/api/tts/status') {
    sendJson(res, 200, { ready: !!process.env.SONIOX_API_KEY, voice: TTS_VOICE, model: TTS_MODEL });
    return;
  }
  const text = (url.searchParams.get('text') || '').trim();
  if (!text) {
    sendJson(res, 400, { error: 'missing text' });
    return;
  }
  if ([...text].length > MAX_TEXT) {
    sendJson(res, 400, { error: `text too long (max ${MAX_TEXT} chars)` });
    return;
  }
  if (!process.env.SONIOX_API_KEY) {
    sendJson(res, 503, { error: 'SONIOX_API_KEY is not set on the server' });
    return;
  }
  try {
    const { buf, hit } = await cachedAudio(text);
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=86400',
      'X-TTS-Cache': hit ? 'hit' : 'miss',
    });
    res.end(req.method === 'HEAD' ? undefined : buf);
  } catch (e) {
    const msg = e && e.name === 'AbortError' ? 'soniox timeout' : (e && e.message) || 'unknown error';
    console.error(`[tts] ${msg}`);
    sendJson(res, 502, { error: `TTS failed: ${msg}`, upstreamStatus: (e && e.upstreamStatus) || null });
  }
}

// ---------- Static files ----------
async function handleStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }
  let rel;
  try {
    rel = decodeURIComponent(url.pathname);
  } catch {
    sendJson(res, 400, { error: 'bad path' });
    return;
  }
  if (rel.includes('\0')) {
    sendJson(res, 400, { error: 'bad path' });
    return;
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(ROOT, `.${path.posix.normalize(rel)}`);
  const inside = path.relative(ROOT, file);
  // Refuse anything outside the repo and any dotfile / dot-directory (.git, .tts-cache, .env ...).
  if (!inside || inside.startsWith('..') || path.isAbsolute(inside) || inside.split(path.sep).some((p) => p.startsWith('.'))) {
    sendJson(res, 404, { error: 'not found' });
    return;
  }
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) {
    sendJson(res, 404, { error: 'not found' });
    return;
  }
  let stat;
  try {
    // realpath so a symlink inside the repo cannot point outside it
    const real = await fs.promises.realpath(file);
    const realRoot = await fs.promises.realpath(ROOT);
    if (real !== realRoot && !real.startsWith(realRoot + path.sep)) throw new Error('outside');
    stat = await fs.promises.stat(real);
    if (!stat.isFile()) throw new Error('not a file');
  } catch {
    sendJson(res, 404, { error: 'not found' });
    return;
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Cache-Control': 'no-cache' });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    sendJson(res, 400, { error: 'bad url' });
    return;
  }
  const p = url.pathname;
  const handler = p === '/api/tts' || p === '/api/tts/status' ? handleTts : handleStatic;
  handler(req, res, url).catch((e) => {
    console.error(e);
    if (!res.headersSent) sendJson(res, 500, { error: 'internal error' });
    else res.destroy();
  });
});

server.listen(PORT, HOST, () => {
  console.log(`bubble-game: http://${HOST}:${PORT}/`);
  console.log(`env: ${path.basename(ENV_FILE)} ${ENV_STATUS} | SONIOX_API_KEY set: ${process.env.SONIOX_API_KEY ? 'yes' : 'no'}`);
  console.log(`TTS: ${process.env.SONIOX_API_KEY ? 'Soniox ready' : 'SONIOX_API_KEY not set (browser will fall back to speechSynthesis)'}` +
    ` | model=${TTS_MODEL} voice=${TTS_VOICE} speed=${TTS_SPEED} style=${JSON.stringify(TTS_STYLE)} reduce_silence=${TTS_REDUCE_SILENCE} base=${TTS_BASE}`);
});
