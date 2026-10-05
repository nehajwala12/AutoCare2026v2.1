import { next } from '@vercel/functions';

// Password protection for the whole site (HTTP Basic Auth).
// Any username is accepted; the password is SITE_PASSWORD if set in
// the Vercel project's environment variables, otherwise the default below.
const DEFAULT_PASSWORD = 'AutoCare2026';

export default function middleware(request) {
  const password = process.env.SITE_PASSWORD || DEFAULT_PASSWORD;
  const header = request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    let decoded = '';
    try {
      decoded = atob(encoded);
    } catch (e) {
      decoded = '';
    }
    const supplied = decoded.slice(decoded.indexOf(':') + 1);
    if (decoded.includes(':') && supplied === password) {
      return next();
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="CreditSwan", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}
