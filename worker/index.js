/**
 * Cloudflare Worker in front of the static SPA build (see wrangler.jsonc).
 *
 * Link-preview bots — WhatsApp, LinkedIn, Facebook, X, Telegram, Slack,
 * Discord — don't run JavaScript, so on a single-page app they only ever see
 * build/index.html: the site title and no event image. For event pages this
 * Worker looks the event up in the API and writes its title, description and
 * image into the <head> as Open Graph / Twitter card tags, so a shared event
 * link previews with the event's own banner or poster.
 *
 * Short referral links (/r/:code) are resolved here and answered with a real
 * HTTP redirect to the event page. The SPA used to redirect in JavaScript,
 * which bots never run, so a shared referral link previewed as the bare app.
 *
 * Only /e/:slug, /event/:id, /event?id= and /r/:code run this code
 * (run_worker_first in wrangler.jsonc); everything else is served straight
 * from static assets.
 * Any failure — API down or slow, unknown event — falls back to the plain
 * index.html, i.e. exactly what was served before this Worker existed.
 */

const API_ORIGIN = 'https://lenienttree.in';
const SITE_NAME = 'LenientTree';
const API_TIMEOUT_MS = 2500;
const EVENT_CACHE_SECONDS = 300;
const DESCRIPTION_MAX = 200;

// /e/<slug> and /event/<id> — but not deeper paths like /event/<id>/register.
const EVENT_PATH = /^\/(?:e|event)\/([^/]+)\/?$/;
const REFERRAL_PATH = /^\/r\/([^/]+)\/?$/;
// Referral targets are built by our API from CLIENT_URL; refuse to redirect anywhere else.
const OWN_HOST = /(^|\.)lenienttree\.com$/i;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const referral = (request.method === 'GET' || request.method === 'HEAD') && url.pathname.match(REFERRAL_PATH);
    if (referral) {
      const target = await resolveReferral(referral[1]);
      // Unknown code → let the SPA handle it (it sends people to the homepage).
      return target ? Response.redirect(target, 302) : env.ASSETS.fetch(request);
    }

    const key = eventKey(request, url);
    if (!key) return env.ASSETS.fetch(request);

    const [shell, event] = await Promise.all([
      // The SPA shell (index.html). Fetched without the visitor's conditional
      // headers so we always get a full body to rewrite, never a 304.
      env.ASSETS.fetch(new Request(new URL('/', url), { method: 'GET', headers: { accept: 'text/html' } })),
      loadEvent(key, ctx),
    ]);
    if (!event || !shell.ok) return shell;
    return withEventMeta(shell, event, url, request.method);
  },
};

function eventKey(request, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const m = url.pathname.match(EVENT_PATH);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return null;
    }
  }
  if (url.pathname === '/event' || url.pathname === '/event/') return url.searchParams.get('id');
  return null;
}

/** Full event URL for a referral code (read-only lookup), or null. */
async function resolveReferral(rawCode) {
  let code;
  try {
    code = decodeURIComponent(rawCode);
  } catch {
    return null;
  }
  try {
    const res = await fetch(`${API_ORIGIN}/api/referral/resolve/${encodeURIComponent(code)}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const target = new URL(body?.data?.url);
    return target.protocol === 'https:' && OWN_HOST.test(target.hostname) ? target.href : null;
  } catch {
    return null;
  }
}

/** Public event JSON from the API, edge-cached for a few minutes. Null on any failure. */
async function loadEvent(key, ctx) {
  const apiUrl = `${API_ORIGIN}/api/events/${encodeURIComponent(key)}`;
  const cacheKey = new Request(apiUrl);
  try {
    let res = await caches.default.match(cacheKey);
    if (!res) {
      const live = await fetch(apiUrl, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
      if (!live.ok) return null;
      res = new Response(live.body, live);
      res.headers.delete('set-cookie');
      res.headers.set('cache-control', `public, max-age=${EVENT_CACHE_SECONDS}`);
      ctx.waitUntil(caches.default.put(cacheKey, res.clone()));
    }
    const body = await res.json();
    const data = body && body.data !== undefined ? body.data : body;
    const event = data && data.event ? data.event : data;
    return event && typeof event.title === 'string' ? event : null;
  } catch {
    return null;
  }
}

function withEventMeta(shell, event, url, method) {
  const title = clean(event.title) || SITE_NAME;
  const description = describe(event);
  const image = absoluteHttp(event.bannerImage, url) || absoluteHttp(event.eventPoster, url) || `${url.origin}/og-default.png`;
  const canonical = event.slug ? `${url.origin}/e/${encodeURIComponent(event.slug)}` : `${url.origin}${url.pathname}`;

  const tags = [
    ['name', 'description', description],
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', SITE_NAME],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:url', canonical],
    ['property', 'og:image', image],
    ['property', 'og:image:secure_url', image],
    ['property', 'og:image:alt', title],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', image],
  ]
    .map(([attr, key, value]) => `<meta ${attr}="${key}" content="${esc(value)}" />`)
    .concat(`<link rel="canonical" href="${esc(canonical)}" />`)
    .join('\n    ');

  const drop = { element: (el) => el.remove() };
  const rewritten = new HTMLRewriter()
    .on('title', { element: (el) => el.setInnerContent(`${title} | ${SITE_NAME}`) })
    // Replace the site-wide defaults from index.html with this event's values.
    .on('meta[name="description"]', drop)
    .on('meta[property^="og:"]', drop)
    .on('meta[name^="twitter:"]', drop)
    .on('link[rel="canonical"]', drop)
    .on('head', { element: (el) => el.append(`\n    ${tags}\n  `, { html: true }) })
    .transform(shell);

  const res = new Response(method === 'HEAD' ? null : rewritten.body, rewritten);
  // The body no longer matches index.html's validators.
  res.headers.delete('etag');
  res.headers.delete('last-modified');
  res.headers.delete('content-length');
  return res;
}

function describe(event) {
  const where = event.mode === 'ONLINE' ? 'Online' : clean(event.venueName);
  const lead = [clean(event.subtitle), formatDate(event.startDate), where].filter(Boolean).join(' · ');
  const body = clean(stripMarkup(event.description));
  const text = [lead, body].filter(Boolean).join(' — ');
  return truncate(text || `Register for ${clean(event.title)} on ${SITE_NAME}.`, DESCRIPTION_MAX);
}

function formatDate(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

function absoluteHttp(value, base) {
  if (!value || typeof value !== 'string') return null;
  try {
    const u = new URL(value, base);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

const clean = (s) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '');
const stripMarkup = (s) => (typeof s === 'string' ? s.replace(/<[^>]*>/g, ' ').replace(/[*_#`~>]+/g, ' ') : '');
const truncate = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
