// Servidor gratis de Rocky (Cloudflare Workers, plan gratuito, sin tarjeta).
// 1) /ai/...    → pasa las peticiones a Gemini con la clave del servidor: tus amigos usan la IA sin sacar clave.
// 2) /sync/:code → guarda y devuelve los datos de un alumno con un código privado (iPhone + iPad con lo mismo).
// 3) /cal/:code.ics → calendario que el móvil puede suscribir: los hábitos y sesiones salen en el widget.
//
// Secretos y almacenamiento (se configuran en Cloudflare, nunca en el código):
//   GEMINI_KEY  · clave de Google AI Studio SIN facturación (así nunca se puede cobrar nada)
//   ROCKY       · espacio KV para sync, calendarios y contadores
//   ALLOWED     · orígenes permitidos separados por comas (p. ej. https://usuario.github.io)
//   DAILY_LIMIT · peticiones de IA por dispositivo y día (por defecto 60)

const GOOGLE = 'https://generativelanguage.googleapis.com/v1beta';
const MAX_SYNC = 4 * 1024 * 1024; // 4 MB por alumno
const CODE_RE = /^[A-Za-z0-9_-]{22,64}$/;

function cors(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = !allowed.length || allowed.includes(origin);
  return { ok, headers: { 'Access-Control-Allow-Origin': ok && origin ? origin : 'null', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,X-Rocky-Device', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } };
}
const json = (obj, status, headers) => new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
const today = () => new Date().toISOString().slice(0, 10);

/* límite diario por dispositivo, para que nadie gaste el cupo gratis de todos */
async function underLimit(env, device) {
  const limit = +env.DAILY_LIMIT || 60;
  const key = `n:${today()}:${device}`;
  const n = +(await env.ROCKY.get(key)) || 0;
  if (n >= limit) return false;
  await env.ROCKY.put(key, String(n + 1), { expirationTtl: 60 * 60 * 30 });
  return true;
}

async function handleAI(req, env, path, h) {
  if (!env.GEMINI_KEY) return json({ error: { message: 'El servidor no tiene clave de IA configurada.' } }, 503, h);
  const device = (req.headers.get('X-Rocky-Device') || '').slice(0, 64);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(device)) return json({ error: { message: 'Falta el identificador del dispositivo.' } }, 400, h);
  // solo se permiten las rutas que usa la app: lista de modelos y generar contenido
  const m = path.match(/^\/ai\/(models(?:\?.*)?|models\/[A-Za-z0-9._-]+:(?:streamGenerateContent|generateContent)(?:\?alt=sse)?)$/);
  if (!m) return json({ error: { message: 'Ruta no permitida.' } }, 404, h);
  const isList = m[1].startsWith('models?') || m[1] === 'models';
  if (!isList && req.method !== 'POST') return json({ error: { message: 'Método no permitido.' } }, 405, h);
  if (!isList && !(await underLimit(env, device))) return json({ error: { code: 429, message: 'Has llegado al límite diario de IA gratis. Mañana se renueva.' } }, 429, h);
  const url = `${GOOGLE}/${m[1]}`;
  const up = await fetch(url, { method: req.method, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY }, body: isList ? undefined : req.body });
  const out = new Headers(h); out.set('Content-Type', up.headers.get('Content-Type') || 'application/json');
  return new Response(up.body, { status: up.status, headers: out });
}

async function handleSync(req, env, code, h) {
  if (!CODE_RE.test(code)) return json({ error: 'Código no válido' }, 400, h);
  if (req.method === 'GET') { const v = await env.ROCKY.get('s:' + code); return v ? new Response(v, { headers: { ...h, 'Content-Type': 'application/json' } }) : json({ empty: true }, 404, h); }
  if (req.method === 'PUT') {
    const body = await req.text(); if (body.length > MAX_SYNC) return json({ error: 'Demasiado grande' }, 413, h);
    try { const j = JSON.parse(body); if (!j || typeof j !== 'object' || !j.state) throw 0; } catch (e) { return json({ error: 'Formato no válido' }, 400, h); }
    await env.ROCKY.put('s:' + code, body); return json({ ok: true, at: Date.now() }, 200, h);
  }
  return json({ error: 'Método no permitido' }, 405, h);
}

async function handleCal(req, env, code, h) {
  if (!CODE_RE.test(code)) return new Response('Código no válido', { status: 400, headers: h });
  if (req.method === 'PUT') {
    const body = await req.text();
    if (body.length > 512 * 1024 || !body.startsWith('BEGIN:VCALENDAR')) return new Response('Calendario no válido', { status: 400, headers: h });
    await env.ROCKY.put('c:' + code, body); return json({ ok: true }, 200, h);
  }
  const v = await env.ROCKY.get('c:' + code);
  if (!v) return new Response('No hay calendario', { status: 404, headers: h });
  return new Response(v, { headers: { ...h, 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'max-age=900' } });
}

export default {
  async fetch(req, env) {
    const { ok, headers } = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: ok ? 204 : 403, headers });
    const u = new URL(req.url); const path = u.pathname + u.search;
    try {
      if (u.pathname === '/' || u.pathname === '/health') return json({ rocky: true, ai: !!env.GEMINI_KEY }, 200, headers);
      // el calendario lo pide la app de Calendario del móvil (sin Origin): se permite leerlo siempre
      const cal = u.pathname.match(/^\/cal\/([^/]+?)(?:\.ics)?$/);
      if (cal && req.method === 'GET') return handleCal(req, env, cal[1], headers);
      if (!ok) return json({ error: 'Origen no permitido' }, 403, headers);
      if (u.pathname.startsWith('/ai/')) return handleAI(req, env, path, headers);
      const sync = u.pathname.match(/^\/sync\/([^/]+)$/); if (sync) return handleSync(req, env, sync[1], headers);
      if (cal) return handleCal(req, env, cal[1], headers);
      return json({ error: 'No encontrado' }, 404, headers);
    } catch (e) {
      return json({ error: { message: 'Error del servidor' } }, 500, headers);
    }
  },
};
