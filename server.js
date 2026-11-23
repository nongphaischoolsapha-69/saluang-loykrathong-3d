'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';
const ROOT = __dirname;
const IS_PROD = process.env.NODE_ENV === 'production';
const MAX_SSE_CLIENTS = Number(process.env.MAX_SSE_CLIENTS) || 500;
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : ROOT;
const DATA_FILE = path.join(DATA_DIR, 'krathongs.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const ADMIN_KEY = process.env.ADMIN_KEY || 'saluang2569';

try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const seedFile = path.join(ROOT, 'krathongs.json');
  if (DATA_DIR !== ROOT && !fs.existsSync(DATA_FILE) && fs.existsSync(seedFile)) {
    fs.copyFileSync(seedFile, DATA_FILE);
  }
} catch (err) {
  console.warn('Warning initializing DATA_DIR:', err.message);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8'
};

// Basic Thai & English profanity filter for public wishes, names & chat bubbles
const BAD_WORDS = [
  'ควย', 'เหี้ย', 'สัตว์', 'สัส', 'เย็ด', 'หี', 'แตด', 'มึง', 'กู', 'ไอ้สัส', 'อีดอก', 'ตอแหล',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy'
];

const VALID_OUTFITS = new Set(['sabai', 'rajpatan', 'lanna', 'student', 'street', 'chef', 'likay', 'vip_gold']);
const VALID_HAIRS = new Set(['short', 'bun', 'long', 'bob', 'ponytail', 'twintails', 'wolfcut']);
const VALID_SKINS = new Set(['light', 'warm', 'tan', 'deep']);
const VALID_HATS = new Set(['none', 'flower_crown', 'chada', 'cat_ears', 'cap', 'ngob', 'horns']);
const VALID_GLASSES = new Set(['none', 'sunglasses', 'round', 'heart', 'fox_mask', 'gold_mask']);
const VALID_BACKS = new Set(['none', 'angel_wings', 'butterfly_wings', 'cape', 'bear_bag']);
const VALID_AURAS = new Set(['none', 'fireflies', 'mini_lantern', 'krathong_spirit', 'lotus_ring']);
const VALID_PROPS = new Set(['none', 'lantern', 'flower', 'fan', 'cotton_candy', 'sparkler']);
const VALID_EMOTES = new Set(['wai', 'wave', 'ramwong', 'jump', 'chat', 'firework']);

function sanitizeText(raw, maxLen) {
  let text = String(raw || '').replace(/[\r\n<>]/g, ' ').trim();
  if (text.length > maxLen) text = text.slice(0, maxLen);
  for (const w of BAD_WORDS) {
    const re = new RegExp(w, 'gi');
    text = text.replace(re, '***');
  }
  return text;
}

function sanitizeId(raw) {
  return String(raw || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
}

function sanitizeHex(raw, fallback) {
  const s = String(raw || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s.toLowerCase() : fallback;
}

function clampNum(raw, min, max, fallback) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Number(n.toFixed(3))));
}

function readKrathongs() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeFileSafe(filePath, content) {
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmpPath, content, 'utf8');
    try {
      fs.renameSync(tmpPath, filePath);
      return;
    } catch (_) {
      try { fs.unlinkSync(tmpPath); } catch (__) { /* ignore */ }
    }
  } catch (_) { /* ignore tmp write error */ }
  fs.writeFileSync(filePath, content, 'utf8');
}

function getRequestOrigin(req) {
  const rawProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  const proto = (rawProto === 'https' || rawProto === 'http')
    ? rawProto
    : ((req.socket && req.socket.encrypted) ? 'https' : 'http');
  const rawHost = String(req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`).split(',')[0].trim();
  const safeHost = rawHost.replace(/[^a-zA-Z0-9.:_-]/g, '') || `localhost:${PORT}`;
  return `${proto}://${safeHost}`;
}

function writeKrathongs(list) {
  const trimmed = list.slice(-100);
  writeFileSafe(DATA_FILE, JSON.stringify(trimmed, null, 2));
}

function readStats() {
  const seedCount = readKrathongs().length;
  const fallback = {
    totalVisits: 0,
    totalKrathongsAllTime: seedCount,
    totalBlessings: 0,
    totalFireworks: 0,
    sponsorClicks: {},
    contactOpens: 0,
    couponOpens: 0,
    updatedAt: new Date().toISOString()
  };
  try {
    if (!fs.existsSync(STATS_FILE)) {
      fs.writeFileSync(STATS_FILE, JSON.stringify(fallback, null, 2), 'utf8');
      return fallback;
    }
    const raw = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    return Object.assign({}, fallback, raw || {}, {
      sponsorClicks: (raw && typeof raw.sponsorClicks === 'object' && raw.sponsorClicks) ? raw.sponsorClicks : {}
    });
  } catch (e) {
    return fallback;
  }
}

let statsCache = readStats();
let statsFlushTimer = null;
function saveStats(immediate = false) {
  statsCache.updatedAt = new Date().toISOString();
  const flush = () => {
    statsFlushTimer = null;
    try {
      writeFileSafe(STATS_FILE, JSON.stringify(statsCache, null, 2));
    } catch (e) { /* ignore disk error */ }
  };
  if (immediate) {
    if (statsFlushTimer) {
      clearTimeout(statsFlushTimer);
      statsFlushTimer = null;
    }
    flush();
  } else if (!statsFlushTimer) {
    statsFlushTimer = setTimeout(flush, 1500);
  }
}

// --- Sliding-Window Per-IP Rate Limiter ---
const rateBuckets = new Map();
function getClientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || (req.socket && req.socket.remoteAddress) || 'local';
}

function checkRateLimit(req, bucket, maxReq, windowMs) {
  const ip = getClientIp(req);
  const key = `${ip}|${bucket}`;
  const now = Date.now();
  const cutoff = now - windowMs;
  let arr = rateBuckets.get(key);
  if (!arr) {
    arr = [];
    rateBuckets.set(key, arr);
  }
  while (arr.length && arr[0] < cutoff) arr.shift();
  if (arr.length >= maxReq) return false;
  arr.push(now);
  return true;
}

setInterval(() => {
  const cutoff = Date.now() - 120000;
  for (const [k, arr] of rateBuckets.entries()) {
    while (arr.length && arr[0] < cutoff) arr.shift();
    if (arr.length === 0) rateBuckets.delete(k);
  }
}, 60000).unref();

function readJsonBody(req, maxBytes = 4096) {
  return new Promise((resolve, reject) => {
    let body = '';
    let aborted = false;
    req.on('data', chunk => {
      if (aborted) return;
      body += chunk;
      if (body.length > maxBytes) {
        aborted = true;
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (aborted) return;
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', err => {
      if (!aborted) reject(err);
    });
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(obj));
}

function isAuthorizedAdmin(req) {
  const hdr = String(req.headers['x-admin-key'] || '').trim();
  return Boolean(ADMIN_KEY) && hdr === ADMIN_KEY;
}

// --- Real-Time Online Multiplayer Store & SSE Broadcaster ---
const activePlayers = new Map();
const sseClients = new Set();
const PLAYER_TTL_MS = 14000;
let playersBroadcastTimer = null;
let lastPlayersBroadcastAt = 0;

function pruneInactivePlayers() {
  const now = Date.now();
  let removed = false;
  for (const [id, p] of activePlayers.entries()) {
    if (now - p.lastSeen > PLAYER_TTL_MS) {
      activePlayers.delete(id);
      removed = true;
    }
  }
  return removed;
}

function getPlayersSnapshot() {
  pruneInactivePlayers();
  const now = Date.now();
  const list = [];
  for (const p of activePlayers.values()) {
    list.push({
      id: p.id,
      name: p.name,
      outfit: p.outfit,
      color: p.color,
      hair: p.hair,
      hairColor: p.hairColor,
      skin: p.skin,
      hat: p.hat,
      glasses: p.glasses,
      back: p.back,
      aura: p.aura,
      prop: p.prop,
      isVip: p.isVip,
      x: p.x,
      y: p.y,
      z: p.z,
      yaw: p.yaw,
      moving: p.moving,
      emote: p.emoteUntil > now ? p.emote : '',
      emoteSeq: p.emoteSeq || 0,
      chat: p.chatUntil > now ? p.chat : '',
      chatSeq: p.chatSeq || 0
    });
    if (list.length >= 64) break;
  }
  return list;
}

function broadcastSSE(eventName, payload) {
  if (sseClients.size === 0) return;
  const frame = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(frame);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

function getBroadcastIntervalMs() {
  const n = activePlayers.size;
  if (n >= 120) return 350;
  if (n >= 50) return 240;
  return 150;
}

function flushPlayersBroadcast() {
  playersBroadcastTimer = null;
  lastPlayersBroadcastAt = Date.now();
  const players = getPlayersSnapshot();
  broadcastSSE('players', { players, count: activePlayers.size, ts: lastPlayersBroadcastAt });
}

function schedulePlayersBroadcast(immediate = false) {
  const now = Date.now();
  const elapsed = now - lastPlayersBroadcastAt;
  const interval = getBroadcastIntervalMs();
  if (immediate || elapsed >= interval) {
    if (playersBroadcastTimer) {
      clearTimeout(playersBroadcastTimer);
      playersBroadcastTimer = null;
    }
    flushPlayersBroadcast();
    return;
  }
  if (!playersBroadcastTimer) {
    playersBroadcastTimer = setTimeout(flushPlayersBroadcast, interval - elapsed);
  }
}

let keepAliveTick = 0;
setInterval(() => {
  const removed = pruneInactivePlayers();
  if (removed) schedulePlayersBroadcast(true);
  keepAliveTick++;
  if (keepAliveTick % 3 === 0 && sseClients.size > 0) {
    for (const client of sseClients) {
      try {
        client.write(': keepalive\n\n');
      } catch (e) {
        sseClients.delete(client);
      }
    }
  }
}, 5000).unref();

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-key'
    });
    return res.end();
  }

  // Cloud Run / Load Balancer Health Check
  if (urlPath === '/healthz' && req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      uptimeSec: Math.floor(process.uptime()),
      online: activePlayers.size,
      sse: sseClients.size,
      krathongs: readKrathongs().length
    });
  }

  // Real-time Server-Sent Events (SSE) stream for multiplayer & live pond
  if (urlPath === '/api/live' && req.method === 'GET') {
    if (sseClients.size >= MAX_SSE_CLIENTS) {
      return sendJson(res, 503, { ok: false, error: 'ขณะนี้มีผู้เข้าชมเต็มความจุชั่วคราว กรุณาลองใหม่ในอีกสักครู่' });
    }
    if (req.socket && req.socket.setNoDelay) req.socket.setNoDelay(true);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
    });

    const players = getPlayersSnapshot();
    const list = readKrathongs();
    const initPayload = {
      players,
      count: activePlayers.size,
      krathongs: list.slice(-45),
      stats: {
        totalVisits: statsCache.totalVisits,
        totalKrathongsAllTime: Math.max(statsCache.totalKrathongsAllTime, list.length)
      },
      serverTime: Date.now()
    };
    res.write(`event: init\ndata: ${JSON.stringify(initPayload)}\n\n`);
    sseClients.add(res);

    const cleanup = () => sseClients.delete(res);
    req.on('close', cleanup);
    res.on('close', cleanup);
    return;
  }

  // Player Presence & 3D Avatar V2 State Upsert
  if (urlPath === '/api/presence' && req.method === 'POST') {
    if (!checkRateLimit(req, 'presence', 240, 10000)) {
      return sendJson(res, 429, { ok: false, error: 'ทำรายการถี่เกินไป กรุณารอสักครู่' });
    }
    try {
      const data = await readJsonBody(req, 4096);
      const id = sanitizeId(data.id);
      if (!id) return sendJson(res, 400, { ok: false, error: 'Missing player id' });

      const now = Date.now();
      const prev = activePlayers.get(id);
      const isNew = !prev;
      const isVip = Boolean(data.isVip);

      let outfit = VALID_OUTFITS.has(data.outfit) ? data.outfit : 'sabai';
      if (outfit === 'vip_gold' && !isVip) outfit = 'sabai';

      let hat = VALID_HATS.has(data.hat) ? data.hat : 'none';
      if (hat === 'chada' && !isVip) hat = 'none';

      let back = VALID_BACKS.has(data.back) ? data.back : 'none';
      if (back === 'angel_wings' && !isVip) back = 'none';

      const entry = {
        id,
        name: sanitizeText(data.name, 20) || 'นักท่องเที่ยว',
        outfit,
        color: sanitizeHex(data.color, '#d97724'),
        hair: VALID_HAIRS.has(data.hair) ? data.hair : 'short',
        hairColor: sanitizeHex(data.hairColor, '#1b1817'),
        skin: VALID_SKINS.has(data.skin) ? data.skin : 'warm',
        hat,
        glasses: VALID_GLASSES.has(data.glasses) ? data.glasses : 'none',
        back,
        aura: VALID_AURAS.has(data.aura) ? data.aura : 'none',
        prop: VALID_PROPS.has(data.prop) ? data.prop : 'none',
        isVip,
        x: clampNum(data.x, -70, 90, 6),
        y: clampNum(data.y, -2, 15, 0),
        z: clampNum(data.z, -40, 100, 6.2),
        yaw: clampNum(data.yaw, -100, 100, 0),
        moving: Boolean(data.moving),
        emote: prev && prev.emoteUntil > now ? prev.emote : '',
        emoteSeq: prev ? prev.emoteSeq : 0,
        emoteUntil: prev ? prev.emoteUntil : 0,
        chat: prev && prev.chatUntil > now ? prev.chat : '',
        chatSeq: prev ? prev.chatSeq : 0,
        chatUntil: prev ? prev.chatUntil : 0,
        lastSeen: now
      };

      activePlayers.set(id, entry);
      if (isNew) {
        statsCache.totalVisits++;
        saveStats(false);
      }
      schedulePlayersBroadcast(isNew);
      return sendJson(res, 200, { ok: true, count: activePlayers.size });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // Player Emotes, Quick Greetings & Shared Fireworks
  if (urlPath === '/api/emote' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req, 2048);
      const id = sanitizeId(data.id);
      const type = String(data.type || '').trim();
      if (!id || !VALID_EMOTES.has(type)) {
        return sendJson(res, 400, { ok: false, error: 'Invalid player id or emote type' });
      }
      if (type === 'firework') {
        if (!checkRateLimit(req, 'firework', 10, 30000)) {
          return sendJson(res, 429, { ok: false, error: 'จุดพลุถี่เกินไป กรุณารอสักครู่' });
        }
      } else if (!checkRateLimit(req, 'emote', 20, 30000)) {
        return sendJson(res, 429, { ok: false, error: 'ทำรายการถี่เกินไป กรุณารอสักครู่' });
      }

      const now = Date.now();
      const player = activePlayers.get(id);
      if (type === 'wai' || type === 'wave' || type === 'ramwong' || type === 'jump') {
        if (player) {
          const dur = type === 'ramwong' ? 4200 : (type === 'jump' ? 2200 : 2600);
          player.emote = type;
          player.emoteSeq = (player.emoteSeq || 0) + 1;
          player.emoteUntil = now + dur;
          player.lastSeen = now;
          schedulePlayersBroadcast(true);
        }
      } else if (type === 'chat') {
        const text = sanitizeText(data.text, 56);
        if (player && text) {
          player.chat = text;
          player.chatSeq = (player.chatSeq || 0) + 1;
          player.chatUntil = now + 5200;
          player.lastSeen = now;
          schedulePlayersBroadcast(true);
        }
      } else if (type === 'firework') {
        statsCache.totalFireworks++;
        saveStats(false);
        broadcastSSE('firework', {
          id,
          x: clampNum(data.x, -50, 70, 8),
          z: clampNum(data.z, 5, 70, 36),
          isVip: Boolean(data.isVip),
          ts: now
        });
      }

      return sendJson(res, 200, { ok: true, count: activePlayers.size });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // Sponsor Billboard / Contact / Coupon Analytics Tracking
  if (urlPath === '/api/track' && req.method === 'POST') {
    if (!checkRateLimit(req, 'track', 40, 60000)) {
      return sendJson(res, 429, { ok: false, error: 'ทำรายการถี่เกินไป กรุณารอสักครู่' });
    }
    try {
      const data = await readJsonBody(req, 1024);
      const ev = String(data.event || '').trim();
      const slotId = sanitizeId(data.slotId) || 'general';
      if (ev === 'sponsor_click') {
        statsCache.sponsorClicks[slotId] = (statsCache.sponsorClicks[slotId] || 0) + 1;
      } else if (ev === 'contact_open') {
        statsCache.contactOpens++;
      } else if (ev === 'coupon_open') {
        statsCache.couponOpens++;
      } else {
        return sendJson(res, 400, { ok: false, error: 'Unknown track event' });
      }
      saveStats(false);
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // Clean Disconnect via sendBeacon or fetch
  if (urlPath === '/api/leave' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req, 1024);
      const id = sanitizeId(data.id);
      if (id && activePlayers.delete(id)) {
        schedulePlayersBroadcast(true);
      }
      return sendJson(res, 200, { ok: true, count: activePlayers.size });
    } catch (err) {
      return sendJson(res, 200, { ok: true });
    }
  }

  // Real-time Shared Pond Krathongs API
  if (urlPath === '/api/krathongs' && req.method === 'GET') {
    const list = readKrathongs();
    return sendJson(res, 200, {
      ok: true,
      total: Math.max(statsCache.totalKrathongsAllTime, list.length),
      pondCount: list.length,
      stats: {
        totalVisits: statsCache.totalVisits,
        totalKrathongsAllTime: Math.max(statsCache.totalKrathongsAllTime, list.length)
      },
      krathongs: list.slice(-45)
    });
  }

  if (urlPath === '/api/krathongs/bless' && req.method === 'POST') {
    if (!checkRateLimit(req, 'bless', 25, 60000)) {
      return sendJson(res, 429, { ok: false, error: 'ทำรายการถี่เกินไป กรุณารอสักครู่' });
    }
    try {
      const data = await readJsonBody(req, 2048);
      const targetId = String(data.id || '').trim();
      if (!targetId) {
        return sendJson(res, 400, { ok: false, error: 'Missing krathong id' });
      }
      const list = readKrathongs();
      const found = list.find(k => k.id === targetId);
      if (!found) {
        return sendJson(res, 404, { ok: false, error: 'Krathong not found' });
      }
      found.blessings = (Number(found.blessings) || 0) + 1;
      writeKrathongs(list);
      statsCache.totalBlessings++;
      saveStats(false);
      broadcastSSE('bless', { id: targetId, blessings: found.blessings });
      return sendJson(res, 200, { ok: true, id: targetId, blessings: found.blessings });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  if (urlPath === '/api/krathongs' && req.method === 'POST') {
    if (!checkRateLimit(req, 'krathong', 6, 60000)) {
      return sendJson(res, 429, { ok: false, error: 'ลอยกระทงถี่เกินไป กรุณารอสักครู่' });
    }
    try {
      const data = await readJsonBody(req, 4096);
      const name = sanitizeText(data.name, 24) || 'ชาวหนองไผ่';
      const wish = sanitizeText(data.wish, 70) || 'ขอให้มีความสุข สุขภาพแข็งแรง ตลอดปี';
      const isVip = Boolean(data.isVip);
      const validBases = ['banana', 'coconut', 'bread', 'gold'];
      const validFlowers = ['lotus', 'marigold', 'orchid'];
      let baseId = validBases.includes(data.baseId) ? data.baseId : 'banana';
      if (isVip) baseId = 'gold';
      const flowerId = validFlowers.includes(data.flowerId) ? data.flowerId : 'lotus';
      const typeId = ['lotus', 'marigold', 'toto'].includes(data.typeId) ? data.typeId : flowerId;

      let px = Number((Math.random() * 76 - 30).toFixed(2));
      let pz = Number((13 + Math.random() * 43).toFixed(2));
      if (Math.hypot(px - 8, pz - 36) < 4.8) {
        px = px >= 8 ? px + 5.5 : px - 5.5;
      }

      const clientId = sanitizeId(data.id);
      const newItem = {
        id: clientId || ('k_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
        name,
        wish,
        baseId,
        flowerId,
        typeId: isVip ? 'toto' : typeId,
        isVip,
        blessings: 0,
        x: px,
        z: pz,
        createdAt: new Date().toISOString()
      };

      const list = readKrathongs();
      list.push(newItem);
      writeKrathongs(list);
      statsCache.totalKrathongsAllTime = Math.max(statsCache.totalKrathongsAllTime + 1, list.length);
      saveStats(true);

      const allTimeTotal = statsCache.totalKrathongsAllTime;
      broadcastSSE('krathong', {
        krathong: newItem,
        total: allTimeTotal,
        stats: { totalVisits: statsCache.totalVisits, totalKrathongsAllTime: allTimeTotal }
      });

      return sendJson(res, 201, { ok: true, total: allTimeTotal, krathong: newItem });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // Secret Admin Console Endpoints
  if (urlPath === '/api/admin/overview' && req.method === 'GET') {
    if (!isAuthorizedAdmin(req)) {
      return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    }
    const list = readKrathongs();
    return sendJson(res, 200, {
      ok: true,
      stats: statsCache,
      onlineCount: activePlayers.size,
      players: getPlayersSnapshot(),
      krathongs: list
    });
  }

  if (urlPath === '/api/admin/krathongs/delete' && req.method === 'POST') {
    if (!isAuthorizedAdmin(req)) {
      return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    }
    try {
      const data = await readJsonBody(req, 1024);
      const targetId = String(data.id || '').trim();
      if (!targetId) return sendJson(res, 400, { ok: false, error: 'Missing id' });
      const list = readKrathongs();
      const filtered = list.filter(k => k.id !== targetId);
      if (filtered.length === list.length) {
        return sendJson(res, 404, { ok: false, error: 'Krathong not found' });
      }
      writeKrathongs(filtered);
      broadcastSSE('krathong_delete', { id: targetId });
      return sendJson(res, 200, { ok: true, id: targetId });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  if (urlPath === '/api/admin/kick' && req.method === 'POST') {
    if (!isAuthorizedAdmin(req)) {
      return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    }
    try {
      const data = await readJsonBody(req, 1024);
      const targetId = sanitizeId(data.id);
      if (targetId && activePlayers.delete(targetId)) {
        schedulePlayersBroadcast(true);
      }
      return sendJson(res, 200, { ok: true, id: targetId });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // Static File Serving
  let rel = '';
  try {
    rel = decodeURIComponent(urlPath === '/' ? '/index.html' : urlPath).replace(/^\/+/, '');
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad Request');
  }
  const rootResolved = path.resolve(ROOT);
  const filePath = path.resolve(rootResolved, rel);
  if (filePath !== rootResolved && !filePath.startsWith(rootResolved + path.sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    let out = content;
    if (rel === 'index.html') {
      const origin = getRequestOrigin(req);
      out = Buffer.from(content.toString('utf8').replace(/__SITE_ORIGIN__/g, origin), 'utf8');
    }

    const relNorm = rel.replace(/\\/g, '/');
    const isAsset = relNorm.startsWith('assets/');
    let cacheControl = 'no-store';
    if (ext === '.html') {
      cacheControl = 'no-cache';
    } else if (isAsset && (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.svg')) {
      cacheControl = 'public, max-age=86400';
    } else if (ext === '.js' || ext === '.css') {
      cacheControl = IS_PROD ? 'public, max-age=300' : 'no-store';
    }

    const headers = {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': cacheControl
    };

    const compressible = ext === '.html' || ext === '.css' || ext === '.js' || ext === '.json' || ext === '.svg';
    const acceptEnc = String(req.headers['accept-encoding'] || '').toLowerCase();
    if (compressible && acceptEnc.includes('gzip')) {
      zlib.gzip(out, (zErr, gz) => {
        if (zErr) {
          res.writeHead(200, headers);
          return res.end(out);
        }
        headers['Content-Encoding'] = 'gzip';
        headers['Vary'] = 'Accept-Encoding';
        res.writeHead(200, headers);
        res.end(gz);
      });
      return;
    }

    res.writeHead(200, headers);
    res.end(out);
  });
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

let isShuttingDown = false;
function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}, shutting down gracefully...`);
  saveStats(true);
  for (const client of sseClients) {
    try { client.end(); } catch (_) { /* ignore */ }
  }
  sseClients.clear();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 4000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, HOST, () => {
  const nets = os.networkInterfaces();
  const lanIps = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) lanIps.push(net.address);
    }
  }
  console.log(`HoiTod Toto Sa Luang 3D Server running at http://localhost:${PORT}`);
  if (lanIps.length) {
    console.log(`LAN Share URLs: ${lanIps.map(ip => `http://${ip}:${PORT}`).join(', ')}`);
  }
});
