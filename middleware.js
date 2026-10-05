import { next } from '@vercel/functions';

// Password protection for the whole site: a password-only sign-in page (no username).
// The password is SITE_PASSWORD if set in the Vercel project's environment variables,
// otherwise the default below. A correct password sets a signed-in cookie for 12 hours.
const DEFAULT_PASSWORD = 'AutoCare2026';
const COOKIE = 'cs_access';
const MAX_AGE = 60 * 60 * 12;
const SIGN_IN_PATH = '/__signin';

async function token(password) {
  const data = new TextEncoder().encode('creditswan-site:' + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

function safePath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith(SIGN_IN_PATH) ? value : '/';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

function signInPage(returnTo, failed) {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>CreditSwan · Sign in</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Manrope:wght@400;500;700&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
<style>
:root{--ink:#16211F;--cream:#F4EFE6;--gold:#A98543;--teal:#1C4A45;--claret:#5C2B2E;--line:rgba(22,33,31,.14);--muted:rgba(22,33,31,.78)}
*{box-sizing:border-box}html,body{margin:0;min-height:100%}
body{background:var(--cream);color:var(--ink);font:15px/1.55 Manrope,-apple-system,sans-serif;border-top:4px solid var(--gold);display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
main{width:100%;max-width:420px;border:1px solid var(--line);padding:40px 32px 32px}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:28px}
.brand span{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:24px;letter-spacing:-.3px}
.label{font:500 11px 'IBM Plex Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;color:var(--teal)}
h1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:30px;letter-spacing:-.5px;line-height:1.15;margin:8px 0 10px}
p{margin:0 0 24px;color:var(--muted)}
label{display:block;margin-bottom:8px}
input{width:100%;font:16px 'IBM Plex Mono',monospace;color:var(--ink);background:transparent;border:1px solid rgba(22,33,31,.30);border-radius:2px;padding:12px}
input:focus{outline:2px solid var(--gold);outline-offset:1px}
button{margin-top:16px;width:100%;background:var(--gold);color:var(--ink);border:0;border-radius:4px;padding:13px;font:500 12px 'IBM Plex Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer}
.error{margin:14px 0 0;color:var(--claret);font:500 11px 'IBM Plex Mono',monospace;letter-spacing:1px;text-transform:uppercase}
</style></head>
<body><main>
<div class="brand"><svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M8 30c0-9 6-16 15-16 4 0 7 1 9 4-2-1-4-1-6 0 3 0 5 2 6 5-4-2-8-1-11 2-3 3-8 4-13 5z" fill="#16211F"/><circle cx="30.5" cy="15.5" r="1.4" fill="#A98543"/></svg><span>CreditSwan</span></div>
<div class="label">Confidential · For Ares Management</div>
<h1>Enter the password to open the document</h1>
<p>Commercial diligence on automotive repair and tire replacement.</p>
<form method="post" action="${SIGN_IN_PATH}">
<label class="label" for="password">Password</label>
<input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
<input type="hidden" name="next" value="${escapeHtml(returnTo)}">
<button type="submit">Open</button>
${failed ? '<p class="error" role="alert">That password is not correct</p>' : ''}
</form>
</main></body></html>`;
  return new Response(html, { status: failed ? 401 : 200, headers: HEADERS });
}

export default async function middleware(request) {
  const password = process.env.SITE_PASSWORD || DEFAULT_PASSWORD;
  const expected = await token(password);
  const url = new URL(request.url);

  if (url.pathname === SIGN_IN_PATH) {
    if (request.method !== 'POST') return signInPage('/', false);
    let supplied = '';
    let returnTo = '/';
    try {
      const form = await request.formData();
      supplied = String(form.get('password') || '');
      returnTo = safePath(String(form.get('next') || '/'));
    } catch (e) {
      supplied = '';
    }
    if (supplied === password) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: new URL(returnTo, url).toString(),
          'Set-Cookie': `${COOKIE}=${expected}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          'Cache-Control': 'no-store',
        },
      });
    }
    return signInPage(returnTo, true);
  }

  if (readCookie(request, COOKIE) === expected) return next();
  return signInPage(safePath(url.pathname + url.search), false);
}
