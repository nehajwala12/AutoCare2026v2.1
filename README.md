# Ares commercial diligence (password-protected site)

The site is `index.html`: CreditSwan's commercial diligence for Ares Management on automotive repair and tire replacement and the three active opportunities (Monro, Main Street Automotive, Straightaway), dated 5 October 2026, with the Monro term-sheet section. `middleware.js` shows a sign-in page that asks for one thing, the password, before anything is served. There is no username.

- Password: `AutoCare2026`
- After the password is entered, the browser stays signed in for 12 hours (a secure, HttpOnly cookie); closing that window and coming back within that time does not ask again.

## Deploy

Vercel detects no framework. Leave Build Command and Output Directory empty (Framework Preset: Other).

**Vercel CLI** (from this folder):

    npx vercel        # first time: link or create the project
    npx vercel --prod

**GitHub**: push this folder to a private repository, then in Vercel choose Add New, then Project, then import that repository and Deploy.

To serve the site from a project that already exists, link this folder to that project when the CLI asks (or replace the repository's contents with this folder's) and deploy with `--prod`.

## Change the password

In the Vercel project, go to Settings, then Environment Variables. Add `SITE_PASSWORD` with the new value and redeploy. Without it, the default in `middleware.js` (`AutoCare2026`) applies.

## Notes

- Search engines are told not to index the site (`X-Robots-Tag` header and `robots.txt`).
- The brand fonts are embedded in `index.html`; the page also requests Google Fonts and reads correctly without them. Everything else is inside `index.html`.
- `middleware.js` serves the sign-in page and checks the password, `vercel.json` sets the headers, `package.json` and `package-lock.json` declare the one dependency (`@vercel/functions`), and `.gitignore` keeps `node_modules` and `.vercel` out of the repository.
