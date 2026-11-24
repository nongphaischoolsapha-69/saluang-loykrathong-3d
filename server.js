'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const crypto = require('crypto');

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://promptpay.io; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
};

const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';
const ROOT = __dirname;
const IS_PROD = process.env.NODE_ENV === 'production';
const MAX_SSE_CLIENTS = Number(process.env.MAX_SSE_CLIENTS) || 500;
const MAX_SSE_PER_IP = Number(process.env.MAX_SSE_PER_IP) || 12;
const MAX_PLAYERS_PER_IP = Number(process.env.MAX_PLAYERS_PER_IP) || 12;
const MAX_ACTIVE_PLAYERS = Number(process.env.MAX_ACTIVE_PLAYERS) || 250;
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : ROOT;
const DATA_FILE = path.join(DATA_DIR, 'krathongs.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const VISITORS_FILE = path.join(DATA_DIR, 'visitors.json');
const SHEETS_WEBHOOK_URL = String(process.env.SHEETS_WEBHOOK_URL || '').trim();
const SHEETS_SECRET = String(process.env.SHEETS_SECRET || '').trim();
const ENV_ADMIN_KEY = String(process.env.ADMIN_KEY || '').trim();
const ADMIN_KEY = IS_PROD ? ENV_ADMIN_KEY : (ENV_ADMIN_KEY || 'saluang2569');

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

// Basic Thai/English profanity & spam link/gambling filter for public wishes, names & chat
const BAD_WORDS = [
  'ควย', 'เหี้ย', 'สัตว์', 'สัส', 'เย็ด', 'หี', 'แตด', 'มึง', 'กู', 'ไอ้สัส', 'อีดอก', 'ตอแหล',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy',
  'สล็อต', 'บาคาร่า', 'เว็บพนัน', 'เครดิตฟรี', 'แทงบอล', 'คาสิโน', 'ufabet', 'pgslot', 'sagaming', 'line.me'
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
const VALID_FLOWERS = new Set(['lotus', 'marigold', 'orchid', 'globe']);
const VALID_CANDLES = new Set(['gold', 'pink', 'red', 'white']);
const VALID_TOPPINGS = new Set(['coin', 'swan', 'garland', 'lotus_bud', 'sparkler']);
const KRATHONG_QUOTA_MAX = 3;
const KRATHONG_QUOTA_WINDOW_MS = 60 * 60 * 1000;
const deviceKrathongBuckets = new Map();

function getDeviceQuotaStatus(quotaKey) {
  const now = Date.now();
  const cutoff = now - KRATHONG_QUOTA_WINDOW_MS;
  const arr = (deviceKrathongBuckets.get(quotaKey) || []).filter(ts => ts > cutoff);
  if (arr.length > 0) deviceKrathongBuckets.set(quotaKey, arr);
  else deviceKrathongBuckets.delete(quotaKey);
  const used = arr.length;
  const remaining = Math.max(0, KRATHONG_QUOTA_MAX - used);
  const retryAfterSec = remaining === 0 && arr.length > 0
    ? Math.max(1, Math.ceil((arr[0] + KRATHONG_QUOTA_WINDOW_MS - now) / 1000))
    : 0;
  return { used, limit: KRATHONG_QUOTA_MAX, remaining, retryAfterSec };
}

function recordDeviceKrathong(quotaKey) {
  const now = Date.now();
  const cutoff = now - KRATHONG_QUOTA_WINDOW_MS;
  const arr = (deviceKrathongBuckets.get(quotaKey) || []).filter(ts => ts > cutoff);
  arr.push(now);
  deviceKrathongBuckets.set(quotaKey, arr);
}

function sanitizeText(raw, maxLen) {
  let text = String(raw || '')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00AD]/g, '')
    .replace(/[\r\n<>]/g, ' ')
    .trim();
  if (text.length > maxLen) text = text.slice(0, maxLen).trim();
  text = text
    .replace(/https?:\/\/\S+/gi, '***')
    .replace(/www\.\S+/gi, '***')
    .replace(/\b[a-z0-9-]+\.(com|net|org|bet|vip|cc|xyz|th|me|io|gg|ly|shop|club)\b\S*/gi, '***')
    .replace(/@[a-z0-9_.-]{3,}/gi, '***');
  for (const w of BAD_WORDS) {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'gi');
    text = text.replace(re, '***');
  }
  return text;
}

const bannedIps = new Map();
const blessedByIp = new Map();

function pruneSecurityMaps() {
  const now = Date.now();
  for (const [ip, info] of bannedIps.entries()) {
    if (!info || now >= info.expiresAt) bannedIps.delete(ip);
  }
  const blessCutoff = now - 24 * 60 * 60 * 1000;
  for (const [key, ts] of blessedByIp.entries()) {
    if (ts < blessCutoff) blessedByIp.delete(key);
  }
  const quotaCutoff = now - KRATHONG_QUOTA_WINDOW_MS;
  for (const [key, arr] of deviceKrathongBuckets.entries()) {
    const fresh = (arr || []).filter(ts => ts > quotaCutoff);
    if (fresh.length > 0) deviceKrathongBuckets.set(key, fresh);
    else deviceKrathongBuckets.delete(key);
  }
}

function getBannedIpInfo(req) {
  pruneSecurityMaps();
  return bannedIps.get(getClientIp(req)) || null;
}

function isSameOriginAllowed(req) {
  const origin = String(req.headers.origin || '').trim();
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const expectedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
    return Boolean(expectedHost) && originHost === expectedHost;
  } catch (_) {
    return false;
  }
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
    peakOnline: 0,
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

function parseDeviceType(userAgent) {
  const ua = String(userAgent || '');
  if (/ipad|tablet|playbook|silk/i.test(ua)) return 'Tablet';
  if (/iphone|ipod/i.test(ua)) return 'Mobile (iOS)';
  if (/android/i.test(ua)) return /mobile/i.test(ua) ? 'Mobile (Android)' : 'Tablet';
  if (/mobile|mobi/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function csvCell(val) {
  let str = String(val === undefined || val === null ? '' : val);
  if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
  if (/[",\r\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const MAX_VISITORS_STORED = 2000;
const visitorsMap = (() => {
  const map = new Map();
  try {
    if (fs.existsSync(VISITORS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf8'));
      if (Array.isArray(parsed)) {
        parsed.slice(-MAX_VISITORS_STORED).forEach(v => {
          if (v && v.visitorKey) map.set(v.visitorKey, v);
        });
      }
    }
  } catch (_) {}
  return map;
})();

let visitorsFlushTimer = null;
function saveVisitors(immediate = false) {
  const flush = () => {
    visitorsFlushTimer = null;
    try {
      const arr = [...visitorsMap.values()].slice(-MAX_VISITORS_STORED);
      writeFileSafe(VISITORS_FILE, JSON.stringify(arr, null, 2));
    } catch (_) {}
  };
  if (immediate) {
    if (visitorsFlushTimer) {
      clearTimeout(visitorsFlushTimer);
      visitorsFlushTimer = null;
    }
    flush();
  } else if (!visitorsFlushTimer) {
    visitorsFlushTimer = setTimeout(flush, 1800);
  }
}

function setVisitorBounded(key, rec) {
  if (visitorsMap.has(key)) {
    visitorsMap.delete(key);
  }
  visitorsMap.set(key, rec);
  while (visitorsMap.size > MAX_VISITORS_STORED) {
    const oldestKey = visitorsMap.keys().next().value;
    if (!oldestKey) break;
    visitorsMap.delete(oldestKey);
  }
}

async function sendToGoogleSheets(eventObj) {
  if (!SHEETS_WEBHOOK_URL || !/^https?:\/\//i.test(SHEETS_WEBHOOK_URL)) {
    return { ok: false, error: 'ยังไม่ได้ตั้งค่า SHEETS_WEBHOOK_URL' };
  }
  if (typeof fetch !== 'function') {
    return { ok: false, error: 'Node runtime does not support fetch' };
  }
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 6500);
  try {
    const payload = Object.assign({}, eventObj, {
      secret: SHEETS_SECRET,
      ts: eventObj.ts || new Date().toISOString()
    });
    const r = await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: ac.signal
    });
    return { ok: r.ok, status: r.status };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : 'Request failed' };
  } finally {
    clearTimeout(timer);
  }
}

const pendingNameWebhookTimers = new Map();
function scheduleNameUpdateWebhook(visitorKey, rec) {
  if (!SHEETS_WEBHOOK_URL) return;
  const old = pendingNameWebhookTimers.get(visitorKey);
  if (old) clearTimeout(old);
  const tid = setTimeout(() => {
    pendingNameWebhookTimers.delete(visitorKey);
    sendToGoogleSheets({
      event: 'name_update',
      visitorKey,
      name: rec.name,
      firstName: rec.firstName,
      deviceType: rec.deviceType,
      outfit: rec.outfit,
      visits: rec.visits,
      krathongsCount: rec.krathongsCount,
      ip: rec.ip
    }).catch(() => {});
  }, 4000);
  if (tid.unref) tid.unref();
  pendingNameWebhookTimers.set(visitorKey, tid);
}

function upsertVisitorOnPresence(req, data, entry, isNewSession) {
  const devId = sanitizeId(data && data.deviceId);
  const visitorKey = devId ? `dev:${devId}` : `ip:${entry.ip}`;
  const devType = parseDeviceType(req.headers['user-agent']);
  const nowIso = new Date().toISOString();
  const existing = visitorsMap.get(visitorKey);

  if (!existing) {
    const rec = {
      visitorKey,
      name: entry.name,
      firstName: entry.name,
      deviceType: devType,
      outfit: entry.outfit,
      visits: 1,
      krathongsCount: 0,
      ip: entry.ip,
      firstSeenAt: nowIso,
      lastSeenAt: nowIso
    };
    setVisitorBounded(visitorKey, rec);
    saveVisitors(false);
    sendToGoogleSheets({
      event: 'visit',
      visitorKey,
      name: rec.name,
      deviceType: rec.deviceType,
      outfit: rec.outfit,
      visits: rec.visits,
      krathongsCount: rec.krathongsCount,
      ip: rec.ip
    }).catch(() => {});
    return rec;
  }

  const prevName = existing.name;
  const nameChanged = Boolean(entry.name && entry.name !== prevName);
  existing.name = entry.name || existing.name;
  existing.deviceType = devType;
  existing.outfit = entry.outfit;
  existing.ip = entry.ip;
  existing.lastSeenAt = nowIso;
  if (isNewSession) {
    existing.visits = (Number(existing.visits) || 0) + 1;
  }
  setVisitorBounded(visitorKey, existing);
  saveVisitors(false);

  if (isNewSession) {
    sendToGoogleSheets({
      event: 'visit',
      visitorKey,
      name: existing.name,
      deviceType: existing.deviceType,
      outfit: existing.outfit,
      visits: existing.visits,
      krathongsCount: existing.krathongsCount || 0,
      ip: existing.ip
    }).catch(() => {});
  } else if (nameChanged && existing.name !== 'นักท่องเที่ยว') {
    scheduleNameUpdateWebhook(visitorKey, existing);
  }
  return existing;
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
  const cfIp = IS_PROD ? String(req.headers['cf-connecting-ip'] || '').split(',')[0].trim() : '';
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const raw = cfIp || fwd || (req.socket && req.socket.remoteAddress) || 'local';
  return String(raw).slice(0, 64);
}

function getSecurityHeaders(req) {
  try {
    if (req && getRequestOrigin(req).startsWith('https://')) {
      return Object.assign({ 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' }, SECURITY_HEADERS);
    }
  } catch (_) {}
  return SECURITY_HEADERS;
}

function checkRateLimit(req, bucket, maxReq, windowMs) {
  const ip = getClientIp(req);
  const key = `${ip}|${bucket}`;
  const now = Date.now();
  const cutoff = now - windowMs;
  let entry = rateBuckets.get(key);
  if (!entry) {
    entry = { ts: [], maxWindow: windowMs };
    rateBuckets.set(key, entry);
  } else if (windowMs > entry.maxWindow) {
    entry.maxWindow = windowMs;
  }
  while (entry.ts.length && entry.ts[0] < cutoff) entry.ts.shift();
  if (entry.ts.length >= maxReq) return false;
  entry.ts.push(now);
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, entry] of rateBuckets.entries()) {
    const win = (entry && entry.maxWindow) ? entry.maxWindow : 120000;
    const cutoff = now - win;
    while (entry.ts.length && entry.ts[0] < cutoff) entry.ts.shift();
    if (entry.ts.length === 0) rateBuckets.delete(k);
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
    ...(res._secHeaders || SECURITY_HEADERS)
  });
  res.end(JSON.stringify(obj));
}

function isAuthorizedAdmin(req) {
  const hdr = String(req.headers['x-admin-key'] || '').trim();
  if (!ADMIN_KEY || !hdr) return false;
  const a = crypto.createHash('sha256').update(hdr).digest();
  const b = crypto.createHash('sha256').update(ADMIN_KEY).digest();
  return crypto.timingSafeEqual(a, b);
}

function guardAdminAuth(req, res) {
  if (!ADMIN_KEY) {
    sendJson(res, 503, { ok: false, error: 'Admin console disabled: ADMIN_KEY env var is not configured' });
    return false;
  }
  if (!checkRateLimit(req, 'admin_req', 60, 60000)) {
    sendJson(res, 429, { ok: false, error: 'ทำรายการถี่เกินไป กรุณารอสักครู่' });
    return false;
  }
  const failBucket = rateBuckets.get(`${getClientIp(req)}|admin_auth_fail`);
  const cutoff = Date.now() - 15 * 60 * 1000;
  const failList = failBucket && Array.isArray(failBucket.ts) ? failBucket.ts : [];
  const recentFails = failList.filter(t => t >= cutoff).length;
  if (recentFails >= 10) {
    sendJson(res, 429, { ok: false, error: 'ลองผิดเกินจำนวนที่กำหนด กรุณารอ 15 นาที' });
    return false;
  }
  if (!isAuthorizedAdmin(req)) {
    checkRateLimit(req, 'admin_auth_fail', 20, 15 * 60 * 1000);
    sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

// --- Real-Time Online Multiplayer Store & SSE Broadcaster ---
const activePlayers = new Map();
const sseClients = new Set();
const sseCountByIp = new Map();
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

function getPlayersSnapshot(includeIp = false) {
  pruneInactivePlayers();
  const now = Date.now();
  const list = [];
  for (const p of activePlayers.values()) {
    const snap = {
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
    };
    if (includeIp) snap.ip = p.ip || '';
    list.push(snap);
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
        if (typeof client._sseCleanup === 'function') client._sseCleanup();
        else sseClients.delete(client);
      }
    }
  }
}, 5000).unref();

const server = http.createServer(async (req, res) => {
  res._secHeaders = getSecurityHeaders(req);
  const urlPath = (req.url || '/').split('?')[0];

  if (req.headers.origin && !isSameOriginAllowed(req)) {
    return sendJson(res, 403, { ok: false, error: 'Cross-origin request blocked' });
  }

  if (req.method === 'OPTIONS') {
    const isAdminOpt = urlPath.startsWith('/api/admin');
    const optHeaders = {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
      ...(res._secHeaders || SECURITY_HEADERS)
    };
    if (!isAdminOpt && req.headers.origin && isSameOriginAllowed(req)) {
      optHeaders['Access-Control-Allow-Origin'] = req.headers.origin;
      optHeaders['Vary'] = 'Origin';
    }
    res.writeHead(204, optHeaders);
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
    if (getBannedIpInfo(req)) {
      return sendJson(res, 403, { ok: false, error: 'IP นี้ถูกระงับการใช้งานชั่วคราว' });
    }
    if (sseClients.size >= MAX_SSE_CLIENTS) {
      return sendJson(res, 503, { ok: false, error: 'ขณะนี้มีผู้เข้าชมเต็มความจุชั่วคราว กรุณาลองใหม่ในอีกสักครู่' });
    }
    const clientIp = getClientIp(req);
    const ipSseCount = sseCountByIp.get(clientIp) || 0;
    if (ipSseCount >= MAX_SSE_PER_IP) {
      return sendJson(res, 429, { ok: false, error: 'เปิดการเชื่อมต่อจากเครือข่ายนี้มากเกินไป กรุณารอสักครู่' });
    }
    sseCountByIp.set(clientIp, ipSseCount + 1);
    if (req.socket && req.socket.setNoDelay) req.socket.setNoDelay(true);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      ...(res._secHeaders || SECURITY_HEADERS)
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

    let sseCleaned = false;
    const cleanup = () => {
      if (sseCleaned) return;
      sseCleaned = true;
      sseClients.delete(res);
      const cur = (sseCountByIp.get(clientIp) || 1) - 1;
      if (cur > 0) sseCountByIp.set(clientIp, cur);
      else sseCountByIp.delete(clientIp);
    };
    res._sseCleanup = cleanup;
    req.on('close', cleanup);
    res.on('close', cleanup);
    return;
  }

  // Player Presence & 3D Avatar V2 State Upsert
  if (urlPath === '/api/presence' && req.method === 'POST') {
    if (getBannedIpInfo(req)) {
      return sendJson(res, 403, { ok: false, error: 'IP นี้ถูกระงับการใช้งานชั่วคราว' });
    }
    if (!checkRateLimit(req, 'presence', 240, 10000)) {
      return sendJson(res, 429, { ok: false, error: 'ทำรายการถี่เกินไป กรุณารอสักครู่' });
    }
    try {
      const data = await readJsonBody(req, 4096);
      const id = sanitizeId(data.id);
      if (!id) return sendJson(res, 400, { ok: false, error: 'Missing player id' });

      const now = Date.now();
      const clientIp = getClientIp(req);
      const prev = activePlayers.get(id);
      const isNew = !prev;
      if (isNew) {
        pruneInactivePlayers();
        if (activePlayers.size >= MAX_ACTIVE_PLAYERS) {
          return sendJson(res, 503, { ok: false, error: 'ขณะนี้มีผู้เดินเล่นในสระหลวงเต็มความจุ กรุณาลองใหม่สักครู่' });
        }
        let sameIpCount = 0;
        for (const p of activePlayers.values()) {
          if (p.ip === clientIp) sameIpCount++;
        }
        if (sameIpCount >= MAX_PLAYERS_PER_IP) {
          return sendJson(res, 429, { ok: false, error: 'มีผู้เล่นจากเครือข่ายนี้เปิดพร้อมกันมากเกินไป กรุณาปิดแท็บที่ไม่ได้ใช้งาน' });
        }
      }
      const isVip = Boolean(data.isVip);

      let outfit = VALID_OUTFITS.has(data.outfit) ? data.outfit : 'sabai';
      if (outfit === 'vip_gold' && !isVip) outfit = 'sabai';

      let hat = VALID_HATS.has(data.hat) ? data.hat : 'none';
      if (hat === 'chada' && !isVip) hat = 'none';

      let back = VALID_BACKS.has(data.back) ? data.back : 'none';
      if (back === 'angel_wings' && !isVip) back = 'none';

      const entry = {
        id,
        ip: getClientIp(req),
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
      if (activePlayers.size > (statsCache.peakOnline || 0)) {
        statsCache.peakOnline = activePlayers.size;
        saveStats(false);
      }
      if (isNew) {
        statsCache.totalVisits++;
        saveStats(false);
      }
      upsertVisitorOnPresence(req, data, entry, isNew);
      schedulePlayersBroadcast(isNew);
      return sendJson(res, 200, { ok: true, count: activePlayers.size });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // Player Emotes, Quick Greetings & Shared Fireworks
  if (urlPath === '/api/emote' && req.method === 'POST') {
    if (getBannedIpInfo(req)) {
      return sendJson(res, 403, { ok: false, error: 'IP นี้ถูกระงับการใช้งานชั่วคราว' });
    }
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

  // Sponsor Billboard / Contact / Keepsake Analytics Tracking
  if (urlPath === '/api/track' && req.method === 'POST') {
    if (getBannedIpInfo(req)) {
      return sendJson(res, 403, { ok: false, error: 'IP นี้ถูกระงับการใช้งานชั่วคราว' });
    }
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
      } else if (ev === 'share_card_open' || ev === 'coupon_open') {
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
    if (!checkRateLimit(req, 'leave', 60, 60000)) {
      return sendJson(res, 429, { ok: false, error: 'Too many requests' });
    }
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
    if (getBannedIpInfo(req)) {
      return sendJson(res, 403, { ok: false, error: 'IP นี้ถูกระงับการใช้งานชั่วคราว' });
    }
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
      const blessKey = `${getClientIp(req)}|${targetId}`;
      if (blessedByIp.has(blessKey)) {
        return sendJson(res, 409, { ok: false, alreadyBlessed: true, blessings: found.blessings || 0, error: 'คุณร่วมอวยพรกระทงนี้ไปแล้ว' });
      }
      blessedByIp.set(blessKey, Date.now());
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

  if (urlPath === '/api/krathongs/quota' && req.method === 'GET') {
    if (getBannedIpInfo(req)) {
      return sendJson(res, 403, { ok: false, error: 'IP นี้ถูกระงับการใช้งานชั่วคราว' });
    }
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const deviceId = sanitizeId(parsedUrl.searchParams.get('deviceId'));
      const quotaKey = deviceId ? `dev:${deviceId}` : `ip:${getClientIp(req)}`;
      return sendJson(res, 200, { ok: true, ...getDeviceQuotaStatus(quotaKey) });
    } catch (_) {
      return sendJson(res, 200, { ok: true, used: 0, limit: KRATHONG_QUOTA_MAX, remaining: KRATHONG_QUOTA_MAX, retryAfterSec: 0 });
    }
  }

  if (urlPath === '/api/krathongs' && req.method === 'POST') {
    if (getBannedIpInfo(req)) {
      return sendJson(res, 403, { ok: false, error: 'IP นี้ถูกระงับการใช้งานชั่วคราว' });
    }
    if (!checkRateLimit(req, 'krathong_ip', 15, 600000)) {
      return sendJson(res, 429, { ok: false, error: 'มีการส่งคำขอลอยกระทงจากเครือข่ายนี้มากเกินไป กรุณารอสักครู่' });
    }
    try {
      const data = await readJsonBody(req, 4096);
      const deviceId = sanitizeId(data.deviceId);
      const quotaKey = deviceId ? `dev:${deviceId}` : `ip:${getClientIp(req)}`;
      const qStatus = getDeviceQuotaStatus(quotaKey);
      if (qStatus.remaining <= 0) {
        const waitMin = Math.max(1, Math.ceil(qStatus.retryAfterSec / 60));
        return sendJson(res, 429, {
          ok: false,
          quotaExceeded: true,
          quota: qStatus,
          error: `คุณลอยกระทงครบ ${KRATHONG_QUOTA_MAX} ใบต่อชั่วโมงแล้ว รออีก ${waitMin} นาทีนะ ✨`
        });
      }

      const name = sanitizeText(data.name, 24) || 'ชาวหนองไผ่';
      const wish = sanitizeText(data.wish, 70) || 'ขอให้มีความสุข สุขภาพแข็งแรง ตลอดปี';
      const isVip = Boolean(data.isVip);
      const validBases = ['banana', 'coconut', 'bread', 'gold'];
      let baseId = validBases.includes(data.baseId) ? data.baseId : 'banana';
      if (isVip) baseId = 'gold';
      const flowerId = VALID_FLOWERS.has(data.flowerId) ? data.flowerId : 'lotus';
      const candleId = VALID_CANDLES.has(data.candleId) ? data.candleId : 'gold';
      const toppingId = VALID_TOPPINGS.has(data.toppingId) ? data.toppingId : 'coin';
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
        candleId,
        toppingId,
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
      recordDeviceKrathong(quotaKey);
      const updatedQuota = getDeviceQuotaStatus(quotaKey);
      statsCache.totalKrathongsAllTime = Math.max(statsCache.totalKrathongsAllTime + 1, list.length);
      saveStats(true);

      const vKey = deviceId ? `dev:${deviceId}` : `ip:${getClientIp(req)}`;
      const vExisting = visitorsMap.get(vKey);
      const nowIso = new Date().toISOString();
      if (vExisting) {
        vExisting.krathongsCount = (Number(vExisting.krathongsCount) || 0) + 1;
        vExisting.lastSeenAt = nowIso;
        if (!vExisting.name || vExisting.name === 'นักท่องเที่ยว') vExisting.name = name;
        setVisitorBounded(vKey, vExisting);
      } else {
        setVisitorBounded(vKey, {
          visitorKey: vKey,
          name,
          firstName: name,
          deviceType: parseDeviceType(req.headers['user-agent']),
          outfit: 'sabai',
          visits: 1,
          krathongsCount: 1,
          ip: getClientIp(req),
          firstSeenAt: nowIso,
          lastSeenAt: nowIso
        });
      }
      saveVisitors(false);
      sendToGoogleSheets({
        event: 'krathong',
        visitorKey: vKey,
        id: newItem.id,
        name: newItem.name,
        wish: newItem.wish,
        baseId: newItem.baseId,
        flowerId: newItem.flowerId,
        candleId: newItem.candleId,
        toppingId: newItem.toppingId,
        isVip: newItem.isVip,
        totalKrathongsAllTime: statsCache.totalKrathongsAllTime
      }).catch(() => {});

      const allTimeTotal = statsCache.totalKrathongsAllTime;
      broadcastSSE('krathong', {
        krathong: newItem,
        total: allTimeTotal,
        stats: { totalVisits: statsCache.totalVisits, totalKrathongsAllTime: allTimeTotal }
      });

      return sendJson(res, 201, { ok: true, total: allTimeTotal, krathong: newItem, quota: updatedQuota });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // Secret Admin Console Endpoints (CORS disabled + Brute-force guarded)
  if (urlPath === '/api/admin/overview' && req.method === 'GET') {
    if (!guardAdminAuth(req, res)) return;
    pruneSecurityMaps();
    const list = readKrathongs();
    return sendJson(res, 200, {
      ok: true,
      stats: statsCache,
      onlineCount: activePlayers.size,
      uniqueVisitors: visitorsMap.size,
      peakOnline: Math.max(statsCache.peakOnline || 0, activePlayers.size),
      sheetsConfigured: Boolean(SHEETS_WEBHOOK_URL && /^https?:\/\//i.test(SHEETS_WEBHOOK_URL)),
      players: getPlayersSnapshot(true),
      visitors: [...visitorsMap.values()],
      bannedIps: [...bannedIps.values()],
      krathongs: list
    });
  }

  if (urlPath === '/api/admin/visitors.csv' && req.method === 'GET') {
    if (!guardAdminAuth(req, res)) return;
    const rows = [
      ['ลำดับ', 'ชื่อผู้เล่น', 'อุปกรณ์', 'ชุดล่าสุด', 'จำนวนครั้งเข้าเล่น', 'จำนวนกระทงที่ลอย', 'เข้าครั้งแรก', 'เข้าล่าสุด', 'IP', 'รหัสเครื่อง']
    ];
    const allVisitors = [...visitorsMap.values()].slice().reverse();
    allVisitors.forEach((v, idx) => {
      rows.push([
        idx + 1,
        v.name || '',
        v.deviceType || '',
        v.outfit || '',
        Number(v.visits) || 1,
        Number(v.krathongsCount) || 0,
        v.firstSeenAt || '',
        v.lastSeenAt || '',
        v.ip || '',
        v.visitorKey || ''
      ]);
    });
    const csvBody = '\uFEFF' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="saluang-visitors.csv"',
      'Cache-Control': 'no-store',
      ...(res._secHeaders || SECURITY_HEADERS)
    });
    return res.end(csvBody);
  }

  if (urlPath === '/api/admin/krathongs.csv' && req.method === 'GET') {
    if (!guardAdminAuth(req, res)) return;
    const rows = [
      ['ลำดับ', 'ชื่อผู้ลอย', 'คำอธิษฐาน', 'ฐาน', 'ดอกไม้', 'สีเทียน', 'ของมงคล', 'กระทงทองคำ', 'ยอดสาธุ', 'เวลาที่ลอย']
    ];
    const allK = readKrathongs().slice().reverse();
    allK.forEach((k, idx) => {
      rows.push([
        idx + 1,
        k.name || '',
        k.wish || '',
        k.baseId || k.typeId || '',
        k.flowerId || '',
        k.candleId || '',
        k.toppingId || '',
        k.isVip ? 'ใช่' : 'ไม่',
        Number(k.blessings) || 0,
        k.createdAt || ''
      ]);
    });
    const csvBody = '\uFEFF' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="saluang-krathongs.csv"',
      'Cache-Control': 'no-store',
      ...(res._secHeaders || SECURITY_HEADERS)
    });
    return res.end(csvBody);
  }

  if (urlPath === '/api/admin/sheets/test' && req.method === 'POST') {
    if (!guardAdminAuth(req, res)) return;
    if (!SHEETS_WEBHOOK_URL || !/^https?:\/\//i.test(SHEETS_WEBHOOK_URL)) {
      return sendJson(res, 400, { ok: false, error: 'ยังไม่ได้ตั้งค่า SHEETS_WEBHOOK_URL ใน Environment' });
    }
    const result = await sendToGoogleSheets({
      event: 'test',
      name: 'Admin Test Ping',
      note: 'ทดสอบเชื่อมต่อ Google Sheets จากสระหลวง 3D สำเร็จ'
    });
    if (result.ok) {
      return sendJson(res, 200, { ok: true, status: result.status });
    }
    return sendJson(res, 502, { ok: false, error: result.error || `HTTP ${result.status || 'Error'}` });
  }

  if (urlPath === '/api/admin/krathongs/delete' && req.method === 'POST') {
    if (!guardAdminAuth(req, res)) return;
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
    if (!guardAdminAuth(req, res)) return;
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

  if (urlPath === '/api/admin/ban' && req.method === 'POST') {
    if (!guardAdminAuth(req, res)) return;
    try {
      const data = await readJsonBody(req, 1024);
      const targetId = sanitizeId(data.id);
      const player = targetId ? activePlayers.get(targetId) : null;
      const targetIp = String(data.ip || (player && player.ip) || '').trim().slice(0, 64);
      if (!targetIp) return sendJson(res, 400, { ok: false, error: 'Missing ip' });
      const mins = Math.max(1, Math.min(1440, Number(data.minutes) || 60));
      const now = Date.now();
      bannedIps.set(targetIp, {
        ip: targetIp,
        name: (player && player.name) || sanitizeText(data.name, 20) || 'Banned IP',
        reason: sanitizeText(data.reason, 40) || 'Admin temporary ban',
        bannedAt: now,
        expiresAt: now + mins * 60 * 1000
      });
      if (targetId && activePlayers.delete(targetId)) {
        schedulePlayersBroadcast(true);
      }
      return sendJson(res, 200, { ok: true, ip: targetIp, minutes: mins });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  if (urlPath === '/api/admin/unban' && req.method === 'POST') {
    if (!guardAdminAuth(req, res)) return;
    try {
      const data = await readJsonBody(req, 1024);
      const targetIp = String(data.ip || '').trim().slice(0, 64);
      if (!targetIp) return sendJson(res, 400, { ok: false, error: 'Missing ip' });
      const removed = bannedIps.delete(targetIp);
      return sendJson(res, 200, { ok: true, ip: targetIp, removed });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // Static File Serving (Strict Allowlist Only)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', ...(res._secHeaders || SECURITY_HEADERS) });
    return res.end('Method Not Allowed');
  }
  let rel = '';
  try {
    rel = decodeURIComponent(urlPath === '/' ? '/index.html' : urlPath).replace(/^\/+/, '');
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', ...(res._secHeaders || SECURITY_HEADERS) });
    return res.end('Bad Request');
  }
  const relNorm = rel.replace(/\\/g, '/');
  const ext = path.extname(relNorm).toLowerCase();
  const hasHiddenOrTraversal = !relNorm || relNorm.split('/').some(seg => !seg || seg === '.' || seg === '..' || seg.startsWith('.'));
  const isAllowedStatic = !hasHiddenOrTraversal && (
    relNorm === 'index.html' ||
    relNorm === 'admin.html' ||
    relNorm === 'manifest.json' ||
    (relNorm.startsWith('css/') && ext === '.css') ||
    (relNorm.startsWith('js/') && ext === '.js') ||
    (relNorm.startsWith('assets/') && (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.svg'))
  );
  if (!isAllowedStatic) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...(res._secHeaders || SECURITY_HEADERS) });
    return res.end('Not Found');
  }

  const rootResolved = path.resolve(ROOT);
  const filePath = path.resolve(rootResolved, relNorm);
  if (filePath !== rootResolved && !filePath.startsWith(rootResolved + path.sep)) {
    res.writeHead(403, res._secHeaders || SECURITY_HEADERS);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...(res._secHeaders || SECURITY_HEADERS) });
      return res.end('Not Found');
    }

    let out = content;
    if (relNorm === 'index.html') {
      const origin = getRequestOrigin(req);
      out = Buffer.from(content.toString('utf8').replace(/__SITE_ORIGIN__/g, origin), 'utf8');
    }

    const isAsset = relNorm.startsWith('assets/');
    let cacheControl = 'no-store';
    if (ext === '.html') {
      cacheControl = 'no-cache';
    } else if (relNorm === 'manifest.json') {
      cacheControl = 'public, max-age=3600';
    } else if (isAsset && (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.svg')) {
      cacheControl = 'public, max-age=86400';
    } else if (ext === '.js' || ext === '.css') {
      cacheControl = IS_PROD ? 'public, max-age=300' : 'no-store';
    }

    const contentType = relNorm === 'manifest.json'
      ? 'application/manifest+json; charset=utf-8'
      : (MIME_TYPES[ext] || 'application/octet-stream');

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      ...(res._secHeaders || SECURITY_HEADERS)
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
  saveVisitors(true);
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
  if (IS_PROD && !ADMIN_KEY) {
    console.warn('SECURITY NOTICE: ADMIN_KEY env var not set in production; /api/admin/* endpoints are disabled.');
  }
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
